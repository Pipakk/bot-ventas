"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";

interface Usage {
  aiModeEnabled: boolean;
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
        description={`Bienvenido, ${user?.email}. Practica llamadas, revisa tu uso diario y prepárate para tu próxima campaña.`}
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
          label="Modo AI"
          value={usage?.aiModeEnabled ? "Activo" : "Solo Pro"}
          helper="Usa tu propia API key de OpenAI"
        />
        <StatCard
          label="Plan"
          value={user?.role === "pro" ? "Pro" : "Gratuito"}
          helper={user?.role === "pro" ? "Incluye modo AI" : "Actualiza para desbloquear modo AI"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Nueva práctica</h2>
            <p className="text-slate-400 text-sm max-w-xl">
              Configura industria, dificultad y tipo de prospecto. Luego inicia una simulación de llamada
              con voz y análisis automático.
            </p>
          </div>
          <button
            onClick={() => router.push("/call")}
            className="btn-primary"
          >
            Iniciar llamada de práctica
          </button>
        </div>
        <Link
          href="/dashboard/calls"
          className="card p-6 flex flex-col justify-center gap-2 hover:border-slate-600 transition-colors"
        >
          <h2 className="text-lg font-semibold text-white">Llamadas ejecutadas</h2>
          <p className="text-slate-400 text-sm">
            Revisa el historial, la transcripción y el informe de cada llamada.
          </p>
          <span className="text-primary-400 text-sm font-medium">Ver historial →</span>
        </Link>
      </div>
    </div>
  );
}
