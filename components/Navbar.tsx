"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { useTheme } from "@/components/ThemeProvider";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const isDashboard = pathname?.startsWith("/dashboard") || pathname === "/call";

  const handleLogout = () => {
    logout();
    setOpen(false);
    router.push("/");
  };

  return (
    <header className="border-b border-slate-800/70 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="page-container flex h-14 items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-500 to-sky-400 text-white font-bold shadow-lg shadow-primary-500/40">
              CC
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold tracking-tight text-slate-50">ColdCall Trainer</p>
              <p className="text-[11px] text-slate-400">
                Entrenador de llamadas en frío
              </p>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-4 text-sm">
          <Link
            href="/"
            className={`text-slate-300 hover:text-white ${pathname === "/" ? "font-semibold" : ""}`}
          >
            Inicio
          </Link>
          {token && (
            <Link
              href="/dashboard"
              className={`text-slate-300 hover:text-white ${isDashboard ? "font-semibold" : ""}`}
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="btn-ghost h-8 w-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white"
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? "☾" : "☀"}
          </button>

          <div className="hidden sm:flex items-center gap-2">
            {token && user ? (
              <>
                <span className="hidden md:inline text-xs text-slate-400">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary h-8 px-3 text-xs"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-xs px-3 h-8">
                  Entrar
                </Link>
                <Link href="/register" className="btn-primary text-xs px-3 h-8">
                  Registrarse
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-900/90 text-slate-200"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            <span className="sr-only">Menú</span>
            <div className="space-y-1.5">
              <span className="block h-0.5 w-4 bg-slate-200" />
              <span className="block h-0.5 w-4 bg-slate-400" />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-64 bg-slate-950 border-l border-slate-800 p-4 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-100">Menú</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-ghost h-8 w-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <nav className="flex flex-col gap-2 text-sm">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className={`rounded-md px-2 py-1.5 ${pathname === "/" ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-900"}`}
              >
                Inicio
              </Link>
              {token && (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-2 py-1.5 ${isDashboard ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-900"}`}
                >
                  Dashboard
                </Link>
              )}
            </nav>
            <div className="mt-auto flex flex-col gap-2 text-sm">
              {token && user ? (
                <>
                  <p className="text-xs text-slate-400 break-all">{user.email}</p>
                  <button
                    onClick={handleLogout}
                    className="btn-secondary w-full justify-center h-9 text-xs"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="btn-ghost w-full justify-center h-9 text-xs"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="btn-primary w-full justify-center h-9 text-xs"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

