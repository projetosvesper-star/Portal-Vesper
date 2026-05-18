import { useOutletContext } from "react-router-dom";

import { PortalModule } from "../../shared/api/types";

export function DashboardPage() {
  const { modules } = useOutletContext<{ modules: PortalModule[] }>();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan">Dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Visao inicial do Portal Vesper</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Modulos liberados" value={modules.length.toString()} />
        <Metric title="Notificacoes" value="0" />
        <Metric title="Ambiente" value={import.meta.env.VITE_ENVIRONMENT ?? "dev"} />
      </div>
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-border bg-panel/80 p-5">
          <h3 className="text-lg font-semibold text-white">Modulos disponiveis</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {modules.map((module) => (
              <div key={module.key} className="rounded-md border border-border bg-white/[0.03] p-4">
                <p className="font-medium text-white">{module.name}</p>
                <p className="mt-1 text-sm text-slate-400">{module.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-panel/80 p-5">
          <h3 className="text-lg font-semibold text-white">Ultimas atividades</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <p className="rounded-md border border-border bg-white/[0.03] p-3">Base arquitetural carregada.</p>
            <p className="rounded-md border border-border bg-white/[0.03] p-3">Os modulos finais entram nas proximas etapas.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-panel/80 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
