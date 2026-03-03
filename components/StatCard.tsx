interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
}

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <p className="text-muted">{label}</p>
      <p className="text-xl font-semibold text-slate-50">{value}</p>
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

