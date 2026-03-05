interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
  href?: string;
}

export function StatCard({ label, value, helper, href }: StatCardProps) {
  return (
    <div className="card p-4 sm:p-5 flex flex-col gap-1">
      <p className="text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      {href ? (
        <a
          href={href}
          className="text-xl font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:underline"
          style={{ color: "var(--primary)" }}
        >
          {value}
        </a>
      ) : (
        <p className="text-xl font-semibold" style={{ color: "var(--text)" }}>{value}</p>
      )}
      {helper && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{helper}</p>
      )}
    </div>
  );
}
