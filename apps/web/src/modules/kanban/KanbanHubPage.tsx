import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../../shared/auth/store";
import { Button } from "../../shared/components/Button";

export function KanbanHubPage() {
  const navigate = useNavigate();
  const permissions = useAuthStore((state) => state.permissions ?? []);
  const canViewProduction = permissions.includes("kanban_producao.view");
  const [context, setContext] = useState<string>("quadros");

  function handleContextChange(next: string) {
    setContext(next);
    if (next === "producao") {
      navigate("/kanban/producao");
    }
  }

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-white">Kanban</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">
            Escolha um contexto interno do Kanban para acessar quadros, producao, projetos ou operacoes.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <label className="text-sm text-slate-400" htmlFor="kanban-context-select">
            Contexto
          </label>
          <select
            id="kanban-context-select"
            value={context}
            onChange={(event) => handleContextChange(event.target.value)}
            className="h-10 rounded-md border border-border bg-panel/80 px-3 text-sm text-white"
          >
            <option value="quadros">Quadros</option>
            {canViewProduction ? <option value="producao">Producao</option> : null}
            <option value="projetos">Projetos</option>
            <option value="operacional">Operacional</option>
          </select>
          <Button className="w-full sm:w-auto" onClick={() => window.location.reload()}>
            Atualizar
          </Button>
        </div>
      </header>

      <main className="min-w-0">
        {context === "quadros" ? (
          <div className="rounded-lg border border-border bg-white/[0.02] p-4 text-slate-300">
            Kanban Engine (quadros) - abre ao selecionar um quadro.
          </div>
        ) : null}

        {context === "producao" && !canViewProduction ? (
          <div className="rounded-lg border border-border bg-white/[0.02] p-4 text-slate-300">
            Voce nao tem permissao para ver Producao.
          </div>
        ) : null}

        {context === "projetos" ? (
          <div className="rounded-lg border border-border bg-white/[0.02] p-4 text-slate-300">
            Kanban Projetos sera implementado em etapa futura.
          </div>
        ) : null}

        {context === "operacional" ? (
          <div className="rounded-lg border border-border bg-white/[0.02] p-4 text-slate-300">
            Kanban Operacional sera implementado em etapa futura.
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default KanbanHubPage;
