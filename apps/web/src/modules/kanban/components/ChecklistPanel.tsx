import { CheckSquare, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Input } from "../../../shared/components/Input";
import { cn } from "../../../shared/utils/cn";
import { useToast } from "../../../shared/components/ToastProvider";
import * as api from "../api";
import { kanbanQueryKeys, useKanbanChecklist } from "../hooks";
import { canChecklistCard } from "../utils/permissions";

type ChecklistPanelProps = {
  cardId: string;
};

export function ChecklistPanel({ cardId }: ChecklistPanelProps) {
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();
  const toast = useToast();

  if (!canChecklistCard()) {
    return (
      <div className="rounded-md border border-border bg-white/[0.02] p-3 text-xs text-slate-400">
        Sem permissão para checklist.
      </div>
    );
  }

  const { data = [], isLoading, isError, error } = useKanbanChecklist(cardId);

  const sorted = useMemo(() => [...data].sort((a, b) => a.order_index - b.order_index), [data]);
  const doneCount = sorted.filter((i) => i.is_done).length;

  const createMutation = useMutation({
    mutationFn: () => api.createChecklistItem(cardId, { title: title.trim() }),
    onSuccess: () => {
      setTitle("");
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.checklist(cardId) });
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.activity(cardId) });
      toast.success("Checklist atualizado", "Item criado.");
    },
    onError: (e) => toast.error("Falha no checklist", (e as Error)?.message ?? "Erro inesperado"),
  });

  const toggleMutation = useMutation({
    mutationFn: (args: { itemId: string; is_done: boolean }) => api.updateChecklistItem(args.itemId, { is_done: args.is_done }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.checklist(cardId) });
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.activity(cardId) });
    },
    onError: (e) => toast.error("Falha no checklist", (e as Error)?.message ?? "Erro inesperado"),
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => api.deleteChecklistItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.checklist(cardId) });
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.activity(cardId) });
      toast.success("Checklist atualizado", "Item removido.");
    },
    onError: (e) => toast.error("Falha no checklist", (e as Error)?.message ?? "Erro inesperado"),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
          <CheckSquare className="h-4 w-4 text-cyan" />
          Checklist
        </div>
        <div className="text-[11px] text-slate-500">
          {doneCount}/{sorted.length} concluídos
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Adicionar item..." />
        <button
          type="button"
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-md border border-border bg-white/[0.04] px-3 text-sm text-slate-200",
            "hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60",
          )}
          disabled={!title.trim() || createMutation.isPending}
          onClick={() => createMutation.mutate()}
          title="Criar item"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? <div className="text-xs text-slate-400">Carregando checklist...</div> : null}
      {isError ? <div className="text-xs text-rose-200">{(error as Error)?.message}</div> : null}

      <div className="space-y-2">
        {sorted.map((item) => (
          <div key={item.id} className="flex items-start gap-2 rounded-md border border-border bg-white/[0.02] p-2">
            <button
              type="button"
              className={cn(
                "mt-0.5 grid h-5 w-5 place-items-center rounded border border-border bg-white/[0.04]",
                item.is_done && "border-cyan/40 bg-cyan/15",
              )}
              onClick={() => toggleMutation.mutate({ itemId: item.id, is_done: !item.is_done })}
              disabled={toggleMutation.isPending}
              title={item.is_done ? "Marcar como não concluído" : "Marcar como concluído"}
            >
              {item.is_done ? <span className="h-2.5 w-2.5 rounded-sm bg-cyan" /> : null}
            </button>

            <div className="min-w-0 flex-1">
              <p className={cn("text-sm text-slate-200", item.is_done && "line-through text-slate-500")}>
                {item.title}
              </p>
            </div>

            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-md border border-border bg-white/[0.04] text-slate-300 hover:text-white"
              onClick={() => deleteMutation.mutate(item.id)}
              disabled={deleteMutation.isPending}
              title="Excluir item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
