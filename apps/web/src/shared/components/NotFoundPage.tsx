export function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <section className="w-full max-w-xl rounded-lg border border-border bg-panel/85 p-8 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan">404</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Pagina nao encontrada</h2>
        <p className="mt-4 text-slate-400">A rota informada nao existe no Portal Vesper.</p>
      </section>
    </div>
  );
}
