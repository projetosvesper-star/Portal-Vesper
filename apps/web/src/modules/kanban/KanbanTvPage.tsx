import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KanbanSquare, Tv } from "lucide-react";

import { useAuthStore } from "../../shared/auth/store";
import { usePortalWebSocketContext } from "../../shared/hooks/usePortalWebSocket";
import { ErrorState, LoadingSkeleton, PageHeader, PortalButton, PortalSelect, PortalTabs, SectionCard } from "../../shared/ui";
import { getProductionTVPreview } from "../production/api";
import { productionQueryKeys } from "../production/queryKeys";
import { normalizeBoardConfig } from "./config";
import { listBoards, listCards, listColumns } from "./api";
import { canSeeContext } from "./hubConfig";
import { adaptKanbanCardsToTvItems, adaptProductionTvResponse } from "./KanbanTvAdapter";
import { KanbanTvPreview } from "./KanbanTvPreview";
import { kanbanQueryKeys } from "./queryKeys";
import { useBoardConfig, useKanbanContexts } from "./hooks";

export function KanbanTvPage() {
  const queryClient = useQueryClient();
  const { subscribe } = usePortalWebSocketContext();
  const permissions = useAuthStore((state) => state.permissions ?? []);
  const canViewProduction = permissions.includes("kanban_producao.view") || permissions.includes("admin.permissions.manage");
  const [mode, setMode] = useState<"list" | "kanban">("list");
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const wsTimerRef = useRef<number | null>(null);

  const boardsQuery = useQuery({
    queryKey: kanbanQueryKeys.boards(),
    queryFn: () => listBoards(),
  });
  const contextsQuery = useKanbanContexts();

  const boards = boardsQuery.data ?? [];
  const permittedBoards = useMemo(
    () => boards.filter((board) => {
      if (!canViewProduction && (board.board_type === "production" || board.module_context === "producao")) return false;
      const context = (contextsQuery.data ?? []).find((item) => {
        if (item.boardType && item.boardType === board.board_type) return true;
        if (item.moduleContext && item.moduleContext === board.module_context) return true;
        return false;
      });
      return context ? canSeeContext(context, permissions) : true;
    }),
    [boards, canViewProduction, contextsQuery.data, permissions],
  );

  useEffect(() => {
    if (selectedBoardId || permittedBoards.length === 0) return;
    setSelectedBoardId(permittedBoards[0].id);
  }, [permittedBoards, selectedBoardId]);

  const selectedBoard = permittedBoards.find((board) => board.id === selectedBoardId) ?? null;
  const isProduction = selectedBoard?.board_type === "production" || selectedBoard?.module_context === "producao";
  const boardConfigQuery = useBoardConfig(selectedBoardId || undefined);
  const boardConfig = boardConfigQuery.data?.config ?? normalizeBoardConfig(selectedBoard);

  useEffect(() => {
    if (boardConfig.tv.defaultMode && mode === "list") {
      setMode(boardConfig.tv.defaultMode);
    }
  }, [boardConfig.tv.defaultMode]);

  const columnsQuery = useQuery({
    queryKey: selectedBoardId ? kanbanQueryKeys.columns(selectedBoardId) : ["kanban", "tv", "columns", "none"],
    queryFn: () => listColumns(selectedBoardId),
    enabled: Boolean(selectedBoardId) && !isProduction,
  });

  const cardsQuery = useQuery({
    queryKey: selectedBoardId ? kanbanQueryKeys.cards(selectedBoardId) : ["kanban", "tv", "cards", "none"],
    queryFn: () => listCards(selectedBoardId),
    enabled: Boolean(selectedBoardId) && !isProduction,
  });

  const productionTvQuery = useQuery({
    queryKey: productionQueryKeys.tvByMode(mode),
    queryFn: () => getProductionTVPreview(mode, 30),
    enabled: Boolean(selectedBoardId) && Boolean(isProduction) && canViewProduction,
  });

  const tvItems = useMemo(() => {
    if (isProduction && productionTvQuery.data) return adaptProductionTvResponse(productionTvQuery.data, boardConfig);
    return adaptKanbanCardsToTvItems(cardsQuery.data ?? [], columnsQuery.data ?? [], boardConfig);
  }, [boardConfig, cardsQuery.data, columnsQuery.data, isProduction, productionTvQuery.data]);

  const invalidateTv = useCallback(() => {
    if (wsTimerRef.current) window.clearTimeout(wsTimerRef.current);
    wsTimerRef.current = window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.boards() });
      if (selectedBoardId) {
        queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.columns(selectedBoardId) });
        queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.cards(selectedBoardId) });
        queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.tv(selectedBoardId, mode) });
      }
      queryClient.invalidateQueries({ queryKey: productionQueryKeys.tvByMode(mode) });
      wsTimerRef.current = null;
    }, 250);
  }, [mode, queryClient, selectedBoardId]);

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (event?.type?.startsWith("kanban.") || event?.type?.startsWith("kanban_producao.")) invalidateTv();
    });
    return () => {
      unsubscribe();
      if (wsTimerRef.current) window.clearTimeout(wsTimerRef.current);
    };
  }, [invalidateTv, subscribe]);

  const loading = boardsQuery.isLoading || contextsQuery.isLoading || boardConfigQuery.isLoading || columnsQuery.isLoading || cardsQuery.isLoading || productionTvQuery.isLoading;
  const error = boardsQuery.error ?? contextsQuery.error ?? boardConfigQuery.error ?? columnsQuery.error ?? cardsQuery.error ?? productionTvQuery.error;

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden p-4 sm:p-6">
      <PageHeader
        icon={<Tv className="h-5 w-5" />}
        title="TV/Foco"
        subtitle="Visualização ampla para acompanhar Produção, Projetos, TI, Operacional e quadros personalizados."
        actions={
          <PortalButton variant="secondary" onClick={() => window.history.back()}>
            Voltar
          </PortalButton>
        }
      />

      <SectionCard title="Controle da TV/Foco" description="Escolha um quadro permitido e alterne entre lista e kanban.">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <PortalSelect
            label="Quadro"
            value={selectedBoardId}
            onChange={setSelectedBoardId}
            placeholder="Selecionar quadro"
            options={permittedBoards.map((board) => ({
              value: board.id,
              label: board.name,
              description: [formatBoardType(board.board_type), formatContext(board.module_context)].filter(Boolean).join(" · "),
            }))}
          />
          <PortalTabs
            value={mode}
            onChange={setMode}
            options={[
              { value: "list", label: "Lista" },
              { value: "kanban", label: "Kanban" },
            ]}
          />
        </div>
      </SectionCard>

      {boardsQuery.isError || error ? (
        <ErrorState error={error} title="Falha ao carregar TV/Foco" fallback="Falha ao carregar TV/Foco." onRetry={() => void refetchAll()} />
      ) : loading ? (
        <div className="grid gap-3">
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-32" />
        </div>
      ) : selectedBoard ? (
        <KanbanTvPreview mode={mode} items={tvItems} />
      ) : (
        <SectionCard>
          <div className="p-6 text-center text-sm text-slate-400">
            <KanbanSquare className="mx-auto mb-3 h-8 w-8 text-cyan" />
            Nenhum quadro disponível para TV/Foco.
          </div>
        </SectionCard>
      )}
    </div>
  );

  async function refetchAll() {
    await Promise.all([
      boardsQuery.refetch(),
      contextsQuery.refetch(),
      columnsQuery.refetch(),
      cardsQuery.refetch(),
      productionTvQuery.refetch(),
    ]);
  }
}

function formatBoardType(type: string) {
  const labels: Record<string, string> = {
    production: "Produção",
    projects: "Projetos",
    operational: "Operacional",
    helpdesk: "HelpDesk",
    custom: "Personalizado",
  };
  return labels[type] ?? type;
}

function formatContext(context: string | null) {
  if (!context) return "";
  const labels: Record<string, string> = {
    producao: "Produção",
    projetos: "Projetos",
    ti: "TI",
    operacional: "Operacional",
    manutencao: "Manutenção",
    compras: "Compras",
    outro: "Outro",
  };
  return labels[context] ?? context;
}
