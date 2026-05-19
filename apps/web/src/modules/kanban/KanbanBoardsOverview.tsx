import { useQueries } from "@tanstack/react-query";
import clsx from "clsx";
import { ArrowRight, Filter, Plus } from "lucide-react";

import { EmptyState, ErrorState, LoadingSkeleton, PortalBadge, PortalButton, PortalSelect, SectionCard } from "../../shared/ui";
import { listCards } from "./api";
import { kanbanQueryKeys } from "./queryKeys";
import type { BoardType, KanbanBoard } from "./types";

export type BoardFilterKey = "all" | BoardType;

export function KanbanBoardsOverview({
  boards,
  loading,
  error,
  filter,
  onFilterChange,
  onCreate,
  onOpenBoard,
  canCreate,
  emptyTitle = "Nenhum quadro encontrado.",
  emptyActionLabel = "Novo quadro",
}: {
  boards: KanbanBoard[];
  loading: boolean;
  error: unknown;
  filter: BoardFilterKey;
  onFilterChange: (value: BoardFilterKey) => void;
  onCreate: () => void;
  onOpenBoard: (boardId: string) => void;
  canCreate: boolean;
  emptyTitle?: string;
  emptyActionLabel?: string;
}) {
  const cardCountQueries = useQueries({
    queries: boards.map((board) => ({
      queryKey: kanbanQueryKeys.cards(board.id),
      queryFn: () => listCards(board.id),
      staleTime: 30_000,
    })),
  });

  const filteredBoards = boards.filter((board) => filter === "all" || board.board_type === filter);

  return (
    <SectionCard
      title="Quadros Kanban"
      description="Projetos, TI, operações e fluxos personalizados usam o Kanban Engine genérico."
      actions={
        <>
          <div className="flex min-w-[220px] items-center gap-2 text-sm text-slate-300">
            <Filter className="h-4 w-4 text-cyan" />
            <PortalSelect
              value={filter}
              onChange={(value) => onFilterChange(value as BoardFilterKey)}
              options={[
                { value: "all", label: "Todos" },
                { value: "production", label: "Produção" },
                { value: "projects", label: "Projetos" },
                { value: "operational", label: "Operacional" },
                { value: "helpdesk", label: "HelpDesk" },
                { value: "custom", label: "Personalizados" },
              ]}
            />
          </div>
          {canCreate ? (
            <PortalButton onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Novo quadro
            </PortalButton>
          ) : null}
        </>
      }
    >

      {loading ? (
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <LoadingSkeleton key={index} className="h-36" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4">
          <ErrorState error={error} title="Falha ao carregar quadros" fallback="Falha ao carregar quadros." />
        </div>
      ) : filteredBoards.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title={emptyTitle}
            description="Crie um quadro genérico para iniciar este contexto."
            action={
              canCreate ? (
                <PortalButton onClick={onCreate}>
                  <Plus className="h-4 w-4" />
                  {emptyActionLabel}
                </PortalButton>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="grid min-w-0 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredBoards.map((board) => {
            const countIndex = boards.findIndex((item) => item.id === board.id);
            const countQuery = cardCountQueries[countIndex];
            const cardCount = countQuery?.data?.filter((card) => !card.deleted_at).length ?? 0;
            return (
              <button
                key={board.id}
                type="button"
                onClick={() => onOpenBoard(board.id)}
                className="group min-w-0 rounded-lg border border-border bg-slate-950/35 p-4 text-left transition hover:border-cyan/40 hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{board.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-400">{board.description || "Quadro generico do Kanban Engine."}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-cyan" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <PortalBadge>{formatBoardType(board.board_type)}</PortalBadge>
                  {board.module_context ? <PortalBadge tone="slate">{formatContext(board.module_context)}</PortalBadge> : null}
                  <PortalBadge tone={board.is_active ? "green" : "slate"}>{board.is_active ? "ativo" : "inativo"}</PortalBadge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Metric label="Cards" value={countQuery?.isError ? "erro" : countQuery?.isLoading ? "..." : cardCount.toString()} />
                  <Metric label="Atualizado" value={formatDate(board.updated_at)} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={clsx("rounded-md border border-border bg-panel/50 p-3")}>
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 truncate font-semibold text-white">{value}</p>
    </div>
  );
}

function formatDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("pt-BR");
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

function formatContext(context: string) {
  const labels: Record<string, string> = {
    producao: "Produção",
    projetos: "Projetos",
    ti: "TI",
    operacional: "Operacional",
    manutencao: "Manutenção",
    outro: "Outro",
  };
  return labels[context] ?? context;
}
