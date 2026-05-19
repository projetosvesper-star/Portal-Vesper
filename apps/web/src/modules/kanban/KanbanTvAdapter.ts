import type { KanbanCard, KanbanColumn } from "./types";
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
};

export function adaptKanbanCardsToTvItems(cards: KanbanCard[], columns: KanbanColumn[]): KanbanTvItem[] {
  const columnsById = new Map(columns.map((column) => [column.id, column]));
  return cards
    .filter((card) => !card.deleted_at && !card.is_archived)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((card) => {
      const column = columnsById.get(card.column_id);
      return {
        id: card.id,
        title: card.title,
        subtitle: card.description || card.code || null,
        column: column?.name ?? null,
        status: card.status ?? (column?.is_done ? "concluído" : "ativo"),
        priority: card.priority,
        progress: readNumericProgress(card.metadata),
        dueDate: card.due_date,
        tags: [card.code, card.assigned_to ? "Responsável definido" : null].filter(Boolean) as string[],
        sourceType: "kanban",
      };
    });
}

export function adaptProductionTvResponse(response: ProductionTVResponse): KanbanTvItem[] {
  const items = Array.isArray(response.items) ? response.items : Object.values(response.items).flat();
  return items.map(adaptProductionTvItem);
}

export function adaptProductionTvItem(item: ProductionTVItem): KanbanTvItem {
  return {
    id: item.card_id,
    title: item.numero_op,
    subtitle: [item.cliente, item.projeto, item.modelo].filter(Boolean).join(" · ") || null,
    column: item.column_id,
    status: item.status,
    priority: item.prioridade,
    progress: Number.parseFloat(String(item.percentual_checklist ?? "0")),
    dueDate: item.data_entrega,
    tags: [item.cliente, item.modelo].filter(Boolean) as string[],
    sourceType: "production",
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
