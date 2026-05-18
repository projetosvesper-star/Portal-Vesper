export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <section className="w-full max-w-3xl rounded-lg border border-border bg-panel/85 p-8 text-center shadow-glow">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan">Modulo</p>
        <h2 className="mt-3 text-4xl font-semibold text-white">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-slate-400">{description}</p>
        <div className="mt-8 rounded-md border border-border bg-white/[0.03] p-4 text-slate-300">
          Este modulo sera implementado na proxima etapa.
        </div>
      </section>
    </div>
  );
}
