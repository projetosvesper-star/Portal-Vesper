import { Bell, LogOut, Search } from "lucide-react";

import { useAuthStore } from "../auth/store";
import { Badge } from "../components/Badge";

type TopbarProps = {
  websocketStatus: "offline" | "connecting" | "online";
};

export function Topbar({ websocketStatus }: TopbarProps) {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const environment = import.meta.env.VITE_ENVIRONMENT ?? "development";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/70 px-6 backdrop-blur">
      <div className="relative w-full max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          className="h-10 w-full rounded-md border border-border bg-white/[0.04] pl-10 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-cyan/60"
          placeholder="Buscar no Portal Vesper"
        />
      </div>
      <div className="ml-6 flex items-center gap-3">
        <Badge>{environment}</Badge>
        <Badge>WS {websocketStatus}</Badge>
        <button className="grid h-10 w-10 place-items-center rounded-md border border-border bg-white/[0.04] text-slate-300 hover:text-white" title="Notificacoes">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 rounded-md border border-border bg-white/[0.04] px-3 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-cyan/15 text-sm font-semibold text-cyan">
            {user?.name?.slice(0, 1) ?? "U"}
          </div>
          <div className="hidden text-sm md:block">
            <p className="font-medium text-white">{user?.name ?? "Usuario"}</p>
            <p className="text-xs text-slate-500">{user?.username}</p>
          </div>
        </div>
        <button
          className="grid h-10 w-10 place-items-center rounded-md border border-border bg-white/[0.04] text-slate-300 hover:text-white"
          title="Sair"
          onClick={clearSession}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
