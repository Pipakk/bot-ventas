"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";

interface Usage {
  plan: "free" | "growth" | "unlimited";
  remainingToday: number | null;
  remainingThisWeek: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    fetch("/api/usage", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setUsage(data);
      })
      .catch(() => {});
  }, [token, router]);

  if (!token) return null;

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
            usage?.plan === "unlimited"
              ? "Pro · Ilimitado"
              : usage?.plan === "growth"
              ? "Crecimiento · 10/día"
              : "Gratuito · 1/semana"
          }
          helper="Haz clic para cambiar de plan."
          href="/billing"
        />
        <StatCard
          label="Simulaciones disponibles"
          value={
            usage?.plan === "unlimited"
              ? "Sin límite hoy"
              : usage?.plan === "growth"
              ? `${usage?.remainingToday ?? 0} restantes hoy`
              : `${usage?.remainingThisWeek ?? 0} restantes esta semana`
          }
          helper={
            usage?.plan === "unlimited"
              ? "Entrena tanto como quieras."
              : usage?.plan === "growth"
              ? "Hasta 10 simulaciones al día."
              : "Plan gratuito: 1 simulación por semana."
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
    </div>
  );
}
