import type { ReactNode } from "react";

interface CallControlBarProps {
  onEnd: () => void;
  status: "ringing" | "connecting" | "live" | "ended";
  isListening: boolean;
  isSpeaking: boolean;
  durationSeconds: number;
  extraActions?: ReactNode;
}

export function CallControlBar({
  onEnd,
  status,
  isListening,
  isSpeaking,
  durationSeconds,
  extraActions,
}: CallControlBarProps) {
  const minutes = Math.floor(durationSeconds / 60).toString().padStart(2, "0");
  const seconds = (durationSeconds % 60).toString().padStart(2, "0");

  let statusLabel = "Preparando simulación...";
  if (status === "ringing") statusLabel = "Llamando al prospecto…";
  if (status === "connecting") statusLabel = "Conectando…";
  if (status === "live") {
    if (isSpeaking) statusLabel = "El prospecto está hablando";
    else if (isListening) statusLabel = "Escuchándote — habla ahora";
    else statusLabel = "En llamada";
  }
  if (status === "ended") statusLabel = "Simulación finalizada";

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl px-4 py-3 w-full"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <span
            className={`inline-flex h-2 w-2 rounded-full ${
              status === "live"
                ? "bg-emerald-400 animate-pulse"
                : status === "ended"
                ? "bg-slate-500"
                : "bg-amber-400 animate-pulse"
            }`}
            aria-hidden="true"
          />
          <span>{statusLabel}</span>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-mono"
          style={{ backgroundColor: "var(--surface-2)", color: "var(--text)" }}
          aria-label={`Duración: ${minutes} minutos ${seconds} segundos`}
        >
          {minutes}:{seconds}
        </span>
      </div>
      <div className="flex items-center justify-center gap-4">
        {extraActions}
        <button
          type="button"
          onClick={onEnd}
          disabled={status === "ended"}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: "#dc2626", boxShadow: "0 4px 14px rgba(220,38,38,0.4)" }}
          aria-label="Colgar llamada"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}
