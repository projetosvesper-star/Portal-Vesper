import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as kanbanApi from "./api";
import { kanbanQueryKeys } from "./queryKeys";
import type { CreateCardPayload, KanbanBoardConfig, MoveCardPayload, UpdateCardPayload, UUID } from "./types";
export { kanbanQueryKeys } from "./queryKeys";

export function useKanbanBoards() {
  return useQuery({
    queryKey: kanbanQueryKeys.boards(),
    queryFn: () => kanbanApi.listBoards(),
  });
}

export function useKanbanBoard(boardId: string | undefined) {
  return useQuery({
    queryKey: boardId ? kanbanQueryKeys.board(boardId) : ["kanban", "boards", "undefined"],
    queryFn: () => kanbanApi.getBoard(boardId!),
    enabled: Boolean(boardId),
  });
}

export function useKanbanContexts() {
  return useQuery({
    queryKey: kanbanQueryKeys.contexts(),
    queryFn: () => kanbanApi.listContexts(),
  });
}

export function useKanbanTemplates() {
  return useQuery({
    queryKey: kanbanQueryKeys.templates(),
    queryFn: () => kanbanApi.listTemplates(),
  });
}

export function useBoardConfig(boardId: string | undefined) {
  return useQuery({
    queryKey: boardId ? kanbanQueryKeys.boardConfig(boardId) : ["kanban", "boards", "undefined", "config"],
    queryFn: () => kanbanApi.getBoardConfig(boardId!),
    enabled: Boolean(boardId),
  });
}

export function useUpdateBoardConfig(boardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<KanbanBoardConfig>) => kanbanApi.updateBoardConfig(boardId!, payload),
    onSuccess: async (envelope) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.boards() }),
        queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.board(envelope.board_id) }),
        queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.boardConfig(envelope.board_id) }),
        queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.cards(envelope.board_id) }),
        queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.boardActivity(envelope.board_id) }),
        queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.tv(envelope.board_id) }),
      ]);
    },
  });
}

export function useValidateBoardConfig(boardId: string | undefined) {
  return useMutation({
    mutationFn: (config: KanbanBoardConfig) => kanbanApi.validateBoardConfig(boardId!, config),
  });
}

export function useKanbanColumns(boardId: string | undefined) {
  return useQuery({
    queryKey: boardId ? kanbanQueryKeys.columns(boardId) : ["kanban", "boards", "undefined", "columns"],
    queryFn: () => kanbanApi.listColumns(boardId!),
    enabled: Boolean(boardId),
  });
}

export function useKanbanCards(boardId: string | undefined) {
  return useQuery({
    queryKey: boardId ? kanbanQueryKeys.cards(boardId) : ["kanban", "boards", "undefined", "cards"],
    queryFn: () => kanbanApi.listCards(boardId!),
    enabled: Boolean(boardId),
  });
}

export function useCreateKanbanCard(boardId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCardPayload) => kanbanApi.createCard(payload),
    onSuccess: (card) => {
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.boards() });
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.board(card.board_id) });
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.columns(card.board_id) });
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.cards(card.board_id) });
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.tv(card.board_id) });
      queryClient.setQueryData(kanbanQueryKeys.card(card.id), card);
      if (boardId) queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.boardActivity(boardId) });
    },
  });
}

export function useUpdateKanbanCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, payload }: { cardId: UUID; payload: UpdateCardPayload }) =>
      kanbanApi.updateCard(cardId, payload),
    onSuccess: (card) => {
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.boards() });
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.board(card.board_id) });
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.cards(card.board_id) });
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.tv(card.board_id) });
      queryClient.setQueryData(kanbanQueryKeys.card(card.id), card);
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.activity(card.id) });
    },
  });
}

export function useMoveKanbanCard(boardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, payload }: { cardId: UUID; payload: MoveCardPayload }) => kanbanApi.moveCard(cardId, payload),
    onMutate: async ({ cardId, payload }) => {
      if (!boardId) return;
      await queryClient.cancelQueries({ queryKey: kanbanQueryKeys.cards(boardId) });
      const previous = queryClient.getQueryData<unknown>(kanbanQueryKeys.cards(boardId));

      queryClient.setQueryData(kanbanQueryKeys.cards(boardId), (old: any) => {
        const flat = ((old ?? []) as Array<any>).slice();
        const moving = flat.find((c) => c.id === cardId);
        if (!moving) return flat;

        const fromColumnId = moving.column_id as string;
        const toColumnId = payload.to_column_id as string;
        const targetIndex = Math.max(0, Number(payload.new_order_index ?? 0));

        // Agrupa por coluna, ordena, move e renormaliza order_index na(s) coluna(s) afetada(s).
        const byColumn = new Map<string, any[]>();
        for (const c of flat) {
          const list = byColumn.get(c.column_id) ?? [];
          list.push(c);
          byColumn.set(c.column_id, list);
        }
        for (const [k, list] of byColumn) {
          list.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
          byColumn.set(k, list);
        }

        const fromList = (byColumn.get(fromColumnId) ?? []).filter((c) => c.id !== cardId);
        const toList = (byColumn.get(toColumnId) ?? []).filter((c) => c.id !== cardId);

        const movedCard = { ...moving, column_id: toColumnId };
        const clamped = Math.min(targetIndex, toList.length);
        toList.splice(clamped, 0, movedCard);

        fromList.forEach((c, idx) => (c.order_index = idx));
        toList.forEach((c, idx) => (c.order_index = idx));

        byColumn.set(fromColumnId, fromList);
        byColumn.set(toColumnId, toList);

        const result: any[] = [];
        for (const list of byColumn.values()) {
          result.push(...list);
        }
        return result;
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (!boardId) return;
      if (context?.previous) queryClient.setQueryData(kanbanQueryKeys.cards(boardId), context.previous);
    },
    onSuccess: (card) => {
      queryClient.setQueryData(kanbanQueryKeys.card(card.id), card);
    },
    onSettled: (_data, _err, vars) => {
      if (!boardId) return;
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.cards(boardId) });
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.columns(boardId) });
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.activity(vars.cardId) });
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.boardActivity(boardId) });
    },
  });
}

export function useArchiveKanbanCard(boardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cardId: UUID) => kanbanApi.archiveCard(cardId),
    onSuccess: (card) => {
      if (boardId) queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.cards(boardId) });
      queryClient.setQueryData(kanbanQueryKeys.card(card.id), card);
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.activity(card.id) });
    },
  });
}

export function useRestoreKanbanCard(boardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cardId: UUID) => kanbanApi.restoreCard(cardId),
    onSuccess: (card) => {
      if (boardId) queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.cards(boardId) });
      queryClient.setQueryData(kanbanQueryKeys.card(card.id), card);
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.activity(card.id) });
    },
  });
}

export function useKanbanChecklist(cardId: string | undefined) {
  return useQuery({
    queryKey: cardId ? kanbanQueryKeys.checklist(cardId) : ["kanban", "cards", "undefined", "checklist"],
    queryFn: () => kanbanApi.listChecklist(cardId!),
    enabled: Boolean(cardId),
  });
}

export function useKanbanComments(cardId: string | undefined) {
  return useQuery({
    queryKey: cardId ? kanbanQueryKeys.comments(cardId) : ["kanban", "cards", "undefined", "comments"],
    queryFn: () => kanbanApi.listComments(cardId!),
    enabled: Boolean(cardId),
  });
}

export function useKanbanAttachments(cardId: string | undefined) {
  return useQuery({
    queryKey: cardId ? kanbanQueryKeys.attachments(cardId) : ["kanban", "cards", "undefined", "attachments"],
    queryFn: () => kanbanApi.listAttachments(cardId!),
    enabled: Boolean(cardId),
  });
}

export function useKanbanActivity(cardId: string | undefined) {
  return useQuery({
    queryKey: cardId ? kanbanQueryKeys.activity(cardId) : ["kanban", "cards", "undefined", "activity"],
    queryFn: () => kanbanApi.listCardActivity(cardId!),
    enabled: Boolean(cardId),
  });
}
