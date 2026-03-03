import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}

export function Badge({ children, tone = "default" }: BadgeProps) {
  const base = "badge-pill";
  const toneClass =
    tone === "success"
      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
      : tone === "warning"
      ? "bg-amber-500/10 text-amber-300 border border-amber-500/40"
      : tone === "danger"
      ? "bg-red-500/10 text-red-300 border border-red-500/40"
      : "bg-slate-800/80 text-slate-200 border border-slate-600/70";
  return <span className={`${base} ${toneClass}`}>{children}</span>;
}

