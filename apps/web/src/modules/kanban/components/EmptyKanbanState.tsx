import { LayoutGrid } from "lucide-react";

import { Button } from "../../../shared/components/Button";
import { cn } from "../../../shared/utils/cn";
import { canCreateBoard } from "../utils/permissions";

type EmptyKanbanStateProps = {
  onCreateBoard?: () => void;
  className?: string;
};

export function EmptyKanbanState({ onCreateBoard, className }: EmptyKanbanStateProps) {
  const showCreate = Boolean(onCreateBoard) && canCreateBoard();

  return (
    <section className={cn("rounded-lg border border-border bg-panel/70 p-8", className)}>
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-lg border border-border bg-white/[0.04] text-cyan">
          <LayoutGrid className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-white">Nenhum quadro disponível</h3>
          <p className="mt-1 text-sm text-slate-400">
            Você ainda não possui acesso a nenhum quadro Kanban. Se tiver permissão, crie um novo quadro ou peça para um
            administrador liberar acesso.
          </p>
          {showCreate ? (
            <div className="mt-5">
              <Button onClick={onCreateBoard}>Criar quadro</Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
