"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { useTheme } from "@/components/ThemeProvider";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const isDashboard = pathname?.startsWith("/dashboard") || pathname === "/call";

  const handleLogout = () => {
    logout();
    setOpen(false);
    router.push("/");
  };

  // Close on ESC + focus trap
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // Focus first element
    setTimeout(() => closeRef.current?.focus(), 50);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const navBg = theme === "light" ? "#ffffff" : "#0f172a";
  const navBorder = theme === "light" ? "#e2e8f0" : "#1e293b";
  const overlayBg = "rgba(0,0,0,0.65)";

  return (
    <>
      <header
        className="border-b sticky top-0 z-40"
        style={{
          borderColor: navBorder,
          backgroundColor: theme === "light" ? "rgba(255,255,255,0.92)" : "rgba(2,6,23,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="page-container flex h-14 items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-lg">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl font-bold text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, #38bdf8, #60a5fa)", boxShadow: "0 4px 12px rgba(56,189,248,0.4)" }}
            >
              CC
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                ColdCall Trainer
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Practica. Mejora. Cierra más.
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4 text-sm" aria-label="Navegación principal">
            <Link
              href="/"
              className={`transition-colors hover:opacity-80 ${pathname === "/" ? "nav-link-active" : ""}`}
              style={{ color: pathname === "/" ? "var(--primary)" : "var(--text-muted)" }}
            >
              Inicio
            </Link>
            {token && (
              <>
                <Link
                  href="/dashboard"
                  className={`transition-colors hover:opacity-80 ${isDashboard ? "nav-link-active" : ""}`}
                  style={{ color: isDashboard ? "var(--primary)" : "var(--text-muted)" }}
                >
                  Mi panel
                </Link>
                <Link
                  href="/dashboard/team"
                  className={`transition-colors hover:opacity-80 ${pathname?.startsWith("/dashboard/team") ? "nav-link-active" : ""}`}
                  style={{ color: pathname?.startsWith("/dashboard/team") ? "var(--primary)" : "var(--text-muted)" }}
                >
                  Mi equipo
                </Link>
              </>
            )}
          </nav>

          {/* Desktop actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="btn-ghost h-9 w-9 rounded-full flex items-center justify-center"
              aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              {token && user ? (
                <>
                  <span className="hidden md:inline text-xs" style={{ color: "var(--text-muted)" }}>
                    {user.email}
                  </span>
                  <button onClick={handleLogout} className="btn-secondary h-9 px-4 text-xs">
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost text-xs px-3 h-9">
                    Iniciar sesión
                  </Link>
                  <Link href="/register" className="btn-primary text-xs px-4 h-9">
                    Empezar gratis
                  </Link>
                </>
              )}
            </div>

            {/* Hamburger */}
            <button
              type="button"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
              style={{ border: `1px solid ${navBorder}`, backgroundColor: theme === "light" ? "#f8fafc" : "#1e293b", color: "var(--text)" }}
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
                <rect y="0" width="18" height="2" rx="1" fill="currentColor" />
                <rect y="6" width="12" height="2" rx="1" fill="currentColor" />
                <rect y="12" width="18" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer — outside header to avoid backdrop-filter inheritance */}
      {open && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          className="md:hidden fixed inset-0 z-50 drawer-overlay"
          style={{ backgroundColor: overlayBg }}
          onClick={() => setOpen(false)}
        >
          <div
            className="fixed right-0 top-0 h-full w-72 flex flex-col drawer-panel"
            style={{ backgroundColor: navBg, borderLeft: `1px solid ${navBorder}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header drawer */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${navBorder}` }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>ColdCall Trainer</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Entrena. Mejora. Cierra.</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 w-9 flex items-center justify-center rounded-lg transition-colors"
                style={{ backgroundColor: theme === "light" ? "#f1f5f9" : "#1e293b", color: "var(--text-muted)" }}
                aria-label="Cerrar menú"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-1 px-3 py-3 flex-1" aria-label="Menú móvil">
              <Link
                ref={firstLinkRef}
                href="/"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: pathname === "/" ? (theme === "light" ? "#eff6ff" : "#1e293b") : "transparent",
                  color: pathname === "/" ? "var(--primary)" : "var(--text-muted)",
                }}
              >
                Inicio
              </Link>
              {token && (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-3 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: isDashboard ? (theme === "light" ? "#eff6ff" : "#1e293b") : "transparent",
                      color: isDashboard ? "var(--primary)" : "var(--text-muted)",
                    }}
                  >
                    Mi panel
                  </Link>
                  <Link
                    href="/dashboard/team"
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-3 text-sm transition-colors"
                    style={{ color: pathname?.startsWith("/dashboard/team") ? "var(--primary)" : "var(--text-muted)" }}
                  >
                    Mi equipo
                  </Link>
                  <Link
                    href="/call"
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-3 text-sm font-semibold"
                    style={{ color: "var(--primary)" }}
                  >
                    Entrenar ahora →
                  </Link>
                  <Link
                    href="/billing"
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-3 text-sm transition-colors"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Planes
                  </Link>
                  <Link
                    href="/dashboard/calls"
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-3 text-sm transition-colors"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Mis simulaciones
                  </Link>
                </>
              )}
            </nav>

            {/* Footer drawer */}
            <div className="px-3 pb-6 flex flex-col gap-2" style={{ borderTop: `1px solid ${navBorder}`, paddingTop: "1rem" }}>
              {/* Theme toggle */}
              <button
                type="button"
                onClick={() => { toggleTheme(); }}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors w-full text-left"
                style={{ color: "var(--text-muted)", backgroundColor: theme === "light" ? "#f8fafc" : "#1e293b" }}
              >
                <span>{theme === "dark" ? "☀" : "☾"}</span>
                <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
              </button>

              {token && user ? (
                <>
                  <p className="text-xs px-1 break-all" style={{ color: "var(--text-muted)" }}>{user.email}</p>
                  <button
                    onClick={handleLogout}
                    className="btn-secondary w-full justify-center"
                    style={{ minHeight: "44px" }}
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="btn-secondary w-full justify-center"
                    style={{ minHeight: "44px" }}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="btn-primary w-full justify-center"
                    style={{ minHeight: "44px" }}
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
