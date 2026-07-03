import { type Trip } from '../types';
import { Calendar } from 'lucide-react';

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  const formattedDate = new Date(trip.startTime).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all cursor-pointer shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar size={16} />
          <span className="text-sm font-medium">{formattedDate}</span>
        </div>
        <span className="px-3 py-1 bg-slate-800 text-slate-300 font-semibold text-xs rounded-full border border-slate-700">
          {trip.motoId}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Distância</p>
          <div className="flex items-baseline gap-1 text-white">
            <span className="text-xl font-bold">{trip.distanceKm}</span>
            <span className="text-xs text-slate-400 font-medium">km</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Velo. Máx</p>
          <div className="flex items-baseline gap-1 text-emerald-400">
            <span className="text-xl font-bold">{trip.maxSpeedKmh}</span>
            <span className="text-xs text-slate-400 font-medium">km/h</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">RPM Máx</p>
          <div className="flex items-baseline gap-1 text-orange-400">
            <span className="text-xl font-bold">{trip.maxRpm}</span>
            <span className="text-xs text-slate-400 font-medium">rpm</span>
          </div>
        </div>
      </div>
    </div>
  );
}