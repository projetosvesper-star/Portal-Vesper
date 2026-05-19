import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "../../../shared/components/Button";
import { Input } from "../../../shared/components/Input";
import { UserPicker } from "../../../shared/components/UserPicker";
import { cn } from "../../../shared/utils/cn";
import type { KanbanCard, KanbanColumn, Priority, UUID } from "../types";
import { priorityLabel } from "../utils/priority";
import { canAssignCard } from "../utils/permissions";

type CardFormValues = {
  title: string;
  description: string;
  board_id: UUID;
  column_id: UUID;
  priority: Priority;
  due_date: string;
  start_date: string;
  assigned_to: string;
  code: string;
  status: string;
};

type CardFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: UUID;
  columns: KanbanColumn[];
  initialColumnId?: UUID;
  editingCard?: KanbanCard | null;
  onSubmit: (values: CardFormValues) => Promise<void> | void;
};

export function CardFormDialog({
  open,
  onOpenChange,
  boardId,
  columns,
  initialColumnId,
  editingCard,
  onSubmit,
}: CardFormDialogProps) {
  const defaultColumnId = useMemo(() => initialColumnId ?? columns[0]?.id ?? "", [columns, initialColumnId]);

  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState<CardFormValues>(() => ({
    title: "",
    description: "",
    board_id: boardId,
    column_id: defaultColumnId,
    priority: "medium",
    due_date: "",
    start_date: "",
    assigned_to: "",
    code: "",
    status: "",
  }));

  useEffect(() => {
    if (!open) return;
    if (editingCard) {
      setValues({
        title: editingCard.title ?? "",
        description: editingCard.description ?? "",
        board_id: editingCard.board_id,
        column_id: editingCard.column_id,
        priority: editingCard.priority,
        due_date: editingCard.due_date ?? "",
        start_date: editingCard.start_date ?? "",
        assigned_to: editingCard.assigned_to ?? "",
        code: editingCard.code ?? "",
        status: editingCard.status ?? "",
      });
    } else {
      setValues((prev) => ({
        ...prev,
        title: "",
        description: "",
        board_id: boardId,
        column_id: defaultColumnId,
        priority: "medium",
        due_date: "",
        start_date: "",
        assigned_to: "",
        code: "",
        status: "",
      }));
    }
  }, [open, editingCard, boardId, defaultColumnId]);

  if (!open) return null;

  async function handleSubmit() {
    if (!values.title.trim()) return;
    if (!values.board_id || !values.column_id) return;
    try {
      setSubmitting(true);
      await onSubmit(values);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-panel shadow-glow">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-white">{editingCard ? "Editar card" : "Novo card"}</h3>
            <p className="mt-0.5 text-xs text-slate-400">Campos básicos do Kanban Engine (genérico)</p>
          </div>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-md border border-border bg-white/[0.04] text-slate-300 hover:text-white"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-300">Título *</label>
            <Input
              className="mt-2"
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              placeholder="Ex: Revisar contrato do cliente"
            />
            {!values.title.trim() ? <p className="mt-2 text-xs text-rose-200">Título é obrigatório.</p> : null}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Coluna *</label>
            <select
              className="mt-2 h-11 w-full rounded-md border border-border bg-white/[0.04] px-3 text-sm text-slate-200 outline-none focus:border-cyan/60"
              value={values.column_id}
              onChange={(e) => setValues((v) => ({ ...v, column_id: e.target.value }))}
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Prioridade</label>
            <select
              className="mt-2 h-11 w-full rounded-md border border-border bg-white/[0.04] px-3 text-sm text-slate-200 outline-none focus:border-cyan/60"
              value={values.priority}
              onChange={(e) => setValues((v) => ({ ...v, priority: e.target.value as Priority }))}
            >
              {(["low", "medium", "high", "critical"] as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {priorityLabel(p)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Código (opcional)</label>
            <Input
              className="mt-2"
              value={values.code}
              onChange={(e) => setValues((v) => ({ ...v, code: e.target.value }))}
              placeholder="Ex: KAN-103"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Status (opcional)</label>
            <Input
              className="mt-2"
              value={values.status}
              onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
              placeholder="Ex: aguardando-terceiro"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Início (opcional)</label>
            <Input
              className="mt-2"
              value={values.start_date}
              onChange={(e) => setValues((v) => ({ ...v, start_date: e.target.value }))}
              placeholder="ISO 8601 (ex: 2026-05-18T12:00:00Z)"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Vencimento (opcional)</label>
            <Input
              className="mt-2"
              value={values.due_date}
              onChange={(e) => setValues((v) => ({ ...v, due_date: e.target.value }))}
              placeholder="ISO 8601 (ex: 2026-05-20T18:00:00Z)"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Responsável</label>
            <div className="mt-2">
              <UserPicker
                value={values.assigned_to || null}
                onChange={(userId) => setValues((v) => ({ ...v, assigned_to: userId ?? "" }))}
                disabled={!canAssignCard()}
                placeholder={!canAssignCard() ? "Sem permissão para atribuir" : "Selecionar responsável..."}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-300">Descrição (opcional)</label>
            <textarea
              className={cn(
                "mt-2 min-h-28 w-full resize-y rounded-md border border-border bg-white/[0.04] px-3 py-2 text-sm text-slate-200 outline-none",
                "placeholder:text-slate-500 focus:border-cyan/60 focus:ring-2 focus:ring-cyan/15",
              )}
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              placeholder="Contexto, critérios e anotações..."
            />
          </div>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            className="h-10 rounded-md border border-border bg-white/[0.04] px-4 text-sm text-slate-200 hover:bg-white/[0.06]"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </button>
          <Button onClick={handleSubmit} disabled={submitting || !values.title.trim() || !values.column_id}>
            {editingCard ? "Salvar" : "Criar card"}
          </Button>
        </footer>
      </div>
    </div>
  );
}
