export function KanbanEnginePage() {
  return <KanbanEnginePageInner />;
}

import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { Button } from "../../shared/components/Button";
import { useToast } from "../../shared/components/ToastProvider";
import { cn } from "../../shared/utils/cn";
import { usePortalWebSocketContext } from "../../shared/hooks/usePortalWebSocket";
import {
  kanbanQueryKeys,
  useCreateKanbanCard,
  useKanbanBoards,
  useKanbanCards,
  useKanbanColumns,
  useMoveKanbanCard,
  useUpdateKanbanCard,
} from "./hooks";
import type { KanbanCard, KanbanColumn, Priority, UUID } from "./types";
import { BoardSelector } from "./components/BoardSelector";
import { BoardToolbar } from "./components/BoardToolbar";
import { CardDetailDrawer } from "./components/CardDetailDrawer";
import { CardFormDialog } from "./components/CardFormDialog";
import { EmptyKanbanState } from "./components/EmptyKanbanState";
import { KanbanBoard } from "./components/KanbanBoard";
import { KanbanBoardSkeleton } from "./components/KanbanBoardSkeleton";
import { canCreateCard } from "./utils/permissions";

function KanbanEnginePageInner() {
  const navigate = useNavigate();
  const params = useParams();
  const boardIdParam = (params as any).boardId as string | undefined;
  const queryClient = useQueryClient();
  const { subscribe } = usePortalWebSocketContext();
  const toast = useToast();
  const wsTimerRef = useRef<number | null>(null);
  const wsPendingRef = useRef<{
    boards?: boolean;
    board?: boolean;
    columns?: boolean;
    cards?: boolean;
    cardIds?: Set<string>;
  }>({ cardIds: new Set() });

  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [cardFormOpen, setCardFormOpen] = useState(false);
  const [cardFormColumnId, setCardFormColumnId] = useState<string | undefined>(undefined);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [drawerCardId, setDrawerCardId] = useState<string | null>(null);

  const boardsQuery = useKanbanBoards();
  const boards = boardsQuery.data ?? [];

  const selectedBoardId = boardIdParam ?? null;

  // Autoseleção de board ao entrar em /kanban
  useEffect(() => {
    if (selectedBoardId) return;
    if (boardsQuery.isLoading) return;
    if (boards.length === 0) return;
    const preferred = boards.find((b) => b.key === "producao") ?? boards[0];
    navigate(`/kanban/${preferred.id}`, { replace: true });
  }, [selectedBoardId, boardsQuery.isLoading, boards, navigate]);

  const columnsQuery = useKanbanColumns(selectedBoardId ?? undefined);
  const cardsQuery = useKanbanCards(selectedBoardId ?? undefined);

  const columns = columnsQuery.data ?? [];
  const cards = cardsQuery.data ?? [];

  const columnsById = useMemo(() => {
    const map = new Map<string, KanbanColumn>();
    for (const c of columns) map.set(c.id, c);
    return map;
  }, [columns]);

  const computed = useMemo(() => {
    const now = Date.now();
    const total = cards.length;
    const archived = cards.filter((c) => c.is_archived).length;
    const done = cards.filter((c) => {
      const col = columnsById.get(c.column_id);
      return Boolean(c.completed_at) || Boolean(col?.is_done);
    }).length;
    const inProgress = cards.filter((c) => !c.is_archived && !Boolean(c.completed_at) && !Boolean(columnsById.get(c.column_id)?.is_done)).length;
    const delayed = cards.filter((c) => {
      if (c.is_archived) return false;
      if (!c.due_date) return false;
      if (Boolean(c.completed_at) || Boolean(columnsById.get(c.column_id)?.is_done)) return false;
      const due = new Date(c.due_date).getTime();
      return !Number.isNaN(due) && due < now;
    }).length;
    return { total, archived, done, inProgress, delayed };
  }, [cards, columnsById]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((c) => {
      if (!showArchived && c.is_archived) return false;
      if (!q) return true;
      return (c.title ?? "").toLowerCase().includes(q) || (c.code ?? "").toLowerCase().includes(q);
    });
  }, [cards, search, showArchived]);

  const moveMutation = useMoveKanbanCard(selectedBoardId ?? undefined);
  const createCardMutation = useCreateKanbanCard(selectedBoardId ?? undefined);
  const updateCardMutation = useUpdateKanbanCard();

  const editingCard = useMemo(() => cards.find((c) => c.id === editingCardId) ?? null, [cards, editingCardId]);

  // WebSocket → invalidação TanStack Query
  useEffect(() => {
    return subscribe((event) => {
      if (!event?.type?.startsWith("kanban.")) return;

      const type = event.type;
      const payload = (event.payload ?? {}) as any;
      const cardId = (payload.card_id ?? payload.cardId) as string | undefined;
      const boardId = (payload.board_id ?? payload.boardId) as string | undefined;

      const pending = wsPendingRef.current;
      if (type.startsWith("kanban.board.")) pending.boards = true;
      if (type.startsWith("kanban.column.")) pending.columns = true;
      if (type.startsWith("kanban.card.")) pending.cards = true;
      if (type.startsWith("kanban.comment.") || type.startsWith("kanban.checklist.") || type.startsWith("kanban.attachment.")) {
        pending.cards = true;
      }
      if (boardId && selectedBoardId && boardId === selectedBoardId) pending.board = true;
      if (cardId) pending.cardIds?.add(cardId);

      if (wsTimerRef.current) window.clearTimeout(wsTimerRef.current);
      wsTimerRef.current = window.setTimeout(() => {
        const p = wsPendingRef.current;
        if (p.boards) queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.boards() });
        if (selectedBoardId) {
          if (p.board) queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.board(selectedBoardId) });
          if (p.columns) queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.columns(selectedBoardId) });
          if (p.cards) queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.cards(selectedBoardId) });
        }
        for (const id of p.cardIds ?? []) {
          queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.card(id) });
          queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.checklist(id) });
          queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.comments(id) });
          queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.attachments(id) });
          queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.activity(id) });
        }
        wsPendingRef.current = { cardIds: new Set() };
        wsTimerRef.current = null;
      }, 250);
    });
  }, [subscribe, queryClient, selectedBoardId]);

  const canCreatePerm = canCreateCard();
  const canCreate = canCreatePerm && Boolean(selectedBoardId) && columns.length > 0;

  function handleSelectBoard(nextBoardId: string) {
    navigate(`/kanban/${nextBoardId}`);
    setDrawerCardId(null);
  }

  function openCreateCard(columnId?: string) {
    setEditingCardId(null);
    setCardFormColumnId(columnId);
    setCardFormOpen(true);
  }

  async function handleSubmitCard(values: any) {
      const payloadBase = {
        board_id: values.board_id,
        column_id: values.column_id,
        title: values.title.trim(),
        description: values.description?.trim() || null,
        priority: (values.priority as Priority) ?? "medium",
        due_date: values.due_date || null,
        start_date: values.start_date || null,
        assigned_to: values.assigned_to || null,
        code: values.code?.trim() || null,
        status: values.status?.trim() || null,
      };

      try {
        if (editingCardId) {
          // Detectar mudança de coluna
          const columnChanged = editingCard?.column_id !== values.column_id;
          await updateCardMutation.mutateAsync({ cardId: editingCardId as UUID, payload: payloadBase });
          if (columnChanged) {
            // chamar endpoint de movimento
            await moveMutation.mutateAsync({
              cardId: editingCardId as UUID,
              payload: {
                to_column_id: values.column_id as UUID,
                new_order_index: 0,
              },
            });
          }
          toast.success("Card atualizado", "Alterações salvas com sucesso.");
        } else {
          await createCardMutation.mutateAsync(payloadBase);
          toast.success("Card criado", "Novo card criado com sucesso.");
        }
      } catch (e) {
        toast.error("Falha ao salvar card", (e as Error)?.message ?? "Erro inesperado");
        throw e;
      }
    }

  function handleMoveCard(args: { cardId: string; toColumnId: string; newOrderIndex: number }) {
    moveMutation.mutate(
      { cardId: args.cardId as UUID, payload: { to_column_id: args.toColumnId, new_order_index: args.newOrderIndex } },
      {
        onSuccess: () => toast.success("Card movido", "Posição atualizada."),
        onError: (e) => toast.error("Falha ao mover card", (e as Error)?.message ?? "Erro inesperado"),
      },
    );
  }

  const isEmpty = !boardsQuery.isLoading && !boardsQuery.isError && boards.length === 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-white">Kanban</h1>
          <p className="mt-1 text-sm text-slate-400">Gerencie quadros, colunas e cards do Portal Vesper</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <BoardSelector boards={boards} value={selectedBoardId} onChange={handleSelectBoard} disabled={boardsQuery.isLoading || boards.length === 0} />
          <Button
            onClick={() => openCreateCard()}
            disabled={!canCreate}
            title={
              !selectedBoardId
                ? "Selecione um board"
                : columns.length === 0
                  ? "Board sem colunas"
                  : !canCreatePerm
                    ? "Sem permissão para criar card"
                    : "Criar novo card"
            }
          >
            <Plus className="h-4 w-4" />
            Novo card
          </Button>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-5">
        {[
          { label: "Total", value: computed.total },
          { label: "Em andamento", value: computed.inProgress },
          { label: "Atrasados", value: computed.delayed },
          { label: "Concluídos", value: computed.done },
          { label: "Arquivados", value: computed.archived },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-border bg-panel/60 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{kpi.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-border bg-panel/40 p-4">
        <BoardToolbar
          search={search}
          onSearchChange={setSearch}
          showArchived={showArchived}
          onToggleArchived={() => setShowArchived((v) => !v)}
          onRefresh={() => {
            if (!selectedBoardId) return;
            queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.columns(selectedBoardId) });
            queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.cards(selectedBoardId) });
          }}
          disableRefresh={!selectedBoardId}
        />
      </section>

      {boardsQuery.isError ? (
        <div className="rounded-lg border border-border bg-panel/60 p-6 text-sm text-rose-200">
          {(boardsQuery.error as Error)?.message ?? "Falha ao carregar boards."}
        </div>
      ) : isEmpty ? (
        <EmptyKanbanState />
      ) : !selectedBoardId ? (
        <div className="rounded-lg border border-border bg-panel/60 p-6 text-sm text-slate-300">Selecione um board.</div>
      ) : columnsQuery.isLoading || cardsQuery.isLoading ? (
        <KanbanBoardSkeleton />
      ) : columnsQuery.isError || cardsQuery.isError ? (
        <div className="rounded-lg border border-border bg-panel/60 p-6 text-sm text-rose-200">
          {(columnsQuery.error as Error)?.message ?? (cardsQuery.error as Error)?.message ?? "Falha ao carregar dados do board."}
        </div>
      ) : columns.length === 0 ? (
        <div className="rounded-lg border border-border bg-panel/60 p-6 text-sm text-slate-300">
          Este board não possui colunas ativas.
        </div>
      ) : (
        <KanbanBoard
          columns={columns}
          cards={filteredCards}
          onOpenCard={(id) => setDrawerCardId(id)}
          onCreateCard={(colId) => openCreateCard(colId)}
          onMoveCard={handleMoveCard}
        />
      )}

      <CardDetailDrawer
        open={Boolean(drawerCardId)}
        cardId={drawerCardId}
        boardId={selectedBoardId ?? undefined}
        columns={columns}
        onClose={() => setDrawerCardId(null)}
        onEdit={(id) => {
          setDrawerCardId(null);
          setEditingCardId(id);
          setCardFormOpen(true);
        }}
      />

      <CardFormDialog
        open={cardFormOpen}
        onOpenChange={setCardFormOpen}
        boardId={(selectedBoardId ?? "") as UUID}
        columns={columns}
        initialColumnId={cardFormColumnId as UUID | undefined}
        editingCard={editingCard as KanbanCard | null}
        onSubmit={handleSubmitCard}
      />

      {boardsQuery.isFetching || columnsQuery.isFetching || cardsQuery.isFetching ? (
        <div className={cn("fixed bottom-4 right-4 rounded-md border border-border bg-panel/90 px-3 py-2 text-xs text-slate-200")}>
          Atualizando…
        </div>
      ) : null}
    </div>
  );
}
