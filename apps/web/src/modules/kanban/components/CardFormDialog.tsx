import { useEffect, useMemo, useState } from "react";

import { UserPicker } from "../../../shared/components/UserPicker";
import { ErrorState, PortalButton, PortalDialog, PortalInput, PortalSelect, PortalTextarea } from "../../../shared/ui";
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
  const [submitError, setSubmitError] = useState<unknown>(null);
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
    setSubmitError(null);
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

  async function handleSubmit() {
    if (!values.title.trim()) return;
    if (!values.board_id || !values.column_id) return;
    try {
      setSubmitting(true);
      setSubmitError(null);
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PortalDialog
      open={open}
      title={editingCard ? "Editar card" : "Novo card"}
      description="Campos básicos do Kanban Engine genérico."
      onClose={() => onOpenChange(false)}
      maxWidthClassName="max-w-2xl"
      footer={
        <>
          <PortalButton variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </PortalButton>
          <PortalButton onClick={handleSubmit} disabled={submitting || !values.title.trim() || !values.column_id}>
            {editingCard ? "Salvar" : "Criar card"}
          </PortalButton>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-300">Título *</label>
          <PortalInput
            className="mt-2"
            value={values.title}
            onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
            placeholder="Ex: Revisar contrato do cliente"
          />
          {!values.title.trim() ? <p className="mt-2 text-xs text-rose-200">Título é obrigatório.</p> : null}
        </div>

        <PortalSelect
          label="Coluna *"
          value={values.column_id}
          onChange={(columnId) => setValues((current) => ({ ...current, column_id: columnId as UUID }))}
          options={columns.map((column) => ({ value: column.id, label: column.name }))}
          placeholder="Selecionar coluna"
        />

        <PortalSelect
          label="Prioridade"
          value={values.priority}
          onChange={(priority) => setValues((current) => ({ ...current, priority: priority as Priority }))}
          options={(["low", "medium", "high", "critical"] as Priority[]).map((priority) => ({
            value: priority,
            label: priorityLabel(priority),
          }))}
        />

        <div>
          <label className="text-xs font-medium text-slate-300">Código (opcional)</label>
          <PortalInput
            className="mt-2"
            value={values.code}
            onChange={(event) => setValues((current) => ({ ...current, code: event.target.value }))}
            placeholder="Ex: KAN-103"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300">Status (opcional)</label>
          <PortalInput
            className="mt-2"
            value={values.status}
            onChange={(event) => setValues((current) => ({ ...current, status: event.target.value }))}
            placeholder="Ex: aguardando-terceiro"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300">Início (opcional)</label>
          <PortalInput
            className="mt-2"
            value={values.start_date}
            onChange={(event) => setValues((current) => ({ ...current, start_date: event.target.value }))}
            placeholder="ISO 8601 (ex: 2026-05-18T12:00:00Z)"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300">Vencimento (opcional)</label>
          <PortalInput
            className="mt-2"
            value={values.due_date}
            onChange={(event) => setValues((current) => ({ ...current, due_date: event.target.value }))}
            placeholder="ISO 8601 (ex: 2026-05-20T18:00:00Z)"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300">Responsável</label>
          <div className="mt-2">
            <UserPicker
              value={values.assigned_to || null}
              onChange={(userId) => setValues((current) => ({ ...current, assigned_to: userId ?? "" }))}
              disabled={!canAssignCard()}
              placeholder={!canAssignCard() ? "Sem permissão para atribuir" : "Selecionar responsável..."}
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-300">Descrição (opcional)</label>
          <PortalTextarea
            className="mt-2 min-h-28"
            value={values.description}
            onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
            placeholder="Contexto, critérios e anotações..."
          />
        </div>

        {submitError ? (
          <div className="md:col-span-2">
            <ErrorState error={submitError} title="Falha ao salvar card" fallback="Falha ao salvar card." />
          </div>
        ) : null}
      </div>
    </PortalDialog>
  );
}
