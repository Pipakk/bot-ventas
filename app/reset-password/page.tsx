"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function ResetPasswordPage() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Enlace no válido. Vuelve a solicitar la recuperación de contraseña.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo restablecer la contraseña.");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-md card p-6 sm:p-8 space-y-5">
        <div className="space-y-1 text-center">
          <h2 className="text-2xl font-semibold text-white">Crear nueva contraseña</h2>
          <p className="text-muted">
            Elige una contraseña segura que no hayas usado antes.
          </p>
        </div>
        {success ? (
          <p className="text-sm text-slate-300">
            Contraseña actualizada correctamente. Te estamos redirigiendo al login…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
              required
            />
            <input
              type="password"
              placeholder="Repite la contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-base"
              required
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" className="btn-primary w-full mt-1" disabled={loading || !token}>
              {loading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        )}
        <p className="mt-2 text-center text-sm text-slate-400">
          ¿No solicitaste este cambio?{" "}
          <Link href="/login" className="text-primary-300 hover:underline">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}

