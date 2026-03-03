"use client";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";

export default function HomePage() {
  const token = useAuthStore((s) => s.token);

  return (
    <div className="space-y-12 pb-10">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-40 blur-3xl">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.4),transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.4),transparent_55%)]" />
        </div>
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-slate-700/70">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Entrenador de llamadas en frío para ventas B2B
            </p>
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
                Convierte tus{" "}
                <span className="bg-gradient-to-r from-sky-300 to-primary-400 bg-clip-text text-transparent">
                  cold calls
                </span>{" "}
                en ensayos perfectos.
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-slate-300">
                Simula llamadas en español con objeciones reales, avatar por voz y scoring avanzado.
                Practica antes de marcar a tus clientes de verdad.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href={token ? "/dashboard" : "/register"}
                className="btn-primary w-full sm:w-auto justify-center"
              >
                {token ? "Ir al dashboard" : "Empieza a practicar gratis"}
              </Link>
              {!token && (
                <Link
                  href="/login"
                  className="btn-secondary w-full sm:w-auto justify-center"
                >
                  Ya tengo cuenta
                </Link>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              <span>✔ Simulación IA con tu propia API key</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="hidden sm:inline">✔ Escenarios de venta reales (web, IA, fidelización)</span>
              <span className="hidden lg:inline text-slate-600">•</span>
              <span className="hidden lg:inline">✔ Scoring 0–100 + informe experto</span>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-xs sm:max-w-sm">
              <div className="absolute -inset-8 bg-gradient-to-tr from-primary-500/30 via-sky-500/10 to-transparent blur-3xl opacity-70" />
              <div className="relative rounded-[32px] border border-slate-700/70 bg-slate-950/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.9)]">
                <div className="flex items-center justify-between mb-3 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Llamada de práctica
                  </span>
                  <span className="font-mono text-slate-300">00:24</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Avatar isSpeaking={true} mood="neutral" />
                  <div className="w-full rounded-2xl bg-slate-950/90 border border-slate-800 px-3 py-3 text-[11px] text-slate-200 space-y-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-100">Prospecto · CEO Tech</span>
                      <span className="badge-pill bg-sky-500/20 text-sky-300 border border-sky-500/40">
                        Difícil
                      </span>
                    </div>
                    <p className="text-slate-400">
                      “Es interesante, pero ahora mismo no tenemos presupuesto para esto…”
                    </p>
                  </div>
                  <div className="flex items-center justify-between w-full mt-1 text-[11px] text-slate-400">
                    <span>Habla ahora para manejar la objeción.</span>
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 font-mono text-slate-200">
                      🎙 LIVE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES / STEPS */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-4 space-y-2">
          <p className="text-xs font-semibold text-primary-300 uppercase tracking-[0.16em]">
            1 · Diseña el escenario
          </p>
          <p className="text-sm font-semibold text-slate-50">Elige industria y tipo de prospecto</p>
          <p className="text-xs text-slate-400">
            Configura sector, dificultad y personalidad (escéptico, impaciente, hostil…) en segundos
            antes de llamar.
          </p>
        </div>
        <div className="card p-4 space-y-2">
          <p className="text-xs font-semibold text-primary-300 uppercase tracking-[0.16em]">
            2 · Llama con voz real
          </p>
          <p className="text-sm font-semibold text-slate-50">Avatar que te responde en tiempo real</p>
          <p className="text-xs text-slate-400">
            Ring, pausas, interrupciones y cambio de tono según tus respuestas, como en una llamada
            real.
          </p>
        </div>
        <div className="card p-4 space-y-2">
          <p className="text-xs font-semibold text-primary-300 uppercase tracking-[0.16em]">
            3 · Analiza y mejora
          </p>
          <p className="text-sm font-semibold text-slate-50">Scoring accionable tras cada intento</p>
          <p className="text-xs text-slate-400">
            Ve tu puntuación, ratio hablar/escuchar, calidad de preguntas y obtén sugerencias claras
            para la siguiente ronda.
          </p>
        </div>
      </section>
    </div>
  );
}
