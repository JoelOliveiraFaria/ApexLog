import { useEffect, useMemo, useState } from 'react';
import { type Trip, type TelemetryPoint } from '../types';
import { ArrowLeft, RefreshCw, AlertTriangle, Gauge, Thermometer, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TelemetryStatTile } from './TelemetryStatTile';
import { downsampleLTTB } from '../utils/downsample';

interface TripDetailsProps {
  tripId: string;
  onBack: () => void;
}

interface ChartRow extends TelemetryPoint {
  timeDisplay: string;
}

interface RechartsHoverState {
  isTooltipActive?: boolean;
  activePayload?: Array<{ payload: ChartRow }>;
}

// Acima deste número de pontos o Recharts começa a perder fluidez a renderizar/interagir
const DOWNSAMPLE_THRESHOLD = 500;

export function TripDetails({ tripId, onBack }: TripDetailsProps) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [perfHover, setPerfHover] = useState<ChartRow | null>(null);
  const [engineHover, setEngineHover] = useState<ChartRow | null>(null);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const response = await fetch(`http://192.168.1.194:5084/api/trips/${tripId}`);
        if (!response.ok) throw new Error('Erro ao carregar detalhes da viagem.');
        const data = await response.json();
        setTrip(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTripDetails();
  }, [tripId]);

  // Tratamento do tempo para o eixo X do gráfico (ex: transformar timestamps em segundos relativos de viagem)
  const chartData = useMemo<ChartRow[]>(
    () =>
      trip?.telemetryPoints?.map((p, index) => ({
        ...p,
        timeDisplay: `${index}s`,
      })) ?? [],
    [trip]
  );

  // Downsampling para manter os gráficos fluidos em viagens longas, preservando os picos (LTTB)
  const sampledData = useMemo(
    () => downsampleLTTB(chartData, DOWNSAMPLE_THRESHOLD, 'speedKmh'),
    [chartData]
  );

  const lastPoint = sampledData.length > 0 ? sampledData[sampledData.length - 1] : null;
  const perfDisplay = perfHover ?? lastPoint;
  const engineDisplay = engineHover ?? lastPoint;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <RefreshCw size={40} className="text-emerald-400 animate-spin mb-4" />
        <p className="text-slate-400">A processar gráficos de telemetria...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-center gap-4 text-red-400 max-w-2xl mx-auto mt-10">
        <AlertTriangle size={32} />
        <div>
          <h3 className="font-bold text-white">Erro nos Gráficos</h3>
          <p className="text-sm text-red-300/80 mt-1">{error || 'Dados indisponíveis.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Botão Voltar */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-colors cursor-pointer group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span>Voltar ao Dashboard</span>
      </button>

      {/* Resumo da Viagem Focada */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-emerald-400">
            <Gauge size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Velocidade Média</p>
            <p className="text-2xl font-bold text-white">{trip.avgSpeedKmh} <span className="text-sm font-medium text-slate-400">km/h</span></p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20 text-orange-400">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pico de Rotações</p>
            <p className="text-2xl font-bold text-white">{trip.maxRpm} <span className="text-sm font-medium text-slate-400">rpm</span></p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-sky-500/10 p-3 rounded-2xl border border-sky-500/20 text-sky-400">
            <Thermometer size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Moto Analisada</p>
            <p className="text-2xl font-bold text-white">{trip.motoId}</p>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <p className="text-slate-400">Esta viagem não registou pontos de telemetria contínuos.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Gráfico 1: Performance Dinâmica */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h3 className="text-lg font-bold text-white">Gráfico de Performance (Velocidade & RPM)</h3>
              <div className="flex gap-3">
                <TelemetryStatTile label="Velocidade" value={perfDisplay?.speedKmh ?? '--'} unit="km/h" dotClassName="bg-emerald-400" />
                <TelemetryStatTile label="Rotações" value={perfDisplay?.rpm ?? '--'} unit="rpm" dotClassName="bg-orange-400" />
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sampledData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  onMouseMove={(state: RechartsHoverState) => {
                    if (state?.isTooltipActive && state.activePayload?.length) {
                      setPerfHover(state.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => setPerfHover(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timeDisplay" stroke="#64748b" fontSize={12} />

                  {/* Dois eixos Y independentes para não esmagar as curvas */}
                  <YAxis yAxisId="left" stroke="#10b981" fontSize={12} label={{ value: 'km/h', angle: -90, position: 'insideLeft', fill: '#10b981' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f97316" fontSize={12} label={{ value: 'RPM', angle: 90, position: 'insideRight', fill: '#f97316' }} />

                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                  <Legend />

                  <Line yAxisId="left" type="monotone" dataKey="speedKmh" stroke="#10b981" strokeWidth={3} name="Velocidade" dot={false} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="rpm" stroke="#f97316" strokeWidth={2} name="Rotações (RPM)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Saúde do Motor & Aceleração */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h3 className="text-lg font-bold text-white">Diagnóstico do Motor (Temperatura & Acelerador)</h3>
              <div className="flex gap-3">
                <TelemetryStatTile label="Temp. motor" value={engineDisplay?.engineTempC ?? '--'} unit="ºC" dotClassName="bg-red-400" />
                <TelemetryStatTile label="Acelerador" value={engineDisplay?.throttlePosition ?? '--'} unit="%" dotClassName="bg-purple-400" />
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sampledData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  onMouseMove={(state: RechartsHoverState) => {
                    if (state?.isTooltipActive && state.activePayload?.length) {
                      setEngineHover(state.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => setEngineHover(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timeDisplay" stroke="#64748b" fontSize={12} />

                  <YAxis yAxisId="left" stroke="#ef4444" fontSize={12} label={{ value: 'Temp ºC', angle: -90, position: 'insideLeft', fill: '#ef4444' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#a855f7" fontSize={12} label={{ value: 'Acelerador %', angle: 90, position: 'insideRight', fill: '#a855f7' }} />

                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                  <Legend />

                  <Line yAxisId="left" type="monotone" dataKey="engineTempC" stroke="#ef4444" strokeWidth={2.5} name="Temperatura do Motor" dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="throttlePosition" stroke="#a855f7" strokeWidth={2} name="Abertura do Acelerador" strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
