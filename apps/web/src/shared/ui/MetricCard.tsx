import { ReactNode } from "react";
import clsx from "clsx";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  description?: string;
  className?: string;
};

export function MetricCard({ label, value, description, className }: MetricCardProps) {
  return (
    <div className={clsx("rounded-lg border border-border bg-panel/60 p-4", className)}>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {description ? <p className="mt-1 text-xs text-slate-400">{description}</p> : null}
    </div>
  );
}
