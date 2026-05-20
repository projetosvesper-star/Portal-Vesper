import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { KanbanSquare, Plus, Settings, Tv } from "lucide-react";

import { useAuthStore } from "../../shared/auth/store";
import { useToast } from "../../shared/components/ToastProvider";
import { usePortalWebSocketContext } from "../../shared/hooks/usePortalWebSocket";
import { ErrorState, PageHeader, PortalButton } from "../../shared/ui";
import { createBoard, createBoardFromTemplate, createColumn, listBoards } from "./api";
import { FALLBACK_CONTEXTS, FALLBACK_TEMPLATES, canSeeContext } from "./hubConfig";
import { useKanbanContexts, useKanbanTemplates } from "./hooks";
import { KanbanBoardCreateDialog, type BoardCreateValues } from "./KanbanBoardCreateDialog";
import { KanbanBoardsOverview, type BoardFilterKey } from "./KanbanBoardsOverview";
import { KanbanContextSelector, type KanbanContextKey, type KanbanContextOption } from "./KanbanContextSelector";
import { KanbanHubConfigDialog } from "./KanbanHubConfigDialog";
import { kanbanQueryKeys } from "./queryKeys";
import type { BoardType, KanbanBoard, KanbanHubContext } from "./types";

export function KanbanHubPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const permissions = useAuthStore((state) => state.permissions ?? []);
  const canCreateBoard = hasPermission(permissions, "kanban.board.create");
  const canManageHub = hasPermission(permissions, "kanban.context.manage") || hasPermission(permissions, "kanban.template.manage");
  const [context, setContext] = useState<KanbanContextKey>("quadros");
  const [filter, setFilter] = useState<BoardFilterKey>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const { subscribe } = usePortalWebSocketContext();
  const wsTimerRef = useRef<number | null>(null);

  const boardsQuery = useQuery({
    queryKey: kanbanQueryKeys.boards(),
    queryFn: () => listBoards(),
  });
  const contextsQuery = useKanbanContexts();
  const templatesQuery = useKanbanTemplates();

  const boards = boardsQuery.data ?? [];
  const rawContexts = useMemo(
    () => (contextsQuery.data && contextsQuery.data.length > 0 ? contextsQuery.data : FALLBACK_CONTEXTS).slice().sort((a, b) => a.order - b.order),
    [contextsQuery.data],
  );
  const hubContexts = useMemo(() => rawContexts.filter((item) => canSeeContext(item, permissions)), [rawContexts, permissions]);
  const templates = templatesQuery.data && templatesQuery.data.length > 0 ? templatesQuery.data : FALLBACK_TEMPLATES;
  const activeContext = hubContexts.find((item) => item.key === context) ?? hubContexts[0] ?? FALLBACK_CONTEXTS[0];
  const visibleBoards = useMemo(() => filterBoardsByContext(boards, activeContext), [boards, activeContext]);

  const createBoardMutation = useMutation({
    mutationFn: async (values: BoardCreateValues) => {
      if ("fromTemplate" in values) {
        return createBoardFromTemplate({
          templateKey: values.templateKey,
          name: values.name,
          description: values.description,
          contextKey: values.contextKey,
        });
      }

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
      toast.success("Quadro criado", "O quadro foi criado no Kanban Engine.");
      navigate(`/kanban/boards/${board.id}`);
    },
    onError: () => {
      toast.error("Falha ao criar quadro", "O quadro nao foi criado. Verifique os dados e o backend ativo.");
    },
  });

  const invalidateFromSocket = useCallback(
    (boardId?: string | null) => {
      if (wsTimerRef.current) window.clearTimeout(wsTimerRef.current);
      wsTimerRef.current = window.setTimeout(() => {
        void invalidateKanbanHub(queryClient, boardId ?? undefined);
        void queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.contexts() });
        void queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.templates() });
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
    () => hubContexts.map((item) => ({ key: item.key, label: item.name, description: item.description ?? "", route: item.route })),
    [hubContexts],
  );

  function handleContextChange(next: KanbanContextKey) {
    const selected = hubContexts.find((item) => item.key === next);
    if (selected?.route) {
      navigate(selected.route);
      return;
    }
    setContext(next);
    setFilter(defaultFilterForContext(selected));
  }

  function openCreateDialog(nextContext = context) {
    setContext(nextContext);
    setDialogOpen(true);
  }

  const createDefaults = defaultsForContext(activeContext);

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
            {canManageHub ? (
              <PortalButton variant="secondary" className="w-full sm:w-auto" onClick={() => setConfigOpen(true)}>
                <Settings className="h-4 w-4" />
                Configurar Kanban
              </PortalButton>
            ) : null}
            {canCreateBoard ? (
              <PortalButton className="w-full sm:w-auto" onClick={() => openCreateDialog()}>
                <Plus className="h-4 w-4" />
                Novo quadro
              </PortalButton>
            ) : null}
          </>
        }
      />

      {contextsQuery.isError ? (
        <ErrorState
          error={contextsQuery.error}
          title="Contextos usando fallback local"
          fallback="Nao foi possivel carregar contextos configuraveis. O Hub continua com os padroes locais."
          onRetry={() => contextsQuery.refetch()}
        />
      ) : null}

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
          emptyTitle={`Nenhum quadro em ${activeContext.name}.`}
          emptyActionLabel={`Criar quadro de ${activeContext.name}`}
        />
      )}

      <KanbanBoardCreateDialog
        open={dialogOpen}
        initialBoardType={createDefaults.boardType}
        initialModuleContext={createDefaults.moduleContext}
        onClose={() => setDialogOpen(false)}
        onSubmit={(values) => createBoardMutation.mutateAsync(values)}
        templates={templates}
        contexts={hubContexts}
      />

      <KanbanHubConfigDialog open={configOpen} onClose={() => setConfigOpen(false)} contexts={rawContexts} templates={templates} />
    </div>
  );
}

function hasPermission(permissions: string[], key: string) {
  return permissions.includes(key) || permissions.includes("kanban.admin") || permissions.includes("admin.permissions.manage");
}

function filterBoardsByContext(boards: KanbanBoard[], context: KanbanHubContext) {
  if (context.key === "quadros") return boards;
  if (context.boardType === "projects") return boards.filter((board) => board.board_type === "projects");
  if (context.key === "ti_operacional") {
    return boards.filter((board) =>
      board.board_type === "operational" ||
      board.board_type === "helpdesk" ||
      board.module_context === "ti" ||
      board.module_context === "operacional",
    );
  }
  if (context.boardType) {
    return boards.filter((board) => board.board_type === context.boardType && (!context.moduleContext || board.module_context === context.moduleContext));
  }
  return boards;
}

function defaultFilterForContext(context?: KanbanHubContext): BoardFilterKey {
  if (!context) return "all";
  if (context.boardType === "projects") return "projects";
  if (context.boardType === "custom") return "custom";
  return "all";
}

function defaultsForContext(context: KanbanHubContext): { boardType: BoardType; moduleContext: string } {
  return { boardType: (context.boardType as BoardType | null) ?? "projects", moduleContext: context.moduleContext ?? "projetos" };
}

async function invalidateKanbanHub(queryClient: QueryClient, boardId?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.boards() }),
    queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.contexts() }),
    queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.templates() }),
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
