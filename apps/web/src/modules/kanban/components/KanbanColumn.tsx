import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import { Button } from "../../../shared/components/Button";
import { cn } from "../../../shared/utils/cn";
import type { KanbanCard, KanbanColumn } from "../types";
import { canCreateCard } from "../utils/permissions";
import { KanbanCard as KanbanCardItem } from "./KanbanCard";

type KanbanColumnProps = {
  column: KanbanColumn;
  cards: KanbanCard[];
  onOpenCard: (cardId: string) => void;
  onCreateCard?: (columnId: string) => void;
  dropIndicatorIndex?: number | null;
  isDragTarget?: boolean;
};

export function KanbanColumn({ column, cards, onOpenCard, onCreateCard, dropIndicatorIndex, isDragTarget }: KanbanColumnProps) {
  const droppableId = `column-${column.id}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { type: "column", columnId: column.id, boardId: column.board_id },
  });

  const sorted = [...cards].sort((a, b) => a.order_index - b.order_index);

  const allowCreate = Boolean(onCreateCard);
  const canCreate = canCreateCard();

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-[320px] flex-col rounded-lg border border-border bg-panel/50",
        (isOver || isDragTarget) && "border-cyan/30 bg-panel/70",
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{column.name}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {sorted.length} card{sorted.length === 1 ? "" : "s"}
            {column.wip_limit ? ` • WIP ${column.wip_limit}` : ""}
          </p>
        </div>
        {allowCreate ? (
          <Button
            className="h-9 px-3 text-xs"
            onClick={() => onCreateCard?.(column.id)}
            disabled={!canCreate}
            title={canCreate ? "Novo card nesta coluna" : "Sem permissão para criar card"}
          >
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        ) : null}
      </header>

      <SortableContext items={sorted.map((c) => `card-${c.id}`)} strategy={verticalListSortingStrategy}>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {sorted.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-white/[0.02] p-3 text-xs text-slate-500">
              Solte um card aqui
            </div>
          ) : null}
          {sorted.map((card, idx) => (
            <div key={card.id}>
              {dropIndicatorIndex === idx ? (
                <div className="mb-2 h-1.5 rounded-full bg-cyan/60 shadow-glow" />
              ) : null}
              <KanbanCardItem card={card} sortableId={`card-${card.id}`} onOpen={onOpenCard} />
            </div>
          ))}
          {dropIndicatorIndex === sorted.length ? <div className="mt-2 h-1.5 rounded-full bg-cyan/60 shadow-glow" /> : null}
        </div>
      </SortableContext>
    </div>
  );
}
