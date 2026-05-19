import { Paperclip, Trash2, Upload } from "lucide-react";
import { useMemo, useRef } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cn } from "../../../shared/utils/cn";
import { getFilePresigned, uploadFile } from "../../../shared/api/files";
import { useToast } from "../../../shared/components/ToastProvider";
import * as kanbanApi from "../api";
import { kanbanQueryKeys, useKanbanAttachments } from "../hooks";
import { canAttachCard } from "../utils/permissions";

type AttachmentsPanelProps = {
  cardId: string;
};

function formatBytes(size: number) {
  if (!Number.isFinite(size)) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

export function AttachmentsPanel({ cardId }: AttachmentsPanelProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();

  const attachmentsQuery = useKanbanAttachments(cardId);
  const attachments = attachmentsQuery.data ?? [];

  const fileIds = useMemo(() => attachments.map((a) => a.file_id), [attachments]);

  const filesQuery = useQuery({
    queryKey: ["files", "presigned", "kanban", cardId, fileIds.join(",")],
    queryFn: async () => {
      const entries = await Promise.all(
        fileIds.map(async (id) => {
          try {
            const res = await getFilePresigned(id);
            return [id, res] as const;
          } catch {
            return [id, null] as const;
          }
        }),
      );
      return Object.fromEntries(entries) as Record<string, Awaited<ReturnType<typeof getFilePresigned>> | null>;
    },
    enabled: attachments.length > 0,
  });

  const attachMutation = useMutation({
    mutationFn: async (file: File) => {
      const stored = await uploadFile({ file, moduleKey: "kanban", bucket: "portal-files" });
      await kanbanApi.attachFile(cardId, { file_id: stored.id });
      return stored;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.attachments(cardId) });
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.activity(cardId) });
      toast.success("Anexo enviado", "Arquivo anexado ao card.");
    },
    onError: (e) => toast.error("Falha ao anexar", (e as Error)?.message ?? "Erro inesperado"),
  });

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) => kanbanApi.deleteAttachment(cardId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.attachments(cardId) });
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.activity(cardId) });
      toast.success("Anexo removido");
    },
    onError: (e) => toast.error("Falha ao remover anexo", (e as Error)?.message ?? "Erro inesperado"),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
          <Paperclip className="h-4 w-4 text-cyan" />
          Anexos
        </div>

        {canAttachCard() ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                attachMutation.mutate(file);
                e.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md bg-cyan px-3 text-xs font-semibold text-slate-950 transition hover:bg-teal",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
              onClick={() => fileInputRef.current?.click()}
              disabled={attachMutation.isPending}
              title="Enviar arquivo"
            >
              <Upload className="h-4 w-4" />
              {attachMutation.isPending ? "Enviando..." : "Enviar arquivo"}
            </button>
          </>
        ) : (
          <div className="text-[11px] text-slate-500">Sem permissão para anexar.</div>
        )}
      </div>

      {attachmentsQuery.isLoading ? <div className="text-xs text-slate-400">Carregando anexos...</div> : null}
      {attachmentsQuery.isError ? (
        <div className="text-xs text-rose-200">{(attachmentsQuery.error as Error)?.message}</div>
      ) : null}

      {attachments.length === 0 && !attachmentsQuery.isLoading ? (
        <div className="rounded-md border border-dashed border-border bg-white/[0.02] p-3 text-xs text-slate-500">
          Nenhum anexo.
        </div>
      ) : null}

      <div className="space-y-2">
        {attachments.map((a) => {
          const presigned = filesQuery.data?.[a.file_id] ?? null;
          const file = presigned?.file;
          return (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-md border border-border bg-white/[0.02] p-3">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  const url = presigned?.url;
                  if (url) window.open(url, "_blank", "noopener,noreferrer");
                }}
                disabled={!presigned?.url}
                title={presigned?.url ? "Abrir/baixar" : "URL indisponível"}
              >
                <p className="truncate text-sm font-medium text-white">{file?.original_name ?? a.file_id}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {file?.content_type ?? "—"} • {file ? formatBytes(file.size_bytes) : "—"} •{" "}
                  {file?.created_at ? formatDate(file.created_at) : formatDate(a.created_at)}
                </p>
              </button>

              {canAttachCard() ? (
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-md border border-border bg-white/[0.04] text-slate-300 hover:text-white disabled:opacity-60"
                  onClick={() => deleteMutation.mutate(a.id)}
                  disabled={deleteMutation.isPending}
                  title="Remover anexo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
