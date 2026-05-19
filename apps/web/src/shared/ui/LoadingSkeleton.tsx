import clsx from "clsx";

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-lg border border-border bg-slate-950/40", className)} />;
}
