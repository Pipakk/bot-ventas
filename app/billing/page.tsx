"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";

const PLANS = [
  {
    id: "free",
    name: "Gratis",
    price: "0 €",
    frequency: "1 llamada IA / semana",
    description: "Ideal para probar el entrenador sin compromiso.",
    features: [
      "1 llamada IA a la semana",
      "Acceso a todos los escenarios predefinidos",
      "Scoring básico por llamada",
    ],
    notIncluded: ["Escenarios personalizados"],
  },
  {
    id: "growth",
    name: "Crecimiento",
    price: "40 € / mes",
    frequency: "10 llamadas IA al día",
    description: "Para equipos o vendedores que practican a diario.",
    features: [
      "Hasta 10 llamadas IA al día",
      "Escenarios completos y notas del prospecto",
      "Informe experto de cada llamada",
      "Crear hasta 10 escenarios personalizados",
    ],
    notIncluded: [],
  },
  {
    id: "unlimited",
    name: "Pro ilimitado",
    price: "60 € / mes",
    frequency: "Llamadas IA ilimitadas",
    description: "Para quien entrena de forma intensiva.",
    features: [
      "Llamadas IA ilimitadas al día",
      "Todos los escenarios y futuras mejoras",
      "Informes expertos y scoring avanzado",
      "Escenarios personalizados ilimitados",
    ],
    notIncluded: [],
  },
];

export default function BillingPage() {
  const { token, ready } = useRequireAuth();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!ready) {
    return null;
  }

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
        <h1 className="text-2xl sm:text-3xl font-semibold text-white">Elige tu ritmo de entrenamiento</h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Empieza gratis y escala cuando quieras practicar más. Sin permanencia, cancela cuando quieras.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan: typeof PLANS[number]) => (
          <div
            key={plan.id}
            className={`card p-5 flex flex-col justify-between ${
              plan.id === "growth"
                ? "border-primary-500/70 bg-slate-950 shadow-[0_20px_60px_rgba(56,189,248,0.35)]"
                : "border-slate-800/80 bg-slate-950/90"
            }`}
          >
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
              <p className="text-2xl font-bold text-primary-300">{plan.price}</p>
              <p className="text-xs text-slate-400">{plan.frequency}</p>
              <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
              <ul className="mt-3 space-y-1 text-xs text-slate-300">
                {plan.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <svg className="mt-[2px] h-3.5 w-3.5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
                {plan.notIncluded?.map((f: string) => (
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
              className={`mt-4 w-full rounded-lg px-3 py-2 text-sm font-medium ${
                plan.id === "growth"
                  ? "bg-primary-500 text-slate-950 hover:bg-primary-400"
                  : "bg-slate-800 text-slate-100 hover:bg-slate-700"
              } disabled:opacity-60`}
            >
              {plan.id === "free"
                ? "Empezar gratis"
                : loadingPlan === plan.id
                ? "Redirigiendo..."
                : plan.id === "growth" ? "Quiero este plan" : "Entrenamiento ilimitado"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
