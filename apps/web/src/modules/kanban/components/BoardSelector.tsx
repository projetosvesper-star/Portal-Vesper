import { PortalSelect } from "../../../shared/ui";
import type { KanbanBoard } from "../types";

type BoardSelectorProps = {
  boards: KanbanBoard[];
  value: string | null;
  onChange: (boardId: string) => void;
  disabled?: boolean;
};

export function BoardSelector({ boards, value, onChange, disabled }: BoardSelectorProps) {
  return (
    <div className="min-w-[220px]">
      <PortalSelect
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        placeholder="Selecionar quadro"
        options={boards.map((board) => ({
          value: board.id,
          label: board.name,
          description: [board.board_type, board.module_context].filter(Boolean).join(" · "),
        }))}
      />
    </div>
  );
}
