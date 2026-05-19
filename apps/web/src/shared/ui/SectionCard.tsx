import { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type SectionCardProps = HTMLAttributes<HTMLElement> & {
  title?: string;
  description?: string;
  actions?: ReactNode;
};

export function SectionCard({ title, description, actions, className, children, ...props }: SectionCardProps) {
  return (
    <section className={clsx("min-w-0 rounded-lg border border-border bg-panel/45", className)} {...props}>
      {title || description || actions ? (
        <header className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="font-semibold text-white">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm leading-5 text-slate-400">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
