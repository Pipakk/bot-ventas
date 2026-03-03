"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok && data.error) throw new Error("No se pudo enviar el correo de recuperación.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al solicitar recuperación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-md card p-6 sm:p-8 space-y-5">
        <div className="space-y-1 text-center">
          <h2 className="text-2xl font-semibold text-white">Recuperar contraseña</h2>
          <p className="text-muted">
            Introduce tu email y te enviaremos un enlace para crear una nueva contraseña.
          </p>
        </div>
        {sent ? (
          <p className="text-sm text-slate-300">
            Si el correo existe en el sistema, se ha enviado un enlace de restablecimiento. Revisa tu
            bandeja de entrada (y la carpeta de spam).
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base"
              required
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          </form>
        )}
        <p className="mt-2 text-center text-sm text-slate-400">
          ¿Ya la recuerdas?{" "}
          <Link href="/login" className="text-primary-300 hover:underline">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}

