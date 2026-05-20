import { Archive, Calendar, Edit3, Layers, RotateCcw, UserCircle2, X } from "lucide-react";
import { ReactNode, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "../../../shared/components/Button";
import { cn } from "../../../shared/utils/cn";
import { lookupUsers } from "../../../shared/api/users";
import { formatCustomFieldValue, getCardCustomFields } from "../config";
import * as api from "../api";
import { kanbanQueryKeys, useArchiveKanbanCard, useRestoreKanbanCard } from "../hooks";
import type { KanbanBoardConfig, KanbanColumn } from "../types";
import { canArchiveCard, canEditCard, canRestoreCard } from "../utils/permissions";
import { priorityClasses, priorityLabel } from "../utils/priority";
import { ActivityPanel } from "./ActivityPanel";
import { AttachmentsPanel } from "./AttachmentsPanel";
import { ChecklistPanel } from "./ChecklistPanel";
import { CommentsPanel } from "./CommentsPanel";

type CardDetailDrawerProps = {
  open: boolean;
  cardId: string | null;
  boardId: string | undefined;
  columns: KanbanColumn[];
  config: KanbanBoardConfig;
  onClose: () => void;
  onEdit: (cardId: string) => void;
};

type Tab = "checklist" | "comments" | "attachments" | "activity";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

export function CardDetailDrawer({ open, cardId, boardId, columns, config, onClose, onEdit }: CardDetailDrawerProps) {
  const tabs = useMemo(
    () =>
      [
        config.features.checklist ? ({ key: "checklist", label: "Checklist" } as const) : null,
        config.features.comments ? ({ key: "comments", label: "Comentarios" } as const) : null,
        config.features.attachments ? ({ key: "attachments", label: "Anexos" } as const) : null,
        config.features.activity ? ({ key: "activity", label: "Atividade" } as const) : null,
      ].filter(Boolean) as Array<{ key: Tab; label: string }>,
    [config.features],
  );
  const [tab, setTab] = useState<Tab>(tabs[0]?.key ?? "checklist");

  const { data: card, isLoading, isError, error } = useQuery({
    queryKey: cardId ? kanbanQueryKeys.card(cardId) : ["kanban", "cards", "undefined"],
    queryFn: () => api.getCard(cardId!),
    enabled: Boolean(cardId) && open,
  });

  const archiveMutation = useArchiveKanbanCard(boardId);
  const restoreMutation = useRestoreKanbanCard(boardId);

  const assignedUserQuery = useQuery({
    queryKey: card?.assigned_to ? ["users", "lookup", card.assigned_to] : ["users", "lookup", "none"],
    queryFn: async () => {
      if (!card?.assigned_to) return null;
      const users = await lookupUsers([card.assigned_to]);
      return users[0] ?? null;
    },
    enabled: Boolean(card?.assigned_to) && open,
  });

  const columnName = useMemo(() => {
    if (!card) return "";
    return columns.find((column) => column.id === card.column_id)?.name ?? "";
  }, [card, columns]);

  if (!open) return null;

  const customFields = card ? getCardCustomFields(card.metadata) : {};
  const drawerFields = config.card.fields.filter((field) => field.showInDrawer).sort((a, b) => a.order - b.order);

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[560px] border-l border-border bg-panel shadow-glow">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan">Detalhes de {config.terminology.itemSingular}</p>
            <h2 className="mt-2 truncate text-xl font-semibold text-white">{card?.title ?? "Carregando..."}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {card?.code ? <span className="rounded border border-border bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-300">{card.code}</span> : null}
              {card ? (
                <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", priorityClasses(card.priority))}>
                  {priorityLabel(card.priority)}
                </span>
              ) : null}
              {card?.is_archived ? <span className="rounded-full border border-border bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-400">Arquivado</span> : null}
            </div>
          </div>
          <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-border bg-white/[0.04] text-slate-300 hover:text-white" onClick={onClose} aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto p-5">
          {isLoading ? <div className="text-sm text-slate-400">Carregando...</div> : null}
          {isError ? <div className="text-sm text-rose-200">{(error as Error)?.message ?? "Falha ao carregar."}</div> : null}

          {card ? (
            <>
              <section className="rounded-lg border border-border bg-white/[0.02] p-4">
                <div className="grid gap-3 text-sm">
                  <Info icon={<Layers className="h-4 w-4" />} label="Coluna" value={columnName || "-"} />
                  <Info icon={<Calendar className="h-4 w-4" />} label="Vencimento" value={formatDate(card.due_date)} />
                  <Info label="Status" value={card.status ?? "-"} />
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">Responsavel</div>
                    <div className="flex min-w-0 items-center gap-2 text-sm text-slate-200">
                      <UserCircle2 className="h-4 w-4 shrink-0 text-slate-500" />
                      {assignedUserQuery.data ? (
                        <span className="truncate">
                          {assignedUserQuery.data.name} <span className="text-xs text-slate-500">@{assignedUserQuery.data.username}</span>
                        </span>
                      ) : (
                        <span className="truncate">{card.assigned_to ?? "-"}</span>
                      )}
                    </div>
                  </div>
                </div>

                {card.description ? (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-300">{config.terminology.itemDescriptionLabel}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{card.description}</p>
                  </div>
                ) : null}

                {drawerFields.length > 0 ? (
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-xs font-medium text-slate-300">Campos</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {drawerFields.map((field) => (
                        <div key={field.key} className="rounded-md border border-border bg-slate-950/35 p-3">
                          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{field.label}</p>
                          <p className="mt-1 truncate text-sm font-semibold text-white">{formatCustomFieldValue(field, customFields[field.key])}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {canEditCard() ? (
                    <button type="button" className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-white/[0.04] px-3 text-sm text-slate-200 hover:bg-white/[0.06]" onClick={() => onEdit(card.id)}>
                      <Edit3 className="h-4 w-4" />
                      {config.terminology.editItemLabel}
                    </button>
                  ) : null}
                  {!card.is_archived && canArchiveCard() ? (
                    <button type="button" className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-white/[0.04] px-3 text-sm text-slate-200 hover:bg-white/[0.06]" onClick={() => archiveMutation.mutate(card.id)} disabled={archiveMutation.isPending}>
                      <Archive className="h-4 w-4" />
                      Arquivar
                    </button>
                  ) : null}
                  {card.is_archived && canRestoreCard() ? (
                    <Button onClick={() => restoreMutation.mutate(card.id)} disabled={restoreMutation.isPending}>
                      <RotateCcw className="h-4 w-4" />
                      Restaurar
                    </Button>
                  ) : null}
                </div>
              </section>

              {tabs.length > 0 ? (
                <section className="mt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {tabs.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={cn("h-9 rounded-md border border-border bg-white/[0.04] px-3 text-xs font-medium text-slate-200 hover:bg-white/[0.06]", tab === item.key && "border-cyan/30 bg-cyan/10 text-cyan")}
                        onClick={() => setTab(item.key)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4">
                    {tab === "checklist" && config.features.checklist ? <ChecklistPanel cardId={card.id} /> : null}
                    {tab === "comments" && config.features.comments ? <CommentsPanel cardId={card.id} /> : null}
                    {tab === "attachments" && config.features.attachments ? <AttachmentsPanel cardId={card.id} /> : null}
                    {tab === "activity" && config.features.activity ? <ActivityPanel cardId={card.id} /> : null}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        {icon}
        {label}
      </div>
      <div className="truncate text-sm text-slate-200">{value}</div>
    </div>
  );
}
