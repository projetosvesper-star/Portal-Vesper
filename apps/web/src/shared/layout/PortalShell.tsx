import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { apiRequest } from "../api/client";
import { PortalModule } from "../api/types";
import { useAuthStore } from "../auth/store";
import { usePortalWebSocket } from "../hooks/usePortalWebSocket";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function PortalShell() {
  const setModules = useAuthStore((state) => state.setModules);
  const setPermissions = useAuthStore((state) => state.setPermissions);
  const websocketStatus = usePortalWebSocket();
  const { data: modules = [] } = useQuery({
    queryKey: ["me", "modules"],
    queryFn: () => apiRequest<PortalModule[]>("/api/me/modules"),
  });
  const { data: permissions = [] } = useQuery({
    queryKey: ["me", "permissions"],
    queryFn: () => apiRequest<string[]>("/api/me/permissions"),
  });

  useEffect(() => {
    setModules(modules);
  }, [modules, setModules]);

  useEffect(() => {
    setPermissions(permissions);
  }, [permissions, setPermissions]);

  return (
    <div className="flex h-screen bg-background text-slate-100">
      <Sidebar modules={modules} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar websocketStatus={websocketStatus} />
        <main className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(56,211,238,0.10),transparent_32rem)] p-6">
          <Outlet context={{ modules }} />
        </main>
      </div>
    </div>
  );
}
