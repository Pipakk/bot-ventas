"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";

function BillingSuccessContent() {
  const search = useSearchParams();
  const router = useRouter();
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  const sessionId = search.get("session_id");
  void sessionId;

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

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<div className="text-slate-400">Cargando...</div>}>
      <BillingSuccessContent />
    </Suspense>
  );
}
