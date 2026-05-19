import { LayoutDashboard } from "lucide-react";
import { NavLink } from "react-router-dom";

import { PortalModule } from "../api/types";
import { cn } from "../utils/cn";
import { iconMap } from "./iconMap";

type SidebarProps = {
  modules: PortalModule[];
};

export function Sidebar({ modules }: SidebarProps) {
  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-border bg-panel/95 px-4 py-5">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-lg border border-cyan/30 bg-cyan/10 text-lg font-black text-cyan">
          V
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan">Portal</p>
          <h1 className="text-xl font-bold text-white">Vesper</h1>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
        {/**
         * Hide certain submodules from sidebar and surface them inside their
         * parent module (e.g. `kanban_producao` should be a context inside
         * the `kanban` module). This is a frontend-only mapping to avoid
         * changing backend module registry for now.
         */}
        {modules
          .filter((m) => {
            const hiddenSidebarModules = ["kanban_producao"];
            return !hiddenSidebarModules.includes(m.key);
          })
          .map((module) => {
            const Icon = iconMap[module.icon] ?? LayoutDashboard;
            return <NavItem key={module.key} to={module.route} icon={Icon} label={module.name} />;
          })}
      </nav>

      <div className="rounded-md border border-border bg-white/[0.03] p-3 text-xs text-slate-400">
        <p className="font-medium text-slate-200">Base arquitetural</p>
        <p className="mt-1">Modulos carregados por permissao do usuario.</p>
      </div>
    </aside>
  );
}

function NavItem({ to, icon: Icon, label }: { to: string; icon: typeof LayoutDashboard; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white",
          isActive && "bg-cyan/10 text-cyan shadow-glow",
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}
