interface ScoreBreakdownProps {
  items: { label: string; value: number | null }[];
}

export function ScoreBreakdown({ items }: ScoreBreakdownProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const value = item.value ?? 0;
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{item.label}</span>
              <span className="text-slate-200">{value}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-sky-400"
                style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

