import { Activity } from "lucide-react";

import { cn } from "../../../shared/utils/cn";
import { useKanbanActivity } from "../hooks";
import { canViewActivity } from "../utils/permissions";

type ActivityPanelProps = {
  cardId: string;
};

function formatDate(value: string) {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

export function ActivityPanel({ cardId }: ActivityPanelProps) {
  if (!canViewActivity()) {
    return (
      <div className="rounded-md border border-border bg-white/[0.02] p-3 text-xs text-slate-400">
        Sem permissão para ver activity log.
      </div>
    );
  }

  const { data = [], isLoading, isError, error } = useKanbanActivity(cardId);

  if (isLoading) return <div className="text-xs text-slate-400">Carregando atividades...</div>;
  if (isError)
    return (
      <div className="text-xs text-rose-200">
        {(error as Error)?.message ?? "Falha ao carregar activity log."}
      </div>
    );

  if (data.length === 0) {
    return (
      <div className="rounded-md border border-border bg-white/[0.02] p-3 text-xs text-slate-400">
        Nenhuma atividade registrada.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((row) => (
        <div key={row.id} className={cn("rounded-md border border-border bg-white/[0.02] px-3 py-2")}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
              <Activity className="h-3.5 w-3.5 text-cyan" />
              {row.action}
            </div>
            <div className="text-[11px] text-slate-500">{formatDate(row.created_at)}</div>
          </div>
          {row.user_id ? <div className="mt-1 text-[11px] text-slate-500">user_id: {row.user_id}</div> : null}
        </div>
      ))}
    </div>
  );
}

