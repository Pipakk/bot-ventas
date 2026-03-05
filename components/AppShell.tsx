"use client";

import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
      <Navbar />
      <main className="flex-1 py-5 sm:py-6">
        <div className="page-container page-stack">{children}</div>
      </main>
      <footer
        className="text-xs border-t"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text-muted)" }}
      >
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-2 py-4">
          <p style={{ color: "var(--text-muted)" }}>© {new Date().getFullYear()} ColdCall Trainer.</p>
          <div className="flex items-center gap-3">
            <a href="#" className="hover:opacity-80 transition-opacity" style={{ color: "var(--text-muted)" }}>
              Privacidad
            </a>
            <a href="#" className="hover:opacity-80 transition-opacity" style={{ color: "var(--text-muted)" }}>
              Términos
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
