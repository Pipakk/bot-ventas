"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";

export default function BillingSuccessPage() {
  const search = useSearchParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
  }, [token, router]);

  const sessionId = search.get("session_id");

  useEffect(() => {
    // En este MVP asumimos que Stripe ya ha configurado la suscripción correctamente.
    // Podríamos añadir aquí una llamada a un endpoint para confirmar el plan vía webhook o recuperación de sesión.
  }, [sessionId]);

  if (!token) return null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white mb-2">Pago completado</h1>
        <p className="text-slate-400 text-sm">
          Gracias por actualizar tu plan. Tu suscripción se ha procesado correctamente en Stripe.
          Si no ves reflejado el cambio de plan en el dashboard en unos segundos, actualiza la
          página.
        </p>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </div>
      <div className="flex gap-3">
        <Link href="/dashboard" className="btn-primary">
          Ir al dashboard
        </Link>
        <Link href="/billing" className="btn-secondary">
          Ver planes
        </Link>
      </div>
    </div>
  );
}

