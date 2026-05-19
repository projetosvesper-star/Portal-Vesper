import { Archive, RefreshCw, Search } from "lucide-react";

import { cn } from "../../../shared/utils/cn";
import { PortalButton } from "../../../shared/ui";

type BoardToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  onRefresh: () => void;
  disableRefresh?: boolean;
};

export function BoardToolbar({
  search,
  onSearchChange,
  showArchived,
  onToggleArchived,
  onRefresh,
  disableRefresh,
}: BoardToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[260px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          className="h-10 w-full rounded-md border border-border bg-white/[0.04] pl-10 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-cyan/60"
          placeholder="Filtrar cards por título/código"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <button
        type="button"
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-md border border-border bg-white/[0.04] px-3 text-sm text-slate-200 transition",
          "hover:border-cyan/25 hover:bg-white/[0.06]",
          showArchived && "border-cyan/30 bg-cyan/10 text-cyan",
        )}
        onClick={onToggleArchived}
        title="Mostrar ou ocultar cards arquivados"
      >
        <Archive className="h-4 w-4" />
        Arquivados
      </button>

      <PortalButton className="h-10" onClick={onRefresh} disabled={disableRefresh}>
        <RefreshCw className="h-4 w-4" />
        Atualizar
      </PortalButton>
    </div>
  );
}
