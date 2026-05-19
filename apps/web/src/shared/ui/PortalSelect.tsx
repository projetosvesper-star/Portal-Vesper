import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import clsx from "clsx";

export type PortalSelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type PortalSelectProps = {
  value: string;
  options: PortalSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  label?: string;
};

export function PortalSelect({
  value,
  options,
  onChange,
  placeholder = "Selecionar",
  disabled,
  className,
  buttonClassName,
  label,
}: PortalSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = useMemo(() => options.find((option) => option.value === value), [options, value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className={clsx("relative min-w-0", className)}>
      {label ? <span className="mb-1 block text-xs font-medium text-slate-300">{label}</span> : null}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={clsx(
          "flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-md border border-border bg-slate-950/80 px-3 text-left text-sm text-slate-100 outline-none transition",
          "hover:border-cyan/40 focus:border-cyan/60 focus:ring-2 focus:ring-cyan/15 disabled:cursor-not-allowed disabled:opacity-60",
          buttonClassName,
        )}
      >
        <span className={clsx("truncate", !selected && "text-slate-500")}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={clsx("h-4 w-4 shrink-0 text-slate-400 transition", open && "rotate-180 text-cyan")} />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-72 overflow-y-auto rounded-md border border-border bg-slate-950 p-1 shadow-2xl shadow-black/40"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={clsx(
                  "flex w-full items-start gap-2 rounded px-3 py-2 text-left text-sm transition",
                  isSelected ? "bg-cyan/15 text-cyan" : "text-slate-200 hover:bg-white/[0.06]",
                  option.disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <Check className={clsx("mt-0.5 h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{option.label}</span>
                  {option.description ? <span className="mt-0.5 block text-xs text-slate-400">{option.description}</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
