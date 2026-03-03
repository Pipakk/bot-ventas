"use client";

import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-6">
        <div className="page-container page-stack">{children}</div>
      </main>
      <footer className="border-t border-slate-800/70 bg-slate-950/80 text-xs text-slate-500">
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-2 py-4">
          <p>© {new Date().getFullYear()} ColdCall Trainer.</p>
          <div className="flex items-center gap-3">
            <a href="#" className="hover:text-slate-300">
              Privacidad
            </a>
            <a href="#" className="hover:text-slate-300">
              Términos
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

