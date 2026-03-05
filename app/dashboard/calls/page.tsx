"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";

interface CallSessionSummary {
  id: string;
  mode: string;
  difficulty: string;
  industry: string | null;
  prospectType: string | null;
  personality: string | null;
  durationSeconds: number | null;
  startedAt: string;
  endedAt: string | null;
  totalScore: number | null;
}

export default function CallsHistoryPage() {
  const { token, ready } = useRequireAuth();
  const [sessions, setSessions] = useState<CallSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch("/api/call/sessions", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.sessions) setSessions(data.sessions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (!ready) return null;

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDuration(sec: number | null) {
    if (sec == null) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m} min ${s} s` : `${s} s`;
  }

  return (
    <div className="page-stack">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Mis simulaciones</h1>
          <p className="text-muted mt-1">
            Cada entrenamiento guardado con su transcripción, puntuación y análisis experto.
          </p>
        </div>
        <Link href="/dashboard" className="btn-secondary w-fit">
          ← Volver al dashboard
        </Link>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-slate-400">Cargando…</div>
      ) : sessions.length === 0 ? (
        <div className="card p-8 text-center space-y-3">
          <p className="text-slate-300 font-medium">Aún no has entrenado.</p>
          <p className="text-slate-500 text-sm">Haz tu primera simulación y recibe feedback experto al instante.</p>
          <Link href="/call" className="btn-primary inline-flex">
            Empezar primera simulación
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Fecha</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Dificultad</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Duración</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Puntuación</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">Ver</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s: CallSessionSummary) => (
                  <tr key={s.id} className="border-b border-slate-800/80 hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-200">{formatDate(s.startedAt)}</td>
                    <td className="py-3 px-4 text-slate-300">{s.mode === "ai" ? "IA" : "Local"}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {s.difficulty === "hard" ? "Difícil" : "Normal"}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{formatDuration(s.durationSeconds)}</td>
                    <td className="py-3 px-4">
                      {s.totalScore != null ? (
                        <span className="font-medium text-primary-300">{s.totalScore}</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/results/${s.id}`}
                        className="text-primary-400 hover:text-primary-300 font-medium"
                      >
                        Ver informe
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
