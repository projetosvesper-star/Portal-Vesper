import clsx from "clsx";

export type PortalTabOption<T extends string = string> = {
  value: T;
  label: string;
};

type PortalTabsProps<T extends string = string> = {
  value: T;
  options: PortalTabOption<T>[];
  onChange: (value: T) => void;
  className?: string;
};

export function PortalTabs<T extends string>({ value, options, onChange, className }: PortalTabsProps<T>) {
  return (
    <div className={clsx("flex flex-wrap gap-2 rounded-lg border border-border bg-slate-950/35 p-1", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={clsx(
            "rounded-md px-3 py-2 text-sm font-medium transition",
            option.value === value ? "bg-cyan text-slate-950" : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
