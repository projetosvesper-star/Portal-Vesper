import { PlaceholderPage } from "../../shared/components/PlaceholderPage";

export function KanbanEnginePage() {
  return (
    <div>
      <PlaceholderPage
        title="Kanban Engine"
        description="Backend em implementacao: motor generico de quadros, colunas, cards, checklist, comentarios, anexos, auditoria e eventos."
      />
      <div className="-mt-10 flex justify-center px-6 pb-10">
        <div className="w-full max-w-3xl rounded-lg border border-border bg-panel/60 p-6 text-slate-200">
          <h3 className="text-lg font-semibold text-white">Endpoints principais (preview)</h3>
          <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-slate-300">
            <li>GET /api/kanban/boards</li>
            <li>POST /api/kanban/boards</li>
            <li>GET /api/kanban/boards/&lt;board_id&gt;/columns</li>
            <li>GET /api/kanban/boards/&lt;board_id&gt;/cards</li>
            <li>POST /api/kanban/cards</li>
            <li>POST /api/kanban/cards/&lt;card_id&gt;/move</li>
          </ul>
          <p className="mt-4 text-sm text-amber-200">
            A UI completa (incluindo drag-and-drop) sera criada na proxima etapa.
          </p>
        </div>
      </div>
    </div>
  );
}

