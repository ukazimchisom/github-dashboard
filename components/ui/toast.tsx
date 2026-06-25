"use client";

// A simple toast notification system.
// Toasts appear in the bottom-right corner and auto-dismiss after 4 seconds.
//
// Usage:
//   const { showToast } = useToast();
//   showToast('Sync complete!', 'success');
//   showToast('Something went wrong', 'error');

import { createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

// Context so any component can trigger a toast
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();

    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const toastStyles: Record<ToastType, string> = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    info: "bg-gray-900 text-white",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — fixed to bottom-right */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "px-4 py-3 rounded-lg shadow-lg text-sm font-medium",
              "animate-in slide-in-from-right duration-300",
              "max-w-sm",
              toastStyles[toast.type],
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook to use toasts from any Client Component
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
