import { ReactNode, useEffect, useMemo, useState } from "react";

import { UserPicker } from "../../../shared/components/UserPicker";
import { ErrorState, PortalButton, PortalDialog, PortalInput, PortalSelect, PortalTextarea } from "../../../shared/ui";
import { formatCentsInput, getCardCustomFields, parseCurrencyToCents } from "../config";
import type { CustomFields, KanbanBoardConfig, KanbanCard, KanbanColumn, KanbanCustomFieldDefinition, Priority, UUID } from "../types";
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
  metadata?: Record<string, unknown>;
};

type CardFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: UUID;
  columns: KanbanColumn[];
  initialColumnId?: UUID;
  editingCard?: KanbanCard | null;
  config: KanbanBoardConfig;
  onSubmit: (values: CardFormValues) => Promise<void> | void;
};

export function CardFormDialog({
  open,
  onOpenChange,
  boardId,
  columns,
  initialColumnId,
  editingCard,
  config,
  onSubmit,
}: CardFormDialogProps) {
  const defaultColumnId = useMemo(() => initialColumnId ?? columns[0]?.id ?? "", [columns, initialColumnId]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [customFields, setCustomFields] = useState<CustomFields>({});
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
      setCustomFields(getCardCustomFields(editingCard.metadata));
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
      setCustomFields({});
      setValues({
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
      });
    }
  }, [open, editingCard, boardId, defaultColumnId]);

  async function handleSubmit() {
    if (!values.title.trim()) return;
    if (!values.board_id || !values.column_id) return;
    const customError = validateCustomFields(config.card.fields, customFields);
    if (customError) {
      setSubmitError(new Error(customError));
      return;
    }
    try {
      setSubmitting(true);
      setSubmitError(null);
      await onSubmit({
        ...values,
        metadata: {
          ...(editingCard?.metadata ?? {}),
          customFields: normalizeCustomFields(config.card.fields, customFields),
        },
      });
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
      title={editingCard ? config.terminology.editItemLabel : config.terminology.newItemLabel}
      description={`Campos basicos e customizados de ${config.terminology.itemSingular}.`}
      onClose={() => onOpenChange(false)}
      maxWidthClassName="max-w-2xl"
      footer={
        <>
          <PortalButton variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </PortalButton>
          <PortalButton onClick={handleSubmit} disabled={submitting || !values.title.trim() || !values.column_id}>
            {editingCard ? "Salvar" : config.terminology.newItemLabel}
          </PortalButton>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-300">{config.terminology.itemTitleLabel} *</label>
          <PortalInput
            className="mt-2"
            aria-label={`${config.terminology.itemTitleLabel} *`}
            value={values.title}
            onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
            placeholder="Ex: Revisar contrato do cliente"
          />
          {!values.title.trim() ? <p className="mt-2 text-xs text-rose-200">{config.terminology.itemTitleLabel} e obrigatorio.</p> : null}
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

        <Field label="Codigo (opcional)">
          <PortalInput value={values.code} onChange={(event) => setValues((current) => ({ ...current, code: event.target.value }))} placeholder="Ex: KAN-103" />
        </Field>

        <Field label="Status (opcional)">
          <PortalInput value={values.status} onChange={(event) => setValues((current) => ({ ...current, status: event.target.value }))} placeholder="Ex: aguardando-terceiro" />
        </Field>

        <Field label="Inicio (opcional)">
          <PortalInput value={values.start_date} onChange={(event) => setValues((current) => ({ ...current, start_date: event.target.value }))} placeholder="ISO 8601" />
        </Field>

        <Field label="Vencimento (opcional)">
          <PortalInput value={values.due_date} onChange={(event) => setValues((current) => ({ ...current, due_date: event.target.value }))} placeholder="ISO 8601" />
        </Field>

        <div>
          <label className="text-xs font-medium text-slate-300">Responsavel</label>
          <div className="mt-2">
            <UserPicker
              value={values.assigned_to || null}
              onChange={(userId) => setValues((current) => ({ ...current, assigned_to: userId ?? "" }))}
              disabled={!canAssignCard()}
              placeholder={!canAssignCard() ? "Sem permissao para atribuir" : "Selecionar responsavel..."}
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-300">{config.terminology.itemDescriptionLabel} (opcional)</label>
          <PortalTextarea
            className="mt-2 min-h-28"
            aria-label={`${config.terminology.itemDescriptionLabel} (opcional)`}
            value={values.description}
            onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
            placeholder="Contexto, criterios e anotacoes..."
          />
        </div>

        {config.card.fields.length > 0 ? (
          <div className="md:col-span-2">
            <div className="mb-3 border-t border-border pt-4">
              <p className="text-sm font-semibold text-white">Campos customizados</p>
              <p className="mt-1 text-xs text-slate-400">Valores salvos em metadata.customFields.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {config.card.fields.map((field) => (
                <CustomFieldInput
                  key={field.key}
                  field={field}
                  value={customFields[field.key] ?? null}
                  onChange={(value) => setCustomFields((current) => ({ ...current, [field.key]: value }))}
                />
              ))}
            </div>
          </div>
        ) : null}

        {submitError ? (
          <div className="md:col-span-2">
            <ErrorState error={submitError} title={`Falha ao salvar ${config.terminology.itemSingular}`} fallback="Falha ao salvar." />
          </div>
        ) : null}
      </div>
    </PortalDialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-300">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function CustomFieldInput({ field, value, onChange }: { field: KanbanCustomFieldDefinition; value: unknown; onChange: (value: any) => void }) {
  const label = `${field.label}${field.required ? " *" : ""}`;
  if (field.type === "textarea") {
    return (
      <label className="text-xs font-medium text-slate-300 md:col-span-2">
        {label}
        <PortalTextarea aria-label={label} className="mt-2" value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }
  if (field.type === "select") {
    return (
      <PortalSelect
        label={label}
        value={typeof value === "string" ? value : ""}
        onChange={onChange}
        placeholder="Selecionar"
        options={(field.options ?? []).map((option) => ({ value: option.value, label: option.label }))}
      />
    );
  }
  if (field.type === "checkbox") {
    return (
      <label className="flex h-10 items-center gap-3 self-end rounded-md border border-border bg-slate-950/80 px-3 text-sm text-slate-200">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-cyan" />
        {label}
      </label>
    );
  }
  if (field.type === "user") {
    return (
      <div>
        <label className="text-xs font-medium text-slate-300">{label}</label>
        <div className="mt-2">
          <UserPicker value={typeof value === "string" ? value : null} onChange={(userId) => onChange(userId)} placeholder="Selecionar usuario..." />
        </div>
      </div>
    );
  }
  if (field.type === "currency") {
    return (
      <label className="text-xs font-medium text-slate-300">
        {label}
        <PortalInput
          aria-label={label}
          className="mt-2"
          value={formatCentsInput(value)}
          onChange={(event) => onChange(parseCurrencyToCents(event.target.value))}
          placeholder="R$ 0,00"
        />
      </label>
    );
  }
  return (
    <label className="text-xs font-medium text-slate-300">
      {label}
      <PortalInput
        aria-label={label}
        className="mt-2"
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        value={value == null ? "" : String(value)}
        onChange={(event) => onChange(field.type === "number" ? (event.target.value ? Number(event.target.value) : null) : event.target.value)}
      />
    </label>
  );
}

function validateCustomFields(fields: KanbanCustomFieldDefinition[], values: CustomFields) {
  for (const field of fields) {
    const value = values[field.key];
    if (field.required && (value === null || value === undefined || value === "")) return `${field.label} e obrigatorio.`;
    if ((value === null || value === undefined || value === "") && !field.required) continue;
    if (field.type === "select" && !field.options?.some((option) => option.value === value)) return `${field.label} deve ter uma opcao valida.`;
    if (field.type === "number" && typeof value !== "number") return `${field.label} deve ser numero.`;
    if (field.type === "currency" && (typeof value !== "number" || !Number.isInteger(value))) return `${field.label} deve ser valor em centavos.`;
    if (field.type === "checkbox" && typeof value !== "boolean") return `${field.label} deve ser verdadeiro ou falso.`;
  }
  return null;
}

function normalizeCustomFields(fields: KanbanCustomFieldDefinition[], values: CustomFields) {
  const allowed = new Set(fields.map((field) => field.key));
  const result: CustomFields = {};
  for (const [key, value] of Object.entries(values)) {
    if (!allowed.has(key)) continue;
    if (value === null || value === undefined || value === "") continue;
    result[key] = value;
  }
  return result;
}
