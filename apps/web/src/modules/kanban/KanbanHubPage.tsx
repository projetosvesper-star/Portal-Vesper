import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { KanbanSquare, Plus, Tv } from "lucide-react";

import { useAuthStore } from "../../shared/auth/store";
import { useToast } from "../../shared/components/ToastProvider";
import { usePortalWebSocketContext } from "../../shared/hooks/usePortalWebSocket";
import { ErrorState, PageHeader, PortalButton } from "../../shared/ui";
import { createBoard, createColumn, listBoards } from "./api";
import { KanbanBoardCreateDialog, type BoardCreateValues } from "./KanbanBoardCreateDialog";
import { KanbanBoardsOverview, type BoardFilterKey } from "./KanbanBoardsOverview";
import { KanbanContextSelector, type KanbanContextKey, type KanbanContextOption } from "./KanbanContextSelector";
import { kanbanQueryKeys } from "./queryKeys";
import type { BoardType, KanbanBoard } from "./types";

export function KanbanHubPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const permissions = useAuthStore((state) => state.permissions ?? []);
  const canViewProduction = hasPermission(permissions, "kanban_producao.view");
  const canCreateBoard = hasPermission(permissions, "kanban.board.create");
  const [context, setContext] = useState<KanbanContextKey>("quadros");
  const [filter, setFilter] = useState<BoardFilterKey>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { subscribe } = usePortalWebSocketContext();
  const wsTimerRef = useRef<number | null>(null);

  const boardsQuery = useQuery({
    queryKey: kanbanQueryKeys.boards(),
    queryFn: () => listBoards(),
  });

  const boards = boardsQuery.data ?? [];
  const visibleBoards = useMemo(() => filterBoardsByContext(boards, context), [boards, context]);

  const createBoardMutation = useMutation({
    mutationFn: async (values: BoardCreateValues) => {
      const board = await createBoard({
        key: values.key ?? null,
        name: values.name,
        description: values.description,
        board_type: values.board_type,
        module_context: values.module_context,
        color: values.color,
        icon: values.icon,
        metadata: values.metadata,
      });

      for (const [index, columnName] of values.initial_columns.entries()) {
        await createColumn(board.id, {
          name: columnName,
          key: slugify(columnName),
          order_index: index,
          is_done: index === values.initial_columns.length - 1,
          metadata: { created_from: "kanban_hub" },
        });
      }

      return board;
    },
    onSuccess: async (board) => {
      await invalidateKanbanHub(queryClient, board.id);
      toast.success("Quadro criado", "O quadro genérico foi criado no Kanban Engine.");
      navigate(`/kanban/boards/${board.id}`);
    },
    onError: (err) => {
      toast.error("Falha ao criar quadro", "O quadro não foi criado. Verifique os dados e o backend ativo.");
    },
  });

  const invalidateFromSocket = useCallback(
    (boardId?: string | null) => {
      if (wsTimerRef.current) window.clearTimeout(wsTimerRef.current);
      wsTimerRef.current = window.setTimeout(() => {
        void invalidateKanbanHub(queryClient, boardId ?? undefined);
        wsTimerRef.current = null;
      }, 250);
    },
    [queryClient],
  );

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (!event?.type?.startsWith("kanban.")) return;
      const payload = (event.payload ?? {}) as { board_id?: string; boardId?: string };
      invalidateFromSocket(payload.board_id ?? payload.boardId ?? null);
    });
    return () => {
      unsubscribe();
      if (wsTimerRef.current) window.clearTimeout(wsTimerRef.current);
    };
  }, [invalidateFromSocket, subscribe]);

  const contexts = useMemo<KanbanContextOption[]>(
    () => [
      { key: "quadros", label: "Quadros", description: "Todos os quadros do Kanban Engine." },
      ...(canViewProduction ? [{ key: "producao" as const, label: "Produção", description: "OPs simples e checklist editável." }] : []),
      { key: "projetos", label: "Projetos", description: "Quadros genéricos para projetos." },
      { key: "ti", label: "TI / Operacional", description: "Quadros genéricos para TI e operações." },
      { key: "personalizados", label: "Personalizados", description: "Fluxos customizados por equipe." },
    ],
    [canViewProduction],
  );

  function handleContextChange(next: KanbanContextKey) {
    if (next === "producao") {
      navigate("/kanban/producao");
      return;
    }
    setContext(next);
    setFilter(defaultFilterForContext(next));
  }

  function openCreateDialog(nextContext = context) {
    setContext(nextContext);
    setDialogOpen(true);
  }

  const createDefaults = defaultsForContext(context);

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden p-4 sm:p-6">
      <PageHeader
        icon={<KanbanSquare className="h-5 w-5" />}
        title="Kanban"
        subtitle="Gerencie quadros, OPs, projetos, TI e fluxos operacionais do Portal Vesper."
        actions={
          <>
            <PortalButton variant="secondary" className="w-full sm:w-auto" onClick={() => navigate("/kanban/tv")}>
              <Tv className="h-4 w-4" />
              TV/Foco
            </PortalButton>
            {canCreateBoard ? (
              <PortalButton className="w-full sm:w-auto" onClick={() => openCreateDialog()}>
                <Plus className="h-4 w-4" />
                Novo quadro
              </PortalButton>
            ) : null}
          </>
        }
      />

      <KanbanContextSelector value={context} options={contexts} onChange={handleContextChange} />

      {boardsQuery.isError ? (
        <ErrorState error={boardsQuery.error} title="Falha ao carregar quadros Kanban" fallback="Falha ao carregar quadros Kanban." onRetry={() => boardsQuery.refetch()} />
      ) : (
        <KanbanBoardsOverview
          boards={visibleBoards}
          loading={boardsQuery.isLoading}
          error={null}
          filter={filter}
          onFilterChange={setFilter}
          canCreate={canCreateBoard}
          onCreate={() => openCreateDialog()}
          onOpenBoard={(boardId) => navigate(`/kanban/boards/${boardId}`)}
          emptyTitle={emptyTitleForContext(context)}
          emptyActionLabel={emptyActionForContext(context)}
        />
      )}

      <KanbanBoardCreateDialog
        open={dialogOpen}
        initialBoardType={createDefaults.boardType}
        initialModuleContext={createDefaults.moduleContext}
        onClose={() => setDialogOpen(false)}
        onSubmit={(values) => createBoardMutation.mutateAsync(values)}
      />
    </div>
  );
}

function hasPermission(permissions: string[], key: string) {
  return permissions.includes(key) || permissions.includes("kanban.admin") || permissions.includes("admin.permissions.manage");
}

function filterBoardsByContext(boards: KanbanBoard[], context: KanbanContextKey) {
  if (context === "projetos") return boards.filter((board) => board.board_type === "projects");
  if (context === "ti") {
    return boards.filter((board) =>
      board.board_type === "operational" ||
      board.board_type === "helpdesk" ||
      board.module_context === "ti" ||
      board.module_context === "operacional",
    );
  }
  if (context === "personalizados") return boards.filter((board) => board.board_type === "custom");
  return boards;
}

function defaultFilterForContext(context: KanbanContextKey): BoardFilterKey {
  if (context === "projetos") return "projects";
  if (context === "ti") return "all";
  if (context === "personalizados") return "custom";
  return "all";
}

function defaultsForContext(context: KanbanContextKey): { boardType: BoardType; moduleContext: string } {
  if (context === "projetos") return { boardType: "projects", moduleContext: "projetos" };
  if (context === "ti") return { boardType: "operational", moduleContext: "ti" };
  if (context === "personalizados") return { boardType: "custom", moduleContext: "outro" };
  return { boardType: "projects", moduleContext: "projetos" };
}

function emptyTitleForContext(context: KanbanContextKey) {
  if (context === "projetos") return "Nenhum quadro de Projetos encontrado.";
  if (context === "ti") return "Nenhum quadro de TI / Operacional encontrado.";
  if (context === "personalizados") return "Nenhum quadro personalizado encontrado.";
  return "Nenhum quadro Kanban encontrado.";
}

function emptyActionForContext(context: KanbanContextKey) {
  if (context === "projetos") return "Criar quadro de Projetos";
  if (context === "ti") return "Criar quadro de TI";
  if (context === "personalizados") return "Criar quadro personalizado";
  return "Novo quadro";
}

async function invalidateKanbanHub(queryClient: QueryClient, boardId?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.boards() }),
    boardId ? queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.board(boardId) }) : Promise.resolve(),
    boardId ? queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.columns(boardId) }) : Promise.resolve(),
    boardId ? queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.cards(boardId) }) : Promise.resolve(),
    boardId ? queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.boardActivity(boardId) }) : Promise.resolve(),
  ]);
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

export default KanbanHubPage;
