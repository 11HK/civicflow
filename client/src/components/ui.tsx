import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ Spinner */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-border border-t-primary",
        className || "h-5 w-5",
      )}
    />
  );
}

/* ------------------------------------------------------------------ Badge */
export function Badge({
  children,
  tone = "primary",
  className,
}: {
  children: ReactNode;
  tone?: "primary" | "success" | "warn" | "danger" | "info" | "sub";
  className?: string;
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary-light text-primary",
    success: "bg-success-light text-success",
    warn: "bg-warn-light text-warn",
    danger: "bg-danger-light text-danger",
    info: "bg-info-light text-info",
    sub: "bg-elevated text-sub border border-border",
  };
  return <span className={cn("badge", tones[tone], className)}>{children}</span>;
}

/* ------------------------------------------------------------------ Skeleton */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

/* ------------------------------------------------------------------ EmptyState */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-14 px-6 text-center animate-fade-in">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-elevated text-sub">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-sub">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ Modal */
export function Modal({
  open,
  onClose,
  children,
  title,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl" };
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "w-full rounded-t-xl bg-card shadow-lift sm:rounded-xl",
          "max-h-[92vh] overflow-y-auto animate-slide-up sm:animate-scale-in",
          widths[size],
        )}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-3.5">
            <h2 className="text-base font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="btn-ghost -mr-2 h-8 w-8 rounded-full p-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ Toast */
type Toast = { id: number; message: string; tone: "success" | "error" | "info" };
interface ToastCtx {
  toast: (message: string, tone?: Toast["tone"]) => void;
}
const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-20 left-1/2 z-[200] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6">
          {toasts.map((t) => {
            const Icon =
              t.tone === "success"
                ? CheckCircle2
                : t.tone === "error"
                  ? AlertTriangle
                  : Info;
            const color =
              t.tone === "success"
                ? "text-success"
                : t.tone === "error"
                  ? "text-danger"
                  : "text-info";
            return (
              <div
                key={t.id}
                className="pointer-events-auto flex items-center gap-2.5 rounded-DEFAULT border border-border bg-elevated px-4 py-3 text-sm font-medium shadow-lift animate-slide-up"
              >
                <Icon size={18} className={color} />
                <span className="flex-1">{t.message}</span>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const c = useContext(ToastContext);
  if (!c) throw new Error("useToast must be used within ToastProvider");
  return c;
}
