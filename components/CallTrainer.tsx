"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, type AvatarMood } from "@/components/Avatar";
import { playRingTone } from "@/modules/audio/ring";
import { speakAsHuman, cancelSpeech } from "@/modules/audio/speech";
import { CallControlBar } from "@/components/CallControlBar";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { getScenarioById } from "@/lib/scenarios";

interface SessionConfig {
  industry: string;
  difficulty: "normal" | "hard";
  prospectType: string;
  personality: string;
  scenarioId?: string;
  scenarioContext?: string;
  aiApiKey?: string;
  aiProvider?: "openai" | "groq" | "ollama";
  voiceUri?: string;
}

interface TranscriptEntry {
  speaker: "user" | "prospect";
  text: string;
  startMs?: number;
  endMs?: number;
}

interface MessageHistoryItem {
  role: "user" | "assistant";
  content: string;
}

type CallPhase = "ringing" | "connecting" | "live" | "ended";

export function CallTrainer({
  sessionConfig,
  token,
  onExit,
}: {
  sessionConfig: SessionConfig;
  token: string;
  onExit: () => void;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<CallPhase>("ringing");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mood, setMood] = useState<AvatarMood>("neutral");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState("");
  const [resultSessionId, setResultSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [transcriptCollapsed, setTranscriptCollapsed] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  const messageHistoryRef = useRef<MessageHistoryItem[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const ringStopRef = useRef<(() => void) | null>(null);
  const callStartMsRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  sessionIdRef.current = sessionId;

  const scenario = useMemo(
    () => (sessionConfig.scenarioId ? getScenarioById(sessionConfig.scenarioId) : undefined),
    [sessionConfig.scenarioId]
  );

  const abortSpeaking = useCallback(() => {
    cancelSpeech();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (!text.trim()) {
      onDone?.();
      return;
    }
    abortSpeaking();
    setIsSpeaking(true);
    speakAsHuman(text, () => {
      setIsSpeaking(false);
      onDone?.();
    }, sessionConfig.voiceUri);
  }, [abortSpeaking, sessionConfig.voiceUri]);

  const sendTranscript = useCallback(
    async (entries: TranscriptEntry[]) => {
      if (!sessionId || !token || entries.length === 0) return;
      await fetch("/api/call/transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId, entries }),
      });
    },
    [sessionId, token]
  );

  const getReply = useCallback(
    async (userText: string, userStartMs: number, userEndMs: number): Promise<string | null> => {
      if (!sessionId || !token) return null;
      const body: Record<string, unknown> = {
        sessionId,
        userText,
        industry: sessionConfig.industry,
        difficulty: sessionConfig.difficulty,
        prospectType: sessionConfig.prospectType,
        personality: sessionConfig.personality,
        aiApiKey: sessionConfig.aiApiKey,
        aiProvider: sessionConfig.aiProvider ?? "openai",
        scenarioContext: sessionConfig.scenarioContext,
        messageHistory: messageHistoryRef.current,
      };
      const res = await fetch("/api/call/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error en la respuesta");
      if (data.mood) setMood(data.mood as AvatarMood);
      if (data.reply) {
        messageHistoryRef.current = [
          ...messageHistoryRef.current,
          { role: "user", content: userText },
          { role: "assistant", content: data.reply },
        ];
      }
      const delayMs = data.delayMs ?? 500;
      await new Promise((r) => setTimeout(r, delayMs));
      return data.reply ?? null;
    },
    [sessionId, token, sessionConfig]
  );

  const processUserInput = useCallback(
    async (userText: string, userStartMs: number, userEndMs: number) => {
      if (!userText.trim()) return;
      setTranscript((t) => [...t, { speaker: "user", text: userText, startMs: userStartMs, endMs: userEndMs }]);
      try {
        const reply = await getReply(userText, userStartMs, userEndMs);
        if (!reply) return;
        const replyStartMs = Date.now() - callStartMsRef.current;
        setTranscript((t) => [...t, { speaker: "prospect", text: reply, startMs: replyStartMs }]);
        speak(reply, () => {
          setIsListening(true);
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
        setIsListening(true);
      }
    },
    [getReply, speak]
  );

  useEffect(() => {
    if (phase !== "ringing") return;
    (async () => {
      const res = await fetch("/api/call/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          industry: sessionConfig.industry,
          difficulty: sessionConfig.difficulty,
          prospectType: sessionConfig.prospectType,
          personality: sessionConfig.personality,
          aiApiKey: sessionConfig.aiApiKey,
          aiProvider: sessionConfig.aiProvider ?? "openai",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al iniciar");
        onExit();
        return;
      }
      setSessionId(data.sessionId);
      sessionIdRef.current = data.sessionId;
      callStartMsRef.current = Date.now();
      ringStopRef.current = playRingTone(3);
      const t = setTimeout(() => {
        if (ringStopRef.current) ringStopRef.current();
        setPhase("connecting");
        setTimeout(async () => {
          setPhase("live");
          const sid = sessionIdRef.current;
          const tk = token;
          if (sid && tk) {
            try {
              const res = await fetch("/api/call/reply", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
                body: JSON.stringify({
                  sessionId: sid,
                  userText: "",
                  industry: sessionConfig.industry,
                  difficulty: sessionConfig.difficulty,
                  prospectType: sessionConfig.prospectType,
                  personality: sessionConfig.personality,
                  aiApiKey: sessionConfig.aiApiKey,
                  aiProvider: sessionConfig.aiProvider ?? "openai",
                  scenarioContext: sessionConfig.scenarioContext,
                  messageHistory: [],
                }),
              });
              const data = await res.json();
              const greeting = (res.ok && data.reply) ? data.reply : "Sí, dígame.";
              if (data.mood) setMood(data.mood as AvatarMood);
              setTranscript((t) => [...t, { speaker: "prospect", text: greeting, startMs: 0 }]);
              speak(greeting, () => setIsListening(true));
            } catch {
              const greeting = "Sí, dígame.";
              setTranscript((t) => [...t, { speaker: "prospect", text: greeting, startMs: 0 }]);
              speak(greeting, () => setIsListening(true));
            }
          } else {
            const greeting = "Sí, dígame.";
            setTranscript((t) => [...t, { speaker: "prospect", text: greeting, startMs: 0 }]);
            speak(greeting, () => setIsListening(true));
          }
        }, 800);
      }, 3200);
      return () => clearTimeout(t);
    })();
  }, [phase, token, sessionConfig, speak, onExit]);

  useEffect(() => {
    if (phase !== "live") return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - callStartMsRef.current) / 1000);
      setElapsedSeconds(diff >= 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== "live" || !isListening) return;
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "es-ES";
    rec.maxAlternatives = 1;
    rec.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript.trim();
      if (result.isFinal) {
        setInterimTranscript("");
        if (!text) return;
        const startMs = callStartMsRef.current ? Math.max(0, (Date.now() - callStartMsRef.current) - 3000) : 0;
        const endMs = startMs + 2000;
        abortSpeaking();
        setIsListening(false);
        processUserInput(text, startMs, endMs);
      } else {
        setInterimTranscript(text);
      }
    };
    rec.onend = () => {
      setInterimTranscript("");
      if (phase === "live" && !isSpeaking) setIsListening(true);
    };
    rec.onerror = () => {
      setInterimTranscript("");
      if (phase === "live") setTimeout(() => setIsListening(true), 300);
    };
    rec.start();
    recognitionRef.current = rec;
    return () => {
      try { rec.abort(); } catch {}
      recognitionRef.current = null;
      setInterimTranscript("");
    };
  }, [phase, isListening, isSpeaking, processUserInput, abortSpeaking]);

  const hangUp = useCallback(async () => {
    abortSpeaking();
    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
    } catch {}
    setPhase("ended");
    if (!sessionId || !token) {
      onExit();
      return;
    }
    await sendTranscript(transcript);
    const res = await fetch("/api/call/end", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionId,
        ai:
          sessionConfig.mode === "ai"
            ? {
                provider: sessionConfig.aiProvider ?? "openai",
                apiKey: sessionConfig.aiApiKey,
                scenarioName: sessionConfig.scenarioId,
              }
            : undefined,
      }),
    });
    const data = await res.json();
    if (res.ok && data.sessionId) {
      setResultSessionId(data.sessionId);
      router.push(`/results/${data.sessionId}`);
    } else {
      setError(data.error ?? "Error al colgar");
      onExit();
    }
  }, [sessionId, token, transcript, sendTranscript, abortSpeaking, router, onExit]);

  if (resultSessionId) return null;

  return (
    <div className="card p-4 sm:p-6 lg:p-7">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
        <div className="flex flex-col items-center gap-4">
          <Avatar isSpeaking={phase === "live" && isSpeaking} mood={mood} />
          <CallControlBar
            onEnd={hangUp}
            status={phase}
            isListening={isListening}
            isSpeaking={isSpeaking}
            durationSeconds={elapsedSeconds}
          />
        </div>

        <div className="flex flex-col gap-3 h-full">
          <TranscriptPanel
            messages={transcript.map((t) => ({
              speaker: t.speaker,
              text: t.text,
            }))}
            interimMessage={interimTranscript ? { speaker: "user" as const, text: interimTranscript, isInterim: true } : undefined}
            collapsed={transcriptCollapsed}
            onToggle={() => setTranscriptCollapsed((v) => !v)}
          />
          {phase === "ringing" && (
            <p className="text-slate-400 text-xs sm:text-sm animate-pulse">
              Llamando al prospecto…
            </p>
          )}
          {phase === "connecting" && (
            <p className="text-slate-400 text-xs sm:text-sm">
              Conectando con el prospecto…
            </p>
          )}
          {phase === "ended" && !resultSessionId && (
            <p className="text-slate-400 text-xs sm:text-sm">
              Finalizando y calculando puntuación…
            </p>
          )}
          {scenario?.prepNotes && (
            <div className="mt-1 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-[11px] text-slate-200 space-y-1">
              <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Notas previas del prospecto
              </span>
              <p className="text-slate-300">{scenario.prepNotes}</p>
            </div>
          )}
          {error && <p className="text-red-400 text-xs sm:text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
}
