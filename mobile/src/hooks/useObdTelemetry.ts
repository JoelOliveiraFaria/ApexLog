import { useCallback, useEffect, useRef, useState } from 'react';
import BackgroundService from 'react-native-background-actions';
import { Elm327Client } from '../ble/Elm327Client';
import { OBD_PIDS } from '../obd/pids';
import {
  parseEngineCoolantTemp,
  parseEngineRpm,
  parseThrottlePosition,
  parseVehicleSpeed,
} from '../obd/pidParser';
import { finishTrip, startTrip, uploadTelemetryBatch } from '../api/apexLogApi';
import type { TelemetrySample } from '../types/telemetry';

const POLL_INTERVAL_MS = 150;
const BATCH_FLUSH_SIZE = 20;
const BATCH_FLUSH_INTERVAL_MS = 5000;

/**
 * Opções do foreground service Android usado durante a gravação: mantém o processo vivo
 * (com wake lock) e mostra uma notificação persistente, para que o polling de PIDs não seja
 * suspenso pelo Doze/App Standby quando o ecrã bloqueia ou a app vai para segundo plano.
 */
const RECORDING_SERVICE_OPTIONS = {
  taskName: 'ApexLogTelemetry',
  taskTitle: 'ApexLog a gravar viagem',
  taskDesc: 'A recolher telemetria OBD2 da mota em segundo plano...',
  taskIcon: { name: 'ic_launcher', type: 'mipmap' },
  color: '#10b981',
  foregroundServiceType: ['connectedDevice' as const],
  parameters: {},
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface UseObdTelemetryResult {
  latestSample: TelemetrySample | null;
  isRecording: boolean;
  pointsRecorded: number;
  lastError: string | null;
  startTripRecording: (motoId: string) => Promise<void>;
  /** distanceKm é opcional: se omitida, o backend calcula-a a partir da velocidade OBD2. */
  stopTripRecording: (distanceKm?: number) => Promise<void>;
}

/**
 * Faz o polling contínuo dos PIDs OBD2 (RPM, velocidade, acelerador, temperatura),
 * mantém um buffer local de pontos e envia-os em lotes para a API durante a gravação
 * da viagem, para não perder dados caso a app feche a meio do percurso.
 *
 * Fora da gravação, o polling corre num `setInterval` normal (só serve para as gauges ao
 * vivo, é dispensável se o Android o suspender). Durante a gravação, corre dentro de um
 * foreground service (`react-native-background-actions`) para continuar com o ecrã bloqueado.
 */
export function useObdTelemetry(elm: Elm327Client | null): UseObdTelemetryResult {
  const [latestSample, setLatestSample] = useState<TelemetrySample | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [pointsRecorded, setPointsRecorded] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const isRecordingRef = useRef(false);
  const isBusyRef = useRef(false);
  const tripIdRef = useRef<string | null>(null);
  const pendingBatchRef = useRef<TelemetrySample[]>([]);
  const lastFlushAtRef = useRef(0);

  const flushBatch = useCallback(async () => {
    const tripId = tripIdRef.current;
    if (!tripId || pendingBatchRef.current.length === 0) return;

    const batch = pendingBatchRef.current;
    pendingBatchRef.current = [];

    try {
      await uploadTelemetryBatch(tripId, batch);
    } catch (err) {
      // Devolve os pontos ao início do buffer para nova tentativa no próximo flush
      pendingBatchRef.current = [...batch, ...pendingBatchRef.current];
      setLastError(err instanceof Error ? err.message : 'Falha ao enviar lote de telemetria.');
    }
  }, []);

  const pollOnce = useCallback(async () => {
    if (!elm || isBusyRef.current) return;
    isBusyRef.current = true;

    try {
      const rpmResponse = await elm.queryPid(OBD_PIDS.ENGINE_RPM);
      const speedResponse = await elm.queryPid(OBD_PIDS.VEHICLE_SPEED);
      const throttleResponse = await elm.queryPid(OBD_PIDS.THROTTLE_POSITION);
      const tempResponse = await elm.queryPid(OBD_PIDS.ENGINE_COOLANT_TEMP);

      const sample: TelemetrySample = {
        timestamp: new Date().toISOString(),
        rpm: parseEngineRpm(rpmResponse) ?? 0,
        speedKmh: parseVehicleSpeed(speedResponse) ?? 0,
        throttlePosition: parseThrottlePosition(throttleResponse) ?? 0,
        engineTempC: parseEngineCoolantTemp(tempResponse) ?? 0,
      };

      setLatestSample(sample);

      if (isRecordingRef.current) {
        pendingBatchRef.current.push(sample);
        setPointsRecorded((count) => count + 1);

        const shouldFlushBySize = pendingBatchRef.current.length >= BATCH_FLUSH_SIZE;
        const shouldFlushByTime = Date.now() - lastFlushAtRef.current >= BATCH_FLUSH_INTERVAL_MS;

        if (shouldFlushBySize || shouldFlushByTime) {
          lastFlushAtRef.current = Date.now();
          void flushBatch();
        }
      }
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'Falha na leitura de PIDs OBD2.');
    } finally {
      isBusyRef.current = false;
    }
  }, [elm, flushBatch]);

  // Polling "leve" só para as gauges ao vivo quando não se está a gravar; para durante a
  // gravação para não colidir com o loop do foreground service (o ELM327 só aceita um
  // comando de cada vez).
  useEffect(() => {
    if (!elm || isRecording) return undefined;

    const intervalId = setInterval(() => {
      void pollOnce();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [elm, isRecording, pollOnce]);

  const startTripRecording = useCallback(
    async (motoId: string) => {
      setLastError(null);
      const tripId = await startTrip({ motoId, startTime: new Date().toISOString() });

      tripIdRef.current = tripId;
      pendingBatchRef.current = [];
      lastFlushAtRef.current = Date.now();
      setPointsRecorded(0);
      isRecordingRef.current = true;
      setIsRecording(true);

      await BackgroundService.start(async () => {
        while (BackgroundService.isRunning()) {
          await pollOnce();
          await sleep(POLL_INTERVAL_MS);
        }
      }, RECORDING_SERVICE_OPTIONS);
    },
    [pollOnce]
  );

  const stopTripRecording = useCallback(
    async (distanceKm?: number) => {
      isRecordingRef.current = false;
      setIsRecording(false);

      await BackgroundService.stop();
      await flushBatch();

      const tripId = tripIdRef.current;
      if (tripId) {
        await finishTrip(tripId, { endTime: new Date().toISOString(), distanceKm });
      }
      tripIdRef.current = null;
    },
    [flushBatch]
  );

  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        BackgroundService.stop().catch(() => {});
      }
    };
  }, []);

  return { latestSample, isRecording, pointsRecorded, lastError, startTripRecording, stopTripRecording };
}
