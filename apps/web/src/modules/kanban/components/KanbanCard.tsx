import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { cn } from "../../../shared/utils/cn";
import type { KanbanCard } from "../types";
import { priorityClasses, priorityLabel } from "../utils/priority";
import { canMoveCard } from "../utils/permissions";

type KanbanCardProps = {
  card: KanbanCard;
  onOpen: (cardId: string) => void;
  isOverlay?: boolean;
};

export function KanbanCardView({ card, onOpen, isOverlay }: KanbanCardProps) {
  const draggable = canMoveCard();

  return (
    <button
      type="button"
      onClick={() => onOpen(card.id)}
      className={cn(
        "group relative w-full rounded-md border border-border bg-panel2/70 px-3 py-2 text-left shadow-sm transition",
        "hover:border-cyan/25 hover:bg-panel2/90 hover:shadow-glow/20",
        isOverlay && "shadow-glow border-cyan/30 bg-panel2",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-100">{card.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {card.code ? (
              <span className="rounded border border-border bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-slate-300">
                {card.code}
              </span>
            ) : null}
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                priorityClasses(card.priority),
              )}
            >
              {priorityLabel(card.priority)}
            </span>
            {card.is_archived ? (
              <span className="rounded-full border border-border bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-400">
                Arquivado
              </span>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "mt-0.5 flex h-7 w-7 items-center justify-center rounded border border-transparent text-slate-500",
            draggable ? "group-hover:border-border group-hover:bg-white/[0.04]" : "opacity-40",
          )}
          title={draggable ? "Arraste para mover" : "Sem permissão para mover"}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </div>
    </button>
  );
}

type DraggableKanbanCardProps = KanbanCardProps & {
  sortableId: string;
};

export function KanbanCard({ card, onOpen, sortableId }: DraggableKanbanCardProps) {
  const disabled = !canMoveCard() || card.is_archived;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
    disabled,
    data: {
      type: "card",
      cardId: card.id,
      fromColumnId: card.column_id,
      boardId: card.board_id,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("select-none", isDragging && "opacity-60")}>
      <div {...attributes}>
        <div className={cn(!disabled && "cursor-default")} onClick={() => onOpen(card.id)}>
          <div className={cn("group relative w-full rounded-md border border-border bg-panel2/70 px-3 py-2 text-left shadow-sm transition",
            "hover:border-cyan/25 hover:bg-panel2/90 hover:shadow-glow/20",
            isDragging && "border-cyan/30 bg-panel2",
          )}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-100">{card.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {card.code ? (
                    <span className="rounded border border-border bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-slate-300">
                      {card.code}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      priorityClasses(card.priority),
                    )}
                  >
                    {priorityLabel(card.priority)}
                  </span>
                  {card.is_archived ? (
                    <span className="rounded-full border border-border bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-400">
                      Arquivado
                    </span>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                ref={setActivatorNodeRef}
                {...listeners}
                className={cn(
                  "mt-0.5 flex h-7 w-7 items-center justify-center rounded border border-transparent text-slate-500",
                  disabled ? "opacity-40 cursor-not-allowed" : "cursor-grab active:cursor-grabbing group-hover:border-border group-hover:bg-white/[0.04]",
                )}
                title={disabled ? "Sem permissão para mover" : "Arraste para mover"}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
