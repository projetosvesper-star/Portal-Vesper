import { HTMLAttributes } from "react";
import clsx from "clsx";

type PortalBadgeTone = "cyan" | "slate" | "green" | "amber" | "rose";

type PortalBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: PortalBadgeTone;
};

export function PortalBadge({ tone = "cyan", className, ...props }: PortalBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium",
        tone === "cyan" && "border-cyan/20 bg-cyan/10 text-cyan",
        tone === "slate" && "border-border bg-white/[0.04] text-slate-300",
        tone === "green" && "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
        tone === "amber" && "border-amber-400/20 bg-amber-400/10 text-amber-200",
        tone === "rose" && "border-rose-400/20 bg-rose-400/10 text-rose-200",
        className,
      )}
      {...props}
    />
  );
}
