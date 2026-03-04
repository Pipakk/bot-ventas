import "./globals.css";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "ColdCall Trainer — Entrena tus cold calls con IA",
  description: "Practica llamadas en frío con prospectos que reaccionan como clientes reales. Mejora tu pitch, domina objeciones y cierra más reuniones."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen text-slate-50 antialiased">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

