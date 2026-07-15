interface TelemetryStatTileProps {
  label: string;
  value: string | number;
  unit: string;
  dotClassName: string;
}

/** Pequeno widget de leitura ao vivo — mostra o valor da série no ponto do gráfico sob o cursor. */
export function TelemetryStatTile({ label, value, unit, dotClassName }: TelemetryStatTileProps) {
  return (
    <div className="bg-slate-100/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 min-w-[7rem]">
      <div className="flex items-center gap-2 mb-1">
        <span className={`h-2 w-2 rounded-full shrink-0 ${dotClassName}`} />
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-slate-900 dark:text-white leading-none">
        {value} <span className="text-xs font-medium text-slate-500">{unit}</span>
      </p>
    </div>
  );
}
