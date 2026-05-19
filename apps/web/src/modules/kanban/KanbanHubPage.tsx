import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../shared/auth/store";
import { Button } from "../../shared/components/Button";

export function KanbanHubPage() {
  const navigate = useNavigate();
  const permissions = useAuthStore((s) => s.permissions ?? []);
  const canViewProduction = permissions.includes("kanban_producao.view");
  const [context, setContext] = useState<string>("quadros");

  function handleContextChange(next: string) {
    setContext(next);
    if (next === "producao") {
      navigate("/kanban/producao");
    }
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Kanban</h2>
          <p className="text-sm text-slate-300">Gerencie quadros, OPs, projetos e fluxos operacionais do Portal Vesper.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={context}
            onChange={(e) => handleContextChange(e.target.value)}
            className="rounded-md bg-panel/80 px-3 py-2 text-sm text-white"
          >
            <option value="quadros">Quadros</option>
            {canViewProduction && <option value="producao">Produção</option>}
            <option value="projetos">Projetos</option>
            <option value="operacional">Operacional</option>
          </select>
          <Button onClick={() => window.location.reload()}>Atualizar</Button>
        </div>
      </header>

      <main>
        {context === "quadros" && (
          <div className="rounded border border-border bg-white/[0.02] p-4 text-slate-300">Kanban Engine (quadros) — abre ao selecionar um quadro.</div>
        )}

        {context === "producao" && !canViewProduction && (
          <div className="rounded border border-border bg-white/[0.02] p-4 text-slate-300">Você não tem permissão para ver Produção.</div>
        )}

        {context === "projetos" && <div className="rounded border border-border bg-white/[0.02] p-4 text-slate-300">Kanban Projetos será implementado em etapa futura.</div>}

        {context === "operacional" && <div className="rounded border border-border bg-white/[0.02] p-4 text-slate-300">Kanban Operacional será implementado em etapa futura.</div>}
      </main>
    </div>
  );
}

export default KanbanHubPage;
