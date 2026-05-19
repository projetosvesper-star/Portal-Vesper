import { ChevronDown } from "lucide-react";

import type { KanbanBoard } from "../types";

type BoardSelectorProps = {
  boards: KanbanBoard[];
  value: string | null;
  onChange: (boardId: string) => void;
  disabled?: boolean;
};

export function BoardSelector({ boards, value, onChange, disabled }: BoardSelectorProps) {
  return (
    <div className="relative">
      <select
        className="h-10 min-w-[220px] appearance-none rounded-md border border-border bg-white/[0.04] px-3 pr-10 text-sm text-slate-200 outline-none focus:border-cyan/60 disabled:cursor-not-allowed disabled:opacity-60"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="" disabled>
          Selecionar board
        </option>
        {boards.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

