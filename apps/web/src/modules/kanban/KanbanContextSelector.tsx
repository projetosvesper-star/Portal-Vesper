import clsx from "clsx";

export type KanbanContextKey = string;

export type KanbanContextOption = {
  key: KanbanContextKey;
  label: string;
  description: string;
  route?: string | null;
  disabled?: boolean;
};

export function KanbanContextSelector({
  value,
  options,
  onChange,
}: {
  value: KanbanContextKey;
  options: KanbanContextOption[];
  onChange: (value: KanbanContextKey) => void;
}) {
  return (
    <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          disabled={option.disabled}
          onClick={() => onChange(option.key)}
          className={clsx(
            "min-w-0 rounded-lg border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
            value === option.key
              ? "border-cyan/60 bg-cyan/10 shadow-glow"
              : "border-border bg-panel/45 hover:border-cyan/30 hover:bg-white/[0.04]",
          )}
        >
          <span className="block truncate text-sm font-semibold text-white">{option.label}</span>
          <span className="mt-1 block text-xs leading-5 text-slate-400">{option.description}</span>
        </button>
      ))}
    </div>
  );
}
