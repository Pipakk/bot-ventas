interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
  href?: string;
}

export function StatCard({ label, value, helper, href }: StatCardProps) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <p className="text-muted">{label}</p>
      {href ? (
        <a href={href} className="text-xl font-semibold text-primary-300 hover:underline">
          {value}
        </a>
      ) : (
        <p className="text-xl font-semibold text-slate-50">{value}</p>
      )}
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

