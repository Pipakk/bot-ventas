"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";

const PLANS = [
  {
    id: "free",
    name: "Gratuito",
    badge: null,
    price: "0 €",
    frequency: "/mes",
    description: "Para probar el entrenador sin compromiso.",
    features: [
      "1 simulación IA por semana",
      "4 escenarios predefinidos",
      "Informe básico por llamada",
    ],
    notIncluded: [
      "Llamadas ilimitadas",
      "Equipos de comerciales",
      "Escenarios personalizados",
    ],
    highlight: false,
    cta: "Empezar gratis",
  },
  {
    id: "professional",
    name: "Profesional",
    badge: "Más popular",
    price: "40 €",
    frequency: "/mes",
    description: "Llamadas ilimitadas y tu equipo de hasta 10 comerciales.",
    features: [
      "Simulaciones IA ilimitadas",
      "1 equipo de hasta 10 comerciales",
      "Panel de gestor con métricas del equipo",
      "Escenarios personalizados del equipo",
      "Informe experto con IA tras cada llamada",
      "Gestión de permisos por miembro",
    ],
    notIncluded: ["Múltiples equipos"],
    highlight: true,
    cta: "Quiero el plan Profesional",
  },
  {
    id: "premium",
    name: "Premium",
    badge: "Para empresas",
    price: "60 €",
    frequency: "/mes",
    description: "Múltiples equipos de ventas y control total.",
    features: [
      "Simulaciones IA ilimitadas",
      "Equipos ilimitados de comerciales",
      "Panel de gestor multi-equipo",
      "Escenarios personalizados ilimitados",
      "Informe experto con IA tras cada llamada",
      "Gestión de permisos avanzada",
    ],
    notIncluded: [],
    highlight: false,
    cta: "Quiero el plan Premium",
  },
];

export default function BillingPage() {
  const { token, ready } = useRequireAuth();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!ready) return null;

  async function handleSubscribe(planId: string) {
    setError("");
    if (planId === "free") {
      router.push("/dashboard");
      return;
    }
    try {
      setLoadingPlan(planId);
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo iniciar el pago.");
      if (data.url) router.push(data.url);
      else router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al iniciar el pago.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Link href="/dashboard" className="text-slate-400 hover:text-white">
          ← Volver al dashboard
        </Link>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white">Planes y precios</h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Entrena solo o con todo tu equipo. Sin permanencia, cancela cuando quieras.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`card p-5 flex flex-col justify-between relative ${
              plan.highlight
                ? "border-primary-500/70 bg-slate-950 shadow-[0_20px_60px_rgba(56,189,248,0.35)]"
                : "border-slate-800/80 bg-slate-950/90"
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary-500 text-slate-950 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {plan.badge}
                </span>
              </div>
            )}
            <div className="space-y-2 pt-1">
              <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
              <div className="flex items-end gap-1">
                <p className="text-2xl font-bold text-primary-300">{plan.price}</p>
                <p className="text-sm text-slate-400 mb-0.5">{plan.frequency}</p>
              </div>
              <p className="text-xs text-slate-400">{plan.description}</p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <svg className="mt-[2px] h-3.5 w-3.5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
                {plan.notIncluded.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 opacity-40">
                    <svg className="mt-[2px] h-3.5 w-3.5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="line-through text-slate-500">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => handleSubscribe(plan.id)}
              disabled={loadingPlan === plan.id}
              className={`mt-5 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                plan.highlight
                  ? "bg-primary-500 text-slate-950 hover:bg-primary-400"
                  : "bg-slate-800 text-slate-100 hover:bg-slate-700"
              }`}
            >
              {loadingPlan === plan.id ? "Redirigiendo…" : plan.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-500">
        ¿Tienes un equipo grande o necesidades especiales?{" "}
        <a href="mailto:hola@coldcalltrainer.com" className="text-primary-400 hover:underline">
          Contáctanos para un plan personalizado
        </a>
      </p>
    </div>
  );
}
