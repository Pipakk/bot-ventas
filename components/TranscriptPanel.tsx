interface TranscriptMessage {
  speaker: "user" | "prospect";
  text: string;
  isInterim?: boolean;
}

interface TranscriptPanelProps {
  messages: TranscriptMessage[];
  interimMessage?: { speaker: "user" | "prospect"; text: string; isInterim?: boolean };
  collapsed?: boolean;
  onToggle?: () => void;
}

export function TranscriptPanel({ messages, interimMessage, collapsed, onToggle }: TranscriptPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80">
        <p className="text-xs font-medium text-slate-300 uppercase tracking-[0.16em]">
          Transcripción
        </p>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="btn-ghost text-[11px] px-2 py-1"
          >
            {collapsed ? "Mostrar" : "Ocultar"}
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 text-sm">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.speaker === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-1.5 ${
                  m.speaker === "user"
                    ? "bg-primary-500/80 text-white"
                    : "bg-slate-800/90 text-slate-100"
                }`}
              >
                <p className="text-[11px] opacity-70 mb-0.5">
                  {m.speaker === "user" ? "Tú" : "Prospecto"}
                </p>
                <p>{m.text}</p>
              </div>
            </div>
          ))}
          {interimMessage?.text && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl px-3 py-1.5 bg-slate-700/60 text-slate-400 border border-dashed border-slate-600">
                <p className="text-[11px] opacity-70 mb-0.5">Escuchando…</p>
                <p className="italic">{interimMessage.text}</p>
              </div>
            </div>
          )}
          {messages.length === 0 && !interimMessage?.text && (
            <p className="text-xs text-slate-500">
              La conversación aparecerá aquí en cuanto empecéis a hablar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

