import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

const inputClassName =
  "w-full rounded-md border border-border bg-slate-950/80 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan/60 focus:ring-2 focus:ring-cyan/15 disabled:cursor-not-allowed disabled:opacity-60";

export const PortalInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={clsx("h-10", inputClassName, className)} {...props} />;
  },
);

PortalInput.displayName = "PortalInput";

export const PortalTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return <textarea ref={ref} className={clsx("min-h-24 resize-y py-2", inputClassName, className)} {...props} />;
  },
);

PortalTextarea.displayName = "PortalTextarea";
