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
    <div
      className="rounded-2xl flex flex-col h-full"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <p
          className="text-xs font-medium uppercase tracking-[0.16em]"
          style={{ color: "var(--text-muted)" }}
        >
          Transcripción
        </p>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="btn-ghost text-[11px] px-2 py-1"
            style={{ minHeight: "auto" }}
            aria-label={collapsed ? "Mostrar transcripción" : "Ocultar transcripción"}
          >
            {collapsed ? "Mostrar" : "Ocultar"}
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 text-sm" role="log" aria-live="polite" aria-label="Transcripción de la llamada">
          {messages.map((m: TranscriptMessage, i: number) => (
            <div
              key={i}
              className={`flex ${m.speaker === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[80%] rounded-2xl px-3 py-2"
                style={
                  m.speaker === "user"
                    ? { backgroundColor: "var(--primary)", color: "#fff" }
                    : { backgroundColor: "var(--surface-2)", color: "var(--text)" }
                }
              >
                <p className="text-[10px] mb-0.5" style={{ opacity: 0.65 }}>
                  {m.speaker === "user" ? "Tú" : "Prospecto"}
                </p>
                <p className="text-sm leading-snug">{m.text}</p>
              </div>
            </div>
          ))}
          {interimMessage?.text && (
            <div className="flex justify-end">
              <div
                className="max-w-[80%] rounded-2xl px-3 py-2 border border-dashed"
                style={{ backgroundColor: "var(--surface-2)", color: "var(--text-muted)", borderColor: "var(--border)" }}
              >
                <p className="text-[10px] mb-0.5" style={{ opacity: 0.65 }}>Escuchando…</p>
                <p className="italic text-sm">{interimMessage.text}</p>
              </div>
            </div>
          )}
          {messages.length === 0 && !interimMessage?.text && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              La conversación aparecerá aquí en cuanto empecéis a hablar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
