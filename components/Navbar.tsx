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
    <>
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
                Practica. Mejora. Cierra más.
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
                  Iniciar sesión
                </Link>
                <Link href="/register" className="btn-primary text-xs px-3 h-8">
                  Empezar gratis
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

    </header>

    {open && (
      <div className="md:hidden fixed inset-0 z-50" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} onClick={() => setOpen(false)}>
        <div
          className="fixed right-0 top-0 h-full w-72 border-l border-slate-700 p-5 flex flex-col gap-4"
          style={{ backgroundColor: "#0f172a" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-slate-100">ColdCall Trainer</p>
              <p className="text-[11px] text-slate-400">Entrena. Mejora. Cierra.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-white"
              style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
            >
              ✕
            </button>
          </div>
          <nav className="flex flex-col gap-1 text-sm">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2 ${pathname === "/" ? "text-white font-medium" : "text-slate-300 hover:text-white"}`}
              style={pathname === "/" ? { backgroundColor: "#1e293b" } : {}}
            >
              Inicio
            </Link>
            {token && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2 ${isDashboard ? "text-white font-medium" : "text-slate-300 hover:text-white"}`}
                  style={isDashboard ? { backgroundColor: "#1e293b" } : {}}
                >
                  Mi panel
                </Link>
                <Link
                  href="/call"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sky-300 font-medium hover:text-sky-200"
                >
                  Entrenar ahora
                </Link>
                <Link
                  href="/billing"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-slate-300 hover:text-white"
                >
                  Planes
                </Link>
              </>
            )}
          </nav>
          <div className="mt-auto flex flex-col gap-2 text-sm">
            {token && user ? (
              <>
                <p className="text-xs text-slate-500 break-all px-1">{user.email}</p>
                <button
                  onClick={handleLogout}
                  className="w-full justify-center h-9 text-xs rounded-lg text-slate-100 hover:text-white"
                  style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="w-full text-center h-9 text-xs rounded-lg flex items-center justify-center text-slate-100 hover:text-white"
                  style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="w-full text-center h-9 text-xs rounded-lg flex items-center justify-center font-medium text-slate-950 hover:opacity-90"
                  style={{ backgroundColor: "#38bdf8" }}
                >
                  Empezar gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

