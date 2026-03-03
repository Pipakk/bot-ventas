"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ToastState {
  message: string;
  type: "default" | "error" | "success";
}

interface ToastContextValue {
  toast: (msg: string, type?: ToastState["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState | null>(null);

  const toast = (message: string, type: ToastState["type"] = "default") => {
    setState({ message, type });
    setTimeout(() => setState(null), 3200);
  };

  const tone =
    state?.type === "error"
      ? "border-red-500/50 bg-red-950/80 text-red-100"
      : state?.type === "success"
      ? "border-emerald-500/50 bg-emerald-950/80 text-emerald-100"
      : "border-slate-700/80 bg-slate-900/90 text-slate-100";

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {state && (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none">
          <div
            className={`pointer-events-auto max-w-md rounded-xl border px-4 py-2 text-sm shadow-lg ${tone}`}
          >
            {state.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

