import { ReactNode } from "react";
import clsx from "clsx";

type PageHeaderProps = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ icon, title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header className={clsx("flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-cyan/30 bg-cyan/10 text-cyan">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
