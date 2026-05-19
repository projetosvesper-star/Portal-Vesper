import { ReactNode } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

type PortalDrawerProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  widthClassName?: string;
};

export function PortalDrawer({ open, title, description, children, footer, onClose, widthClassName = "max-w-3xl" }: PortalDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Fechar painel" className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        className={clsx(
          "absolute bottom-0 right-0 top-0 flex w-full flex-col overflow-hidden border-l border-border bg-panel shadow-2xl",
          widthClassName,
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/5 text-slate-200 hover:bg-white/10" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        {footer ? <footer className="shrink-0 border-t border-border p-4">{footer}</footer> : null}
      </aside>
    </div>
  );
}
