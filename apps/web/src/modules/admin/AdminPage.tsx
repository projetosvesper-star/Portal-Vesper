import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "../../shared/api/client";
import { Permission, PortalModule, User } from "../../shared/api/types";

export function AdminPage() {
  const { data: users = [] } = useQuery({ queryKey: ["admin", "users"], queryFn: () => apiRequest<User[]>("/api/admin/users") });
  const { data: modules = [] } = useQuery({ queryKey: ["admin", "modules"], queryFn: () => apiRequest<PortalModule[]>("/api/admin/modules") });
  const { data: permissions = [] } = useQuery({ queryKey: ["admin", "permissions"], queryFn: () => apiRequest<Permission[]>("/api/admin/permissions") });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan">Administracao</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Controle inicial do portal</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        {["Usuarios", "Permissoes", "Modulos", "Logs"].map((label) => (
          <button key={label} className="rounded-lg border border-border bg-panel/80 p-5 text-left text-white transition hover:border-cyan/40">
            {label}
          </button>
        ))}
      </div>
      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-border bg-panel/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Usuarios</h3>
            <button className="rounded-md border border-cyan/30 px-3 py-2 text-sm text-cyan">Visualizar como usuario</button>
          </div>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-md border border-border bg-white/[0.03] p-3">
                <div>
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.username}</p>
                </div>
                <span className="text-sm text-slate-400">{user.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-panel/80 p-5">
          <h3 className="text-lg font-semibold text-white">Modulos</h3>
          <div className="mt-4 space-y-2">
            {modules.map((module) => (
              <div key={module.id} className="flex items-center justify-between rounded-md border border-border bg-white/[0.03] p-3">
                <span className="font-medium text-white">{module.name}</span>
                <span className="text-sm text-slate-400">{module.enabled ? "Ativo" : "Inativo"}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-panel/80 p-5">
          <h3 className="text-lg font-semibold text-white">Permissoes</h3>
          <div className="mt-4 max-h-[34rem] space-y-2 overflow-y-auto pr-1">
            {permissions.map((permission) => (
              <div key={permission.id} className="rounded-md border border-border bg-white/[0.03] p-3">
                <p className="font-medium text-white">{permission.key}</p>
                <p className="mt-1 text-sm text-slate-500">{permission.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
