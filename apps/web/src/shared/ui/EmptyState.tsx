import { ReactNode } from "react";
import { Inbox } from "lucide-react";
import clsx from "clsx";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div className={clsx("rounded-lg border border-dashed border-border bg-slate-950/30 p-6 text-center", className)}>
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg border border-border bg-white/[0.04] text-cyan">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <p className="mt-4 font-semibold text-white">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p> : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
