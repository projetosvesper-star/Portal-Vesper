import { ReactNode } from "react";
import { X } from "lucide-react";

type PortalDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  maxWidthClassName?: string;
};

export function PortalDialog({ open, title, description, children, footer, onClose, maxWidthClassName = "max-w-3xl" }: PortalDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Fechar modal" onClick={onClose} className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute left-1/2 top-6 flex max-h-[calc(100vh-3rem)] w-[calc(100vw-1.5rem)] ${maxWidthClassName} -translate-x-1/2 flex-col overflow-hidden rounded-lg border border-border bg-panel shadow-2xl`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-5 text-slate-400">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/5 text-slate-200 hover:bg-white/10" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        {footer ? <footer className="flex shrink-0 flex-col gap-2 border-t border-border p-4 sm:flex-row sm:justify-end">{footer}</footer> : null}
      </div>
    </div>
  );
}
