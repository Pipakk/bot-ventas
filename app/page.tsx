"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";

type PaidPlanId = "growth" | "unlimited";

export default function HomePage() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PaidPlanId | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  async function handlePaidPlan(planId: PaidPlanId) {
    setCheckoutError("");
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent("/billing?plan=" + planId)}`);
      return;
    }
    try {
      setLoadingPlan(planId);
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo iniciar el pago.");
      if (data.url) {
        router.push(data.url);
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : "Error al iniciar el pago.");
    } finally {
      setLoadingPlan(null);
    }
  }

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
              Para SDR, BDR y equipos de ventas B2B
            </p>
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
                Entrena tus cold calls{" "}
                <span className="bg-gradient-to-r from-sky-300 to-primary-400 bg-clip-text text-transparent">
                  y domina cualquier objeción.
                </span>
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-slate-300">
                Practica con prospectos que reaccionan como clientes reales. Mejora tu pitch,
                gestiona objeciones y aumenta tus reuniones antes de llamar a clientes de verdad.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href={token ? "/call" : "/register"}
                className="btn-primary w-full sm:w-auto justify-center"
              >
                {token ? "Entrenar ahora" : "Entrenar mi primera cold call"}
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
              <span>✔ Objeciones reales</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="hidden sm:inline">✔ Perfiles CEO, dueño y técnico</span>
              <span className="hidden lg:inline text-slate-600">•</span>
              <span className="hidden lg:inline">✔ Feedback experto post-llamada</span>
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
                    <span>Responde y maneja la objeción.</span>
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
            1 · Elige tu escenario
          </p>
          <p className="text-sm font-semibold text-slate-50">Prospectos que ponen a prueba tu pitch</p>
          <p className="text-xs text-slate-400">
            CEO escéptico, dueño impaciente, técnico hostil… Elige el perfil y la dificultad para
            entrenar donde más te cuesta.
          </p>
        </div>
        <div className="card p-4 space-y-2">
          <p className="text-xs font-semibold text-primary-300 uppercase tracking-[0.16em]">
            2 · Entrena con voz real
          </p>
          <p className="text-sm font-semibold text-slate-50">Objeciones en tiempo real, como una llamada de verdad</p>
          <p className="text-xs text-slate-400">
            El prospecto responde, interrumpe y cambia de tono según lo que dices. Sin guion fijo,
            sin trampa.
          </p>
        </div>
        <div className="card p-4 space-y-2">
          <p className="text-xs font-semibold text-primary-300 uppercase tracking-[0.16em]">
            3 · Recibe feedback experto
          </p>
          <p className="text-sm font-semibold text-slate-50">Sabe exactamente qué mejorar antes de la próxima llamada</p>
          <p className="text-xs text-slate-400">
            Puntuación, errores clave, oportunidades perdidas y consejos concretos de un vendedor
            top 5%.
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section className="card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">Empieza gratis. Escala cuando lo necesites.</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Sin tarjeta. Sin compromiso. Practica tu primera simulación hoy.
            </p>
          </div>
          <Link href="/billing" className="btn-secondary text-xs sm:text-sm">
            Ver todos los planes →
          </Link>
        </div>
        {checkoutError && (
          <p className="text-sm text-red-400">{checkoutError}</p>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Gratis</h3>
            <p className="text-2xl font-bold text-primary-300">0 €</p>
            <p className="text-xs text-slate-400">1 simulación por semana</p>
            <ul className="mt-3 space-y-1 text-xs text-slate-300">
              <li>· Todos los escenarios y perfiles</li>
              <li>· Puntuación básica por llamada</li>
            </ul>
            <Link
              href="/billing?plan=free"
              className="mt-4 inline-flex w-full justify-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800"
            >
              Empezar gratis
            </Link>
          </div>
          <div className="rounded-2xl border border-primary-500/60 bg-slate-950 p-5 space-y-3 shadow-[0_20px_60px_rgba(56,189,248,0.35)]">
            <h3 className="text-sm font-semibold text-white">Crecimiento</h3>
            <p className="text-2xl font-bold text-primary-300">40 € / mes</p>
            <p className="text-xs text-slate-400">Hasta 10 simulaciones al día</p>
            <ul className="mt-3 space-y-1 text-xs text-slate-300">
              <li>· Contexto completo del prospecto</li>
              <li>· Informe experto tras cada simulación</li>
            </ul>
            <button
              type="button"
              onClick={() => handlePaidPlan("growth")}
              disabled={loadingPlan !== null}
              className="mt-4 w-full rounded-lg bg-primary-500 px-3 py-2 text-xs font-medium text-slate-950 hover:bg-primary-400 disabled:opacity-60"
            >
              {loadingPlan === "growth" ? "Redirigiendo..." : "Quiero este plan"}
            </button>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Pro ilimitado</h3>
            <p className="text-2xl font-bold text-primary-300">60 € / mes</p>
            <p className="text-xs text-slate-400">Simulaciones ilimitadas cada día</p>
            <ul className="mt-3 space-y-1 text-xs text-slate-300">
              <li>· Entrena tanto como quieras</li>
              <li>· Todas las mejoras futuras incluidas</li>
            </ul>
            <button
              type="button"
              onClick={() => handlePaidPlan("unlimited")}
              disabled={loadingPlan !== null}
              className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800 disabled:opacity-60"
            >
              {loadingPlan === "unlimited" ? "Redirigiendo..." : "Entrenamiento ilimitado"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
