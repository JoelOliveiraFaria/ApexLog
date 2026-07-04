import type { TelemetrySample } from '../types/telemetry';

// Túnel ngrok — expõe a API local à internet para uso em viagem (fora da rede local).
const API_BASE_URL = 'https://neomi-unhastened-gunner.ngrok-free.dev';

export interface StartTripPayload {
  motoId: string;
  startTime: string;
}

export interface FinishTripPayload {
  endTime: string;
  /** Se omitida, o backend calcula-a a partir da velocidade OBD2 integrada ao longo do tempo. */
  distanceKm?: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
    ...init,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Falha na API (${response.status}) em ${path}: ${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** Cria uma viagem em aberto no backend e devolve o seu Id para streaming de telemetria. */
export async function startTrip(payload: StartTripPayload): Promise<string> {
  const result = await request<{ tripId: string }>('/api/trips/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return result.tripId;
}

/** Envia um lote de pontos de telemetria já registados para uma viagem em curso (bulk insert). */
export async function uploadTelemetryBatch(tripId: string, points: TelemetrySample[]): Promise<void> {
  await request(`/api/trips/${tripId}/telemetry`, {
    method: 'POST',
    body: JSON.stringify({ points }),
  });
}

/** Fecha a viagem e despoleta o cálculo das métricas agregadas no backend. */
export async function finishTrip(tripId: string, payload: FinishTripPayload): Promise<void> {
  await request(`/api/trips/${tripId}/finish`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
