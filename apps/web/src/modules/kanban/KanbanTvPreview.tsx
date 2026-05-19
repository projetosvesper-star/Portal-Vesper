import { CalendarClock } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState, PortalBadge, SectionCard } from "../../shared/ui";
import { groupTvItemsByColumn, type KanbanTvItem } from "./KanbanTvAdapter";

type KanbanTvPreviewProps = {
  mode: "list" | "kanban";
  items: KanbanTvItem[];
};

export function KanbanTvPreview({ mode, items }: KanbanTvPreviewProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhum item para exibir na TV/Foco."
        description="O quadro selecionado não possui cards ativos ou OPs visíveis para este modo."
      />
    );
  }

  if (mode === "kanban") {
    const grouped = groupTvItemsByColumn(items);
    return (
      <div className="grid min-w-0 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
        {Object.entries(grouped).map(([column, columnItems]) => (
          <SectionCard key={column} title={column} description={`${columnItems.length} item(ns)`}>
            <div className="space-y-3 p-4">
              {columnItems.map((item) => (
                <TvItemCard key={item.id} item={item} compact />
              ))}
            </div>
          </SectionCard>
        ))}
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-3">
      {items.map((item) => (
        <TvItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function TvItemCard({ item, compact = false }: { item: KanbanTvItem; compact?: boolean }) {
  return (
    <article className="min-w-0 rounded-lg border border-border bg-slate-950/35 p-4">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className={compact ? "truncate text-base font-semibold text-white" : "truncate text-xl font-semibold text-white"}>{item.title}</h3>
            <PortalBadge tone={item.sourceType === "production" ? "cyan" : "slate"}>
              {item.sourceType === "production" ? "Produção" : "Kanban"}
            </PortalBadge>
          </div>
          {item.subtitle ? <p className="mt-1 line-clamp-2 text-sm text-slate-400">{item.subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {item.priority ? <PortalBadge tone={priorityTone(item.priority)}>{formatPriority(item.priority)}</PortalBadge> : null}
          {item.status ? <PortalBadge tone="slate">{formatStatus(item.status)}</PortalBadge> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Info label="Coluna" value={item.column ?? "-"} />
        <Info label="Entrega" value={formatDate(item.dueDate)} icon={<CalendarClock className="h-4 w-4" />} />
        <Info label="Checklist" value={item.progress === null ? "-" : `${Math.round(item.progress)}%`} />
      </div>
      {item.progress !== null ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-cyan" style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }} />
        </div>
      ) : null}
    </article>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-panel/50 p-3">
      <p className="flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate font-semibold text-white">{value}</p>
    </div>
  );
}

function formatDate(date: string | null) {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("pt-BR");
}

function formatPriority(priority: string) {
  const labels: Record<string, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    critical: "Crítica",
    baixa: "Baixa",
    normal: "Normal",
    alta: "Alta",
    urgente: "Urgente",
  };
  return labels[priority] ?? priority;
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    aberta: "Aberta",
    em_andamento: "Em andamento",
    aguardando: "Aguardando",
    pronta: "Pronta",
    arquivada: "Arquivada",
  };
  return labels[status] ?? status;
}

function priorityTone(priority: string): "cyan" | "slate" | "amber" | "rose" {
  if (priority === "critical" || priority === "urgente") return "rose";
  if (priority === "high" || priority === "alta") return "amber";
  if (priority === "low" || priority === "baixa") return "slate";
  return "cyan";
}
