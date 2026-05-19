import React, { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";

import { X } from "lucide-react";

import { cn } from "../utils/cn";

type ToastVariant = "success" | "error" | "info";

export type Toast = {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
};

type ToastContextValue = {
  push: (toast: Omit<Toast, "id">, options?: { durationMs?: number }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function variantClasses(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return "border-teal/30 bg-teal/10 text-teal";
    case "error":
      return "border-rose-400/25 bg-rose-400/10 text-rose-200";
    case "info":
      return "border-blue/30 bg-blue/10 text-blue";
  }
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((toast: Omit<Toast, "id">, options?: { durationMs?: number }) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const durationMs = options?.durationMs ?? 3500;
    const next: Toast = { id, ...toast };
    setToasts((prev) => [next, ...prev].slice(0, 4));
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), durationMs);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className="w-[340px] rounded-lg border border-border bg-panel/95 p-3 shadow-glow">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", variantClasses(t.variant))}>
                  {t.variant.toUpperCase()}
                </p>
                <p className="mt-2 truncate text-sm font-semibold text-white">{t.title}</p>
                {t.message ? <p className="mt-1 text-xs text-slate-400">{t.message}</p> : null}
              </div>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-md border border-border bg-white/[0.04] text-slate-300 hover:text-white"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider />");
  return {
    success: (title: string, message?: string) => ctx.push({ variant: "success", title, message }),
    error: (title: string, message?: string) => ctx.push({ variant: "error", title, message }),
    info: (title: string, message?: string) => ctx.push({ variant: "info", title, message }),
  };
}

