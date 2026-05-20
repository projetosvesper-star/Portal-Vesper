import { formatCustomFieldValue, getCardCustomFields } from "./config";
import type { KanbanBoardConfig, KanbanCard, KanbanColumn } from "./types";
import type { ProductionTVItem, ProductionTVResponse } from "../production/types";

export type KanbanTvItem = {
  id: string;
  title: string;
  subtitle: string | null;
  column: string | null;
  status: string | null;
  priority: string | null;
  progress: number | null;
  dueDate: string | null;
  tags: string[];
  sourceType: "kanban" | "production";
  textSize?: "normal" | "large" | "xlarge";
};

export function adaptKanbanCardsToTvItems(cards: KanbanCard[], columns: KanbanColumn[], config?: KanbanBoardConfig): KanbanTvItem[] {
  const columnsById = new Map(columns.map((column) => [column.id, column]));
  const tvConfig = config?.tv;
  const tvFields = (config?.card.fields ?? []).filter((field) => field.showInTv).sort((a, b) => a.order - b.order);

  return cards
    .filter((card) => !card.deleted_at && !card.is_archived)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((card) => {
      const column = columnsById.get(card.column_id);
      const customFields = getCardCustomFields(card.metadata);
      const configuredSubtitle = tvConfig?.subtitleFields?.length
        ? tvConfig.subtitleFields.map((key) => customFields[key] ?? (card as any)[key]).filter(Boolean).join(" · ")
        : "";
      const customTags = tvFields.map((field) => `${field.label}: ${formatCustomFieldValue(field, customFields[field.key])}`);
      return {
        id: card.id,
        title: card.title,
        subtitle: configuredSubtitle || card.description || card.code || null,
        column: column?.name ?? null,
        status: card.status ?? (column?.is_done ? "concluido" : "ativo"),
        priority: tvConfig?.showPriority === false ? null : card.priority,
        progress: tvConfig?.showChecklist === false ? null : readNumericProgress(card.metadata),
        dueDate: tvConfig?.showDueDate === false ? null : card.due_date,
        tags: [
          ...(tvConfig?.showTags === false ? [] : customTags),
          card.code,
          tvConfig?.showAssignee !== false && card.assigned_to ? "Responsavel definido" : null,
        ].filter(Boolean) as string[],
        sourceType: "kanban",
        textSize: tvConfig?.textSize,
      };
    });
}

export function adaptProductionTvResponse(response: ProductionTVResponse, config?: KanbanBoardConfig): KanbanTvItem[] {
  const items = Array.isArray(response.items) ? response.items : Object.values(response.items).flat();
  return items.map((item) => adaptProductionTvItem(item, config));
}

export function adaptProductionTvItem(item: ProductionTVItem, config?: KanbanBoardConfig): KanbanTvItem {
  const tvConfig = config?.tv;
  return {
    id: item.card_id,
    title: item.numero_op,
    subtitle: [item.cliente, item.projeto, item.modelo].filter(Boolean).join(" · ") || null,
    column: item.column_id,
    status: item.status,
    priority: tvConfig?.showPriority === false ? null : item.prioridade,
    progress: tvConfig?.showChecklist === false ? null : Number.parseFloat(String(item.percentual_checklist ?? "0")),
    dueDate: tvConfig?.showDueDate === false ? null : item.data_entrega,
    tags: tvConfig?.showTags === false ? [] : ([item.cliente, item.modelo].filter(Boolean) as string[]),
    sourceType: "production",
    textSize: tvConfig?.textSize,
  };
}

export function groupTvItemsByColumn(items: KanbanTvItem[]) {
  return items.reduce<Record<string, KanbanTvItem[]>>((acc, item) => {
    const key = item.column || item.status || "Sem coluna";
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});
}

function readNumericProgress(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return null;
  const raw = metadata.percentual_checklist ?? metadata.progress ?? metadata.checklist_progress;
  const value = typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? ""));
  return Number.isFinite(value) ? value : null;
}
