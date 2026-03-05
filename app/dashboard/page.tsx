"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";

interface Usage {
  plan: "free" | "growth" | "unlimited" | "professional" | "premium";
  remainingToday: number | null;
  remainingThisWeek: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, user, logout, ready } = useRequireAuth();
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/usage", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setUsage(data);
      })
      .catch(() => {});
  }, [token]);

  if (!ready) return null;

  return (
    <div className="page-stack">
      <PageHeader
        title="Tu panel de entrenamiento"
        description={`Hola, ${user?.email?.split("@")[0]}. Cada simulación te acerca más a cerrar la siguiente reunión.`}
        actions={
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="btn-secondary"
          >
            Cerrar sesión
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Plan actual"
          value={
            usage?.plan === "premium"
              ? "Premium"
              : usage?.plan === "professional"
              ? "Profesional"
              : usage?.plan === "unlimited"
              ? "Premium"
              : usage?.plan === "growth"
              ? "Profesional"
              : "Gratuito"
          }
          helper="Haz clic para cambiar de plan."
          href="/billing"
        />
        <StatCard
          label="Simulaciones disponibles"
          value={
            usage?.plan === "premium" || usage?.plan === "professional" || usage?.plan === "unlimited"
              ? "Ilimitadas"
              : `${usage?.remainingThisWeek ?? 0} restante esta semana`
          }
          helper={
            usage?.plan === "premium" || usage?.plan === "professional" || usage?.plan === "unlimited"
              ? "Entrena tanto como quieras."
              : "Plan Gratuito: 1 simulación por semana."
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Entrenar ahora</h2>
            <p className="text-slate-400 text-sm max-w-xl">
              Elige tu escenario, el perfil del prospecto y empieza. En menos de 2 minutos estarás
              recibiendo objeciones reales y feedback experto.
            </p>
          </div>
          <button
            onClick={() => router.push("/call")}
            className="btn-primary"
          >
            Empezar simulación
          </button>
        </div>
        <Link
          href="/dashboard/calls"
          className="card p-6 flex flex-col justify-center gap-2 hover:border-slate-600 transition-colors"
        >
          <h2 className="text-lg font-semibold text-white">Mis simulaciones</h2>
          <p className="text-slate-400 text-sm">
            Revisa cada entrenamiento: transcripción completa, puntuación y análisis experto.
          </p>
          <span className="text-primary-400 text-sm font-medium">Ver historial →</span>
        </Link>
      </div>

      {/* Acceso a gestión de equipo para planes Profesional y Premium */}
      {(usage?.plan === "professional" || usage?.plan === "premium" ||
        usage?.plan === "growth" || usage?.plan === "unlimited") && (
        <Link
          href="/dashboard/team"
          className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-600 transition-colors"
        >
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Mi equipo</h2>
            <p className="text-slate-400 text-sm max-w-xl">
              Gestiona los comerciales de tu equipo, sus permisos y revisa las métricas colectivas.
            </p>
          </div>
          <span className="text-primary-400 text-sm font-medium shrink-0">Gestionar equipo →</span>
        </Link>
      )}
    </div>
  );
}
