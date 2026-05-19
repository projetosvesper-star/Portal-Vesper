import { AlertTriangle, RefreshCw } from "lucide-react";
import { formatApiError } from "../api/errors";
import { PortalButton } from "./PortalButton";

type ErrorStateProps = {
  error: unknown;
  title?: string;
  fallback?: string;
  onRetry?: () => void;
};

export function ErrorState({ error, title = "Não foi possível carregar", fallback, onRetry }: ErrorStateProps) {
  const formatted = formatApiError(error, fallback);

  return (
    <div className="rounded-lg border border-rose-500/35 bg-rose-500/10 p-4 text-sm text-rose-100">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-rose-50">{title}</p>
          <p className="mt-1 leading-6">{formatted.message}</p>
          {formatted.details?.length ? (
            <div className="mt-3 space-y-1 rounded-md border border-rose-500/20 bg-slate-950/40 p-3 text-xs text-rose-100/90">
              {formatted.details.map((detail) => (
                <p key={detail}>{detail}</p>
              ))}
            </div>
          ) : null}
          {onRetry ? (
            <PortalButton className="mt-3" variant="secondary" onClick={onRetry}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </PortalButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
