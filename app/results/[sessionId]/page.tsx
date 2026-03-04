"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore, useCallConfigStore } from "@/lib/store";

interface ScoreData {
  totalScore: number;
  objectionHandling: number | null;
  questionQuality: number | null;
  conversationControl: number | null;
  talkListenRatio: number | null;
  confidence: number | null;
  persistence: number | null;
  spinUsage: number | null;
  tonalityProxy: number | null;
  suggestionsJson: string | null;
  weakResponsesJson: string | null;
  expertAnalysis?: string | null;
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const callConfig = useCallConfigStore();
  const [session, setSession] = useState<{ id: string; durationSeconds: number | null; difficulty: string } | null>(null);
  const [transcript, setTranscript] = useState<{ speaker: string; text: string }[]>([]);
  const [score, setScore] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    const id = params.sessionId as string;
    if (!id) return;
    fetch(`/api/call/score/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSession(data.session);
        setTranscript(data.transcript ?? []);
        setScore(data.score);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [token, params.sessionId, router]);

  if (!token) return null;
  if (loading) return <p className="text-slate-400">Preparando tu análisis...</p>;
  if (error) return <p className="text-red-400">No se pudo cargar el análisis. Inténtalo de nuevo.</p>;
  if (!session || !score) return <p className="text-slate-400">No hay datos para esta sesión.</p>;

  const alreadyAnalyzed = !!score.expertAnalysis;

  const suggestions: string[] = score.suggestionsJson ? JSON.parse(score.suggestionsJson) : [];
  const weakResponses: string[] = score.weakResponsesJson ? JSON.parse(score.weakResponsesJson) : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Link href="/dashboard" className="text-slate-400 hover:text-white">← Mi panel</Link>
        <Link href="/dashboard/calls" className="text-slate-400 hover:text-white">Mis simulaciones</Link>
      </div>
      <div className="card p-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Resultado de tu simulación</h2>
            <p className="text-slate-400 text-sm">
              {session.durationSeconds ?? 0}s · Dificultad: {session.difficulty === "hard" ? "Difícil" : "Normal"}
            </p>
          </div>
          {!alreadyAnalyzed && (
            <button
              type="button"
              onClick={async () => {
                setError("");
                const provider = callConfig.aiProvider;
                const apiKey = callConfig.aiApiKey?.trim();
                const needsKey = provider !== "ollama";
                if (needsKey && !apiKey) {
                  setError(
                    provider === "groq"
                      ? "Introduce tu API key de Groq en la configuración para analizar con IA."
                      : "Introduce tu API key de OpenAI en la configuración para analizar con IA."
                  );
                  return;
                }
                try {
                  setAnalyzing(true);
                  const res = await fetch("/api/call/review", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      sessionId: session.id,
                      ai: {
                        provider,
                        apiKey,
                        scenarioName: callConfig.scenarioId,
                      },
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error ?? "Error al analizar la llamada");
                  if (data.score) {
                    setScore((prev) =>
                      prev
                        ? {
                            ...prev,
                            ...data.score,
                          }
                        : data.score
                    );
                  }
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Error al analizar la llamada");
                } finally {
                  setAnalyzing(false);
                }
              }}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              {analyzing ? "Analizando..." : "Obtener feedback experto"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="rounded-full h-20 w-20 flex items-center justify-center bg-primary-500/20 border-2 border-primary-500">
            <span className="text-2xl font-bold text-primary-300">{score.totalScore}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-400">Manejo de objeciones:</span> {score.objectionHandling ?? "-"}</div>
            <div><span className="text-slate-400">Calidad de preguntas:</span> {score.questionQuality ?? "-"}</div>
            <div><span className="text-slate-400">Control de la conv.:</span> {score.conversationControl ?? "-"}</div>
            <div><span className="text-slate-400">Ratio hablar/escuchar:</span> {score.talkListenRatio ?? "-"}</div>
            <div><span className="text-slate-400">Confianza:</span> {score.confidence ?? "-"}</div>
            <div><span className="text-slate-400">Persistencia:</span> {score.persistence ?? "-"}</div>
            <div><span className="text-slate-400">Técnica SPIN:</span> {score.spinUsage ?? "-"}</div>
            <div><span className="text-slate-400">Tonalidad:</span> {score.tonalityProxy ?? "-"}</div>
          </div>
        </div>
        {score.expertAnalysis && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Feedback experto</h3>
            <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-3 text-sm text-slate-200 whitespace-pre-line">
              {score.expertAnalysis}
            </div>
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Qué hacer diferente</h3>
            <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
              {suggestions.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {weakResponses.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Respuestas a reforzar</h3>
            <ul className="text-slate-400 text-sm space-y-1">
              {weakResponses.map((r: string, i: number) => (
                <li key={i} className="bg-slate-800/50 rounded px-2 py-1">“{r}”</li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Transcripción completa</h3>
          <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-sm space-y-2">
            {transcript.map((e: { speaker: string; text: string }, i: number) => (
              <p key={i} className={e.speaker === "user" ? "text-primary-300" : "text-slate-400"}>
                <span className="font-medium">{e.speaker === "user" ? "Tú: " : "Prospecto: "}</span>
                {e.text}
              </p>
            ))}
          </div>
        </div>
      </div>
      <Link href="/call" className="btn-primary block text-center">Entrenar de nuevo</Link>
    </div>
  );
}
