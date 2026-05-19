import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { searchUsers, type UserLookup } from "../api/users";
import { cn } from "../utils/cn";

type UserPickerProps = {
  value: string | null;
  onChange: (userId: string | null, user?: UserLookup | null) => void;
  disabled?: boolean;
  placeholder?: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function UserPicker({ value, onChange, disabled, placeholder }: UserPickerProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<UserLookup | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(term), 250);
    return () => window.clearTimeout(t);
  }, [term]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const { data = [], isLoading } = useQuery({
    queryKey: ["users", "search", debounced],
    queryFn: () => searchUsers(debounced),
    enabled: open && !disabled,
  });

  // Se a UI recebeu um value que não bate com o estado interno, reseta o label.
  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    if (selected?.id === value) return;
    // mantem "selected" vazio até o consumidor fazer lookup (opcional)
    setSelected(null);
  }, [value, selected]);

  const items = useMemo(() => data.filter((u) => u.status === "active"), [data]);

  return (
    <div ref={ref} className={cn("relative", disabled && "opacity-60")}>
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-md border border-border bg-white/[0.04] px-3 text-left text-sm text-slate-200",
          "hover:border-cyan/25 hover:bg-white/[0.06] disabled:cursor-not-allowed",
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0 flex-1">
          {selected ? (
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-cyan/15 text-xs font-semibold text-cyan">
                {initials(selected.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{selected.name}</p>
                <p className="truncate text-[11px] text-slate-500">
                  @{selected.username}
                  {selected.department ? ` • ${selected.department}` : ""}
                  {selected.job_title ? ` • ${selected.job_title}` : ""}
                </p>
              </div>
            </div>
          ) : value ? (
            <p className="truncate text-sm text-slate-300">Selecionado: {value}</p>
          ) : (
            <p className="text-sm text-slate-500">{placeholder ?? "Selecionar responsável..."}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {value ? (
            <span
              role="button"
              tabIndex={0}
              className="grid h-8 w-8 place-items-center rounded-md border border-border bg-white/[0.04] text-slate-300 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setSelected(null);
                onChange(null, null);
              }}
              onKeyDown={() => {}}
              title="Limpar responsável"
            >
              <X className="h-4 w-4" />
            </span>
          ) : null}
          <ChevronsUpDown className="h-4 w-4 text-slate-500" />
        </div>
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full rounded-md border border-border bg-panel shadow-glow">
          <div className="border-b border-border p-2">
            <input
              className="h-10 w-full rounded-md border border-border bg-white/[0.04] px-3 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-cyan/60"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar por nome/username..."
              autoFocus
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {isLoading ? <div className="p-3 text-xs text-slate-400">Buscando usuários...</div> : null}
            {!isLoading && items.length === 0 ? (
              <div className="p-3 text-xs text-slate-400">Nenhum usuário encontrado.</div>
            ) : null}
            {items.map((u) => (
              <button
                key={u.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left",
                  "hover:bg-white/[0.04]",
                )}
                onClick={() => {
                  setSelected(u);
                  onChange(u.id, u);
                  setOpen(false);
                }}
              >
                <div className="grid h-9 w-9 place-items-center rounded-md bg-cyan/15 text-sm font-semibold text-cyan">
                  {initials(u.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{u.name}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    @{u.username}
                    {u.department ? ` • ${u.department}` : ""}
                    {u.job_title ? ` • ${u.job_title}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

