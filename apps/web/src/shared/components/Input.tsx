import { InputHTMLAttributes } from "react";

import { cn } from "../utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-border bg-white/5 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan/70 focus:ring-2 focus:ring-cyan/15",
        className,
      )}
      {...props}
    />
  );
}
