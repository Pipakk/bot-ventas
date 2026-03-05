"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

/**
 * Hook para páginas protegidas.
 * Espera a que Zustand hidrate el store desde localStorage antes de
 * decidir redirigir, evitando el falso redirect al login al refrescar.
 *
 * Uso:
 *   const { token, user, ready } = useRequireAuth();
 *   if (!ready) return null; // spinner opcional
 */
export function useRequireAuth() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // hydrated se vuelve true después del primer tick de cliente,
  // cuando Zustand ya habrá cargado el valor de localStorage.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // aún no sabemos el estado real
    if (!token) {
      router.replace("/login");
    }
  }, [hydrated, token, router]);

  return { token, user, logout, ready: hydrated && !!token };
}
