'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'destructive' | 'success';
}

type Toast = ToastOptions & { id: number };

type ToastContextValue = {
  toasts: Toast[];
  showToast: (opts: ToastOptions) => void;
  dismiss: (id: number) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const counter = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback(
    (opts: ToastOptions) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev.slice(-2), { ...opts, id }]);
      window.setTimeout(() => dismiss(id), opts.duration ?? 3000);
    },
    [dismiss]
  );

  const value = React.useMemo(() => ({ toasts, showToast, dismiss }), [toasts, showToast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

function Toaster() {
  const { toasts, dismiss } = React.useContext(ToastContext)!;
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.variant === 'destructive' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-card animate-in slide-in-from-bottom-4 fade-in',
            t.variant === 'destructive' && 'border-destructive bg-destructive text-destructive-foreground',
            t.variant === 'success' && 'border-success bg-success text-white',
            (!t.variant || t.variant === 'default') && 'border-border bg-card text-card-foreground'
          )}
        >
          <div className="flex-1">
            <p className="font-semibold">{t.title}</p>
            {t.description && <p className="mt-1 text-sm opacity-90">{t.description}</p>}
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismiss(t.id)}
            className="rounded p-1 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
