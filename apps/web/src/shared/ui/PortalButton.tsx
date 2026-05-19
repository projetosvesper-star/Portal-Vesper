import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type PortalButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type PortalButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: PortalButtonVariant;
};

export const PortalButton = forwardRef<HTMLButtonElement, PortalButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition",
          "focus:outline-none focus:ring-2 focus:ring-cyan/30 disabled:cursor-not-allowed disabled:opacity-55",
          variant === "primary" && "bg-cyan text-slate-950 hover:bg-cyan/90",
          variant === "secondary" && "border border-border bg-panel text-slate-100 hover:bg-slate-800",
          variant === "ghost" && "bg-transparent text-slate-200 hover:bg-white/[0.06]",
          variant === "danger" && "border border-rose-500/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20",
          className,
        )}
        {...props}
      />
    );
  },
);

PortalButton.displayName = "PortalButton";
