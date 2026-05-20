import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Settings } from "lucide-react";

import { useToast } from "../../shared/components/ToastProvider";
import { cn } from "../../shared/utils/cn";
import { usePortalWebSocketContext } from "../../shared/hooks/usePortalWebSocket";
import { EmptyState, ErrorState, MetricCard, PageHeader, PortalButton, PortalInput } from "../../shared/ui";
import { normalizeBoardConfig } from "./config";
import { createColumn } from "./api";
import {
  kanbanQueryKeys,
  useBoardConfig,
  useCreateKanbanCard,
  useKanbanBoards,
  useKanbanCards,
  useKanbanColumns,
  useMoveKanbanCard,
  useUpdateBoardConfig,
  useUpdateKanbanCard,
} from "./hooks";
import type { KanbanCard, KanbanColumn, Priority, UUID } from "./types";
import { BoardSelector } from "./components/BoardSelector";
import { BoardToolbar } from "./components/BoardToolbar";
import { CardDetailDrawer } from "./components/CardDetailDrawer";
import { CardFormDialog } from "./components/CardFormDialog";
import { EmptyKanbanState } from "./components/EmptyKanbanState";
import { KanbanBoardConfigDrawer } from "./components/KanbanBoardConfigDrawer";
import { KanbanBoard } from "./components/KanbanBoard";
import { KanbanBoardSkeleton } from "./components/KanbanBoardSkeleton";
import { canCreateCard } from "./utils/permissions";

export function KanbanEnginePage() {
  return <KanbanEnginePageInner />;
}

function KanbanEnginePageInner() {
  const navigate = useNavigate();
  const params = useParams();
  const boardIdParam = (params as { boardId?: string }).boardId;
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
  const [manualColumnName, setManualColumnName] = useState("");
  const [configOpen, setConfigOpen] = useState(false);

  const boardsQuery = useKanbanBoards();
  const boards = boardsQuery.data ?? [];
  const selectedBoardId = boardIdParam ?? null;
  const selectedBoard = boards.find((board) => board.id === selectedBoardId) ?? null;
  const boardConfigQuery = useBoardConfig(selectedBoardId ?? undefined);
  const boardConfig = boardConfigQuery.data?.config ?? normalizeBoardConfig(selectedBoard);
  const updateBoardConfigMutation = useUpdateBoardConfig(selectedBoardId ?? undefined);

  useEffect(() => {
    if (selectedBoardId) return;
    if (boardsQuery.isLoading) return;
    if (boards.length === 0) return;
    const preferred = boards.find((board) => board.key === "kanban_producao" || board.module_context === "producao") ?? boards[0];
    navigate(`/kanban/boards/${preferred.id}`, { replace: true });
  }, [selectedBoardId, boardsQuery.isLoading, boards, navigate]);

  const columnsQuery = useKanbanColumns(selectedBoardId ?? undefined);
  const cardsQuery = useKanbanCards(selectedBoardId ?? undefined);
  const columns = columnsQuery.data ?? [];
  const cards = cardsQuery.data ?? [];

  const columnsById = useMemo(() => {
    const map = new Map<string, KanbanColumn>();
    for (const column of columns) map.set(column.id, column);
    return map;
  }, [columns]);

  const computed = useMemo(() => {
    const now = Date.now();
    const total = cards.length;
    const archived = cards.filter((card) => card.is_archived).length;
    const done = cards.filter((card) => {
      const column = columnsById.get(card.column_id);
      return Boolean(card.completed_at) || Boolean(column?.is_done);
    }).length;
    const inProgress = cards.filter((card) => !card.is_archived && !card.completed_at && !columnsById.get(card.column_id)?.is_done).length;
    const delayed = cards.filter((card) => {
      if (card.is_archived || !card.due_date || card.completed_at || columnsById.get(card.column_id)?.is_done) return false;
      const due = new Date(card.due_date).getTime();
      return !Number.isNaN(due) && due < now;
    }).length;
    return { total, archived, done, inProgress, delayed };
  }, [cards, columnsById]);

  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cards.filter((card) => {
      if (!showArchived && card.is_archived) return false;
      if (!query) return true;
      return (card.title ?? "").toLowerCase().includes(query) || (card.code ?? "").toLowerCase().includes(query);
    });
  }, [cards, search, showArchived]);

  const moveMutation = useMoveKanbanCard(selectedBoardId ?? undefined);
  const createCardMutation = useCreateKanbanCard(selectedBoardId ?? undefined);
  const updateCardMutation = useUpdateKanbanCard();
  const createColumnMutation = useMutation({
    mutationFn: ({ name, orderIndex, isDone = false }: { name: string; orderIndex: number; isDone?: boolean }) =>
      createColumn(selectedBoardId!, {
        name,
        key: slugify(name),
        order_index: orderIndex,
        is_done: isDone,
        metadata: { created_from: "kanban_board_page" },
      }),
    onSuccess: async () => {
      if (!selectedBoardId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.columns(selectedBoardId) }),
        queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.board(selectedBoardId) }),
      ]);
      setManualColumnName("");
    },
    onError: (error) => {
      toast.error("Falha ao criar coluna", (error as Error)?.message ?? "Erro inesperado");
    },
  });

  const editingCard = useMemo(() => cards.find((card) => card.id === editingCardId) ?? null, [cards, editingCardId]);

  useEffect(() => {
    return subscribe((event) => {
      if (!event?.type?.startsWith("kanban.")) return;

      const type = event.type;
      const payload = (event.payload ?? {}) as { card_id?: string; cardId?: string; board_id?: string; boardId?: string };
      const cardId = payload.card_id ?? payload.cardId;
      const boardId = payload.board_id ?? payload.boardId;

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
        const pendingState = wsPendingRef.current;
        if (pendingState.boards) queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.boards() });
        if (selectedBoardId) {
          if (pendingState.board) queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.board(selectedBoardId) });
          if (pendingState.columns) queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.columns(selectedBoardId) });
          if (pendingState.cards) queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.cards(selectedBoardId) });
        }
        for (const id of pendingState.cardIds ?? []) {
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
    navigate(`/kanban/boards/${nextBoardId}`);
    setDrawerCardId(null);
  }

  function openCreateCard(columnId?: string) {
    setEditingCardId(null);
    setCardFormColumnId(columnId);
    setCardFormOpen(true);
  }

  async function handleSubmitCard(values: {
    board_id: UUID;
    column_id: UUID;
    title: string;
    description?: string;
    priority?: Priority;
    due_date?: string;
    start_date?: string;
    assigned_to?: string;
    code?: string;
    status?: string;
    metadata?: Record<string, unknown>;
  }) {
    const payloadBase = {
      board_id: values.board_id,
      column_id: values.column_id,
      title: values.title.trim(),
      description: values.description?.trim() || null,
      priority: values.priority ?? "medium",
      due_date: values.due_date || null,
      start_date: values.start_date || null,
      assigned_to: values.assigned_to || null,
      code: values.code?.trim() || null,
      status: values.status?.trim() || null,
      metadata: values.metadata ?? {},
    };

    try {
      if (editingCardId) {
        const columnChanged = editingCard?.column_id !== values.column_id;
        await updateCardMutation.mutateAsync({ cardId: editingCardId as UUID, payload: payloadBase });
        if (columnChanged) {
          await moveMutation.mutateAsync({
            cardId: editingCardId as UUID,
            payload: {
              to_column_id: values.column_id,
              new_order_index: 0,
            },
          });
        }
        toast.success(`${boardConfig.terminology.itemSingular} atualizado`, "Alteracoes salvas com sucesso.");
      } else {
        await createCardMutation.mutateAsync(payloadBase);
        toast.success(`${boardConfig.terminology.itemSingular} criado`, "Novo item criado com sucesso.");
      }
    } catch (error) {
      toast.error(`Falha ao salvar ${boardConfig.terminology.itemSingular}`, (error as Error)?.message ?? "Erro inesperado");
      throw error;
    }
  }

  function handleMoveCard(args: { cardId: string; toColumnId: string; newOrderIndex: number }) {
    moveMutation.mutate(
      { cardId: args.cardId as UUID, payload: { to_column_id: args.toColumnId, new_order_index: args.newOrderIndex } },
      {
        onSuccess: () => toast.success("Card movido", "Posição atualizada."),
        onError: (error) => toast.error("Falha ao mover card", (error as Error)?.message ?? "Erro inesperado"),
      },
    );
  }

  async function createDefaultColumns() {
    if (!selectedBoardId) return;
    const names = ["A fazer", "Em andamento", "Revisão", "Concluído"];
    for (const [index, name] of names.entries()) {
      await createColumnMutation.mutateAsync({ name, orderIndex: index, isDone: index === names.length - 1 });
    }
    toast.success("Colunas criadas", "As colunas padrão foram criadas para este quadro.");
  }

  function createManualColumn() {
    const name = manualColumnName.trim();
    if (!name) return;
    createColumnMutation.mutate({ name, orderIndex: columns.length });
  }

  const isEmpty = !boardsQuery.isLoading && !boardsQuery.isError && boards.length === 0;

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden p-4 sm:p-6">
      <PageHeader
        title={selectedBoard?.name ?? "Kanban"}
        subtitle="Gerencie quadros, colunas e cards do Portal Vesper."
        actions={
          <>
            <BoardSelector boards={boards} value={selectedBoardId} onChange={handleSelectBoard} disabled={boardsQuery.isLoading || boards.length === 0} />
            <PortalButton variant="secondary" onClick={() => setConfigOpen(true)} disabled={!selectedBoardId}>
              <Settings className="h-4 w-4" />
              Configuracoes do quadro
            </PortalButton>
            <PortalButton
              onClick={() => openCreateCard()}
              disabled={!canCreate}
              title={
                !selectedBoardId
                  ? "Selecione um quadro"
                  : columns.length === 0
                    ? "Quadro sem colunas"
                    : !canCreatePerm
                      ? "Sem permissao para criar"
                      : boardConfig.terminology.newItemLabel
              }
            >
              <Plus className="h-4 w-4" />
              {boardConfig.terminology.newItemLabel}
            </PortalButton>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total", value: computed.total },
          { label: "Em andamento", value: computed.inProgress },
          { label: "Atrasados", value: computed.delayed },
          { label: "Concluídos", value: computed.done },
          { label: "Arquivados", value: computed.archived },
        ].map((kpi) => (
          <MetricCard key={kpi.label} label={kpi.label} value={kpi.value} />
        ))}
      </section>

      <section className="rounded-lg border border-border bg-panel/40 p-4">
        <BoardToolbar
          search={search}
          onSearchChange={setSearch}
          showArchived={showArchived}
          onToggleArchived={() => setShowArchived((current) => !current)}
          onRefresh={() => {
            if (!selectedBoardId) return;
            queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.columns(selectedBoardId) });
            queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.cards(selectedBoardId) });
          }}
          disableRefresh={!selectedBoardId}
        />
      </section>

      {boardsQuery.isError ? (
        <ErrorState error={boardsQuery.error} title="Falha ao carregar quadros" fallback="Falha ao carregar quadros." onRetry={() => boardsQuery.refetch()} />
      ) : isEmpty ? (
        <EmptyKanbanState />
      ) : !selectedBoardId ? (
        <EmptyState title="Selecione um quadro" description="Escolha um quadro para visualizar colunas e cards." />
      ) : columnsQuery.isLoading || cardsQuery.isLoading ? (
        <KanbanBoardSkeleton />
      ) : columnsQuery.isError || cardsQuery.isError ? (
        <ErrorState
          error={columnsQuery.error ?? cardsQuery.error}
          title="Falha ao carregar dados do quadro"
          fallback="Falha ao carregar dados do quadro."
          onRetry={() => {
            void columnsQuery.refetch();
            void cardsQuery.refetch();
          }}
        />
      ) : columns.length === 0 ? (
        <EmptyState
          title="Este quadro ainda nao possui colunas."
          description={`Crie colunas padrao ou adicione uma coluna manualmente para comecar a organizar ${boardConfig.terminology.itemPlural.toLowerCase()}.`}
          action={
            <>
              <PortalButton onClick={() => void createDefaultColumns()} disabled={createColumnMutation.isPending}>
                Criar colunas padrão
              </PortalButton>
              <div className="flex min-w-[260px] flex-col gap-2 sm:flex-row">
                <PortalInput value={manualColumnName} onChange={(event) => setManualColumnName(event.target.value)} placeholder="Nome da coluna" />
                <PortalButton variant="secondary" onClick={createManualColumn} disabled={!manualColumnName.trim() || createColumnMutation.isPending}>
                  Criar coluna manualmente
                </PortalButton>
              </div>
            </>
          }
        />
      ) : (
        <KanbanBoard
          columns={columns}
          cards={filteredCards}
          onOpenCard={(id) => setDrawerCardId(id)}
          onCreateCard={(columnId) => openCreateCard(columnId)}
          onMoveCard={handleMoveCard}
          config={boardConfig}
        />
      )}

      <CardDetailDrawer
        open={Boolean(drawerCardId)}
        cardId={drawerCardId}
        boardId={selectedBoardId ?? undefined}
        columns={columns}
        config={boardConfig}
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
        config={boardConfig}
        onSubmit={handleSubmitCard}
      />

      <KanbanBoardConfigDrawer
        open={configOpen}
        board={selectedBoard}
        config={boardConfig}
        submitting={updateBoardConfigMutation.isPending}
        error={updateBoardConfigMutation.error}
        onClose={() => setConfigOpen(false)}
        onSubmit={async (config) => {
          await updateBoardConfigMutation.mutateAsync(config);
          toast.success("Configuracao salva", "O quadro foi atualizado.");
          setConfigOpen(false);
        }}
      />

      {boardsQuery.isFetching || columnsQuery.isFetching || cardsQuery.isFetching ? (
        <div className={cn("fixed bottom-4 right-4 rounded-md border border-border bg-panel/90 px-3 py-2 text-xs text-slate-200")}>
          Atualizando...
        </div>
      ) : null}
    </div>
  );
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}
