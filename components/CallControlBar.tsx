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
  const minutes = Math.floor(durationSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (durationSeconds % 60).toString().padStart(2, "0");

  let statusLabel = "Preparando llamada...";
  if (status === "ringing") statusLabel = "Llamando…";
  if (status === "connecting") statusLabel = "Conectando…";
  if (status === "live") {
    if (isSpeaking) statusLabel = "El prospecto está hablando";
    else if (isListening) statusLabel = "Escuchando (habla ahora)";
    else statusLabel = "En llamada";
  }
  if (status === "ended") statusLabel = "Llamada finalizada";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span
            className={`inline-flex h-2 w-2 rounded-full ${
              status === "live"
                ? "bg-emerald-400 animate-pulse"
                : status === "ended"
                ? "bg-slate-500"
                : "bg-amber-400"
            }`}
          />
          <span>{statusLabel}</span>
        </div>
        <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-mono text-slate-200">
          {minutes}:{seconds}
        </span>
      </div>
      <div className="flex items-center justify-center gap-4">
        {extraActions}
        <button
          type="button"
          onClick={onEnd}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40 hover:bg-red-500"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

