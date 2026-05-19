export function KanbanBoardSkeleton() {
  return (
    <div className="flex min-h-[60vh] gap-4 overflow-x-auto pb-2">
      {Array.from({ length: 3 }).map((_, colIdx) => (
        <div key={colIdx} className="flex h-full w-[320px] flex-col rounded-lg border border-border bg-panel/50">
          <div className="border-b border-border px-4 py-3">
            <div className="h-4 w-40 animate-pulse rounded bg-white/[0.06]" />
            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-white/[0.04]" />
          </div>
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((__, i) => (
              <div key={i} className="rounded-md border border-border bg-panel2/60 px-3 py-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.06]" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

