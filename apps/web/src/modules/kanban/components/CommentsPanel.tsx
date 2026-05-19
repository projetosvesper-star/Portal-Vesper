import { MessageSquare, Send } from "lucide-react";
import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cn } from "../../../shared/utils/cn";
import { useToast } from "../../../shared/components/ToastProvider";
import * as api from "../api";
import { kanbanQueryKeys, useKanbanComments } from "../hooks";
import { canCommentCard } from "../utils/permissions";

type CommentsPanelProps = {
  cardId: string;
};

function formatDate(value: string) {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

export function CommentsPanel({ cardId }: CommentsPanelProps) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data = [], isLoading, isError, error } = useKanbanComments(cardId);

  const createMutation = useMutation({
    mutationFn: () => api.createComment(cardId, { content: content.trim() }),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.comments(cardId) });
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.activity(cardId) });
      toast.success("Comentário enviado");
    },
    onError: (e) => toast.error("Falha ao comentar", (e as Error)?.message ?? "Erro inesperado"),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
        <MessageSquare className="h-4 w-4 text-cyan" />
        Comentários
      </div>

      <div className="rounded-md border border-border bg-white/[0.02] p-3">
        <textarea
          className={cn(
            "min-h-20 w-full resize-y rounded-md border border-border bg-white/[0.04] px-3 py-2 text-sm text-slate-200 outline-none",
            "placeholder:text-slate-500 focus:border-cyan/60 focus:ring-2 focus:ring-cyan/15",
          )}
          placeholder={canCommentCard() ? "Escreva um comentário..." : "Sem permissão para comentar."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!canCommentCard()}
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-md bg-cyan px-4 text-sm font-semibold text-slate-950 transition hover:bg-teal",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
            disabled={!canCommentCard() || !content.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Send className="h-4 w-4" />
            Enviar
          </button>
        </div>
      </div>

      {isLoading ? <div className="text-xs text-slate-400">Carregando comentários...</div> : null}
      {isError ? <div className="text-xs text-rose-200">{(error as Error)?.message}</div> : null}

      <div className="space-y-2">
        {data
          .filter((c) => !c.deleted_at)
          .map((c) => (
            <div key={c.id} className="rounded-md border border-border bg-white/[0.02] px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">user_id: {c.user_id}</div>
                <div className="text-[11px] text-slate-500">{formatDate(c.created_at)}</div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{c.content}</p>
              <div className="mt-2 text-[11px] text-slate-600">
                {c.edited_at ? `Editado em ${formatDate(c.edited_at)}` : ""}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
