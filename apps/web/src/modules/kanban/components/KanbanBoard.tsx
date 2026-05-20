import { closestCorners, DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { restrictToFirstScrollableAncestor, restrictToWindowEdges } from "@dnd-kit/modifiers";

import { cn } from "../../../shared/utils/cn";
import type { KanbanBoardConfig, KanbanCard, KanbanColumn as KanbanColumnType } from "../types";
import { canMoveCard } from "../utils/permissions";
import { useKanbanDndSensors } from "../utils/dnd";
import { KanbanCardView } from "./KanbanCard";
import { KanbanColumn as KanbanColumnComponent } from "./KanbanColumn";

type KanbanBoardProps = {
  columns: KanbanColumnType[];
  cards: KanbanCard[];
  onOpenCard: (cardId: string) => void;
  onCreateCard?: (columnId: string) => void;
  onMoveCard?: (args: { cardId: string; toColumnId: string; newOrderIndex: number }) => void;
  config?: KanbanBoardConfig;
};

export function KanbanBoard({ columns, cards, onOpenCard, onCreateCard, onMoveCard, config }: KanbanBoardProps) {
  const sensors = useKanbanDndSensors();
  const allowDnD = canMoveCard() && Boolean(onMoveCard);

  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const activeCard = useMemo(() => cards.find((c) => c.id === activeCardId) ?? null, [activeCardId, cards]);

  const sortedColumns = useMemo(() => [...columns].sort((a, b) => a.order_index - b.order_index), [columns]);

  const cardsByColumn = useMemo(() => {
    const map = new Map<string, KanbanCard[]>();
    for (const col of sortedColumns) map.set(col.id, []);
    for (const card of cards) {
      const list = map.get(card.column_id);
      if (list) list.push(card);
    }
    for (const [key, list] of map) {
      list.sort((a, b) => a.order_index - b.order_index);
      map.set(key, list);
    }
    return map;
  }, [cards, sortedColumns]);

  function handleDragStart(event: any) {
    const data = event?.active?.data?.current as any;
    if (data?.type === "card") setActiveCardId(data.cardId);
  }

  function handleDragOver(event: any) {
    if (!allowDnD) return;
    const overId = event.over?.id;
    if (!overId) {
      setOverColumnId(null);
      setOverIndex(null);
      return;
    }
    const overIdStr = String(overId);
    if (overIdStr.startsWith("column-")) {
      const colId = overIdStr.replace("column-", "");
      const list = cardsByColumn.get(colId) ?? [];
      setOverColumnId(colId);
      setOverIndex(list.length);
      return;
    }
    if (overIdStr.startsWith("card-")) {
      const overCardId = overIdStr.replace("card-", "");
      const overCard = cards.find((c) => c.id === overCardId);
      if (!overCard) return;
      const list = cardsByColumn.get(overCard.column_id) ?? [];
      setOverColumnId(overCard.column_id);
      setOverIndex(Math.max(0, list.findIndex((c) => c.id === overCardId)));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCardId(null);
    setOverColumnId(null);
    setOverIndex(null);
    if (!allowDnD) return;

    const activeData = event.active.data.current as any;
    if (activeData?.type !== "card") return;

    const cardId: string = activeData.cardId;
    const fromColumnId: string = activeData.fromColumnId;

    const overId = event.over?.id;
    if (!overId) return;

    let toColumnId: string | null = null;
    let newOrderIndex = 0;

    const overIdStr = String(overId);
    if (overIdStr.startsWith("column-")) {
      toColumnId = overIdStr.replace("column-", "");
      const list = cardsByColumn.get(toColumnId) ?? [];
      newOrderIndex = list.length;
    } else if (overIdStr.startsWith("card-")) {
      const overCardId = overIdStr.replace("card-", "");
      const overCard = cards.find((c) => c.id === overCardId);
      if (!overCard) return;
      toColumnId = overCard.column_id;
      const list = cardsByColumn.get(toColumnId) ?? [];
      newOrderIndex = Math.max(0, list.findIndex((c) => c.id === overCardId));
    }

    if (!toColumnId) return;

    onMoveCard?.({ cardId, toColumnId, newOrderIndex });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      modifiers={[restrictToFirstScrollableAncestor, restrictToWindowEdges]}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("flex min-h-[60vh] gap-4 overflow-x-auto pb-2")}>
        {sortedColumns.map((column) => (
          <KanbanColumnComponent
            key={column.id}
            column={column}
            cards={cardsByColumn.get(column.id) ?? []}
            onOpenCard={onOpenCard}
            onCreateCard={onCreateCard}
            isDragTarget={overColumnId === column.id}
            dropIndicatorIndex={overColumnId === column.id ? overIndex : null}
            config={config}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? (
          <div className="w-[320px]">
            <KanbanCardView card={activeCard} onOpen={() => {}} isOverlay config={config} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
