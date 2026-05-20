import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

import { ConfirmDialog, ErrorState, PortalButton, PortalDrawer, PortalInput, PortalSelect, PortalTabs, PortalTextarea } from "../../../shared/ui";
import type { KanbanBoard, KanbanBoardConfig, KanbanCustomFieldDefinition, KanbanCustomFieldType } from "../types";

type ConfigTab = "geral" | "terminologia" | "campos" | "tv";

type Props = {
  open: boolean;
  board: KanbanBoard | null;
  config: KanbanBoardConfig;
  submitting?: boolean;
  error?: unknown;
  onClose: () => void;
  onSubmit: (config: KanbanBoardConfig) => Promise<void> | void;
};

const FIELD_TYPES: Array<{ value: KanbanCustomFieldType; label: string }> = [
  { value: "text", label: "Texto curto" },
  { value: "textarea", label: "Texto longo" },
  { value: "number", label: "Numero" },
  { value: "date", label: "Data" },
  { value: "select", label: "Selecao" },
  { value: "checkbox", label: "Checkbox" },
  { value: "user", label: "Usuario" },
  { value: "currency", label: "Moeda" },
];

const EMPTY_FIELD: KanbanCustomFieldDefinition = {
  key: "",
  label: "",
  type: "text",
  required: false,
  showInCard: true,
  showInDrawer: true,
  showInTv: true,
  showInFilters: true,
  order: 10,
  options: null,
};

export function KanbanBoardConfigDrawer({ open, board, config, submitting, error, onClose, onSubmit }: Props) {
  const [tab, setTab] = useState<ConfigTab>("geral");
  const [draft, setDraft] = useState<KanbanBoardConfig>(config);
  const [fieldDraft, setFieldDraft] = useState<KanbanCustomFieldDefinition>(EMPTY_FIELD);
  const [fieldOptionsText, setFieldOptionsText] = useState("");
  const [fieldToRemove, setFieldToRemove] = useState<KanbanCustomFieldDefinition | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(config);
    setFieldDraft({ ...EMPTY_FIELD, order: nextFieldOrder(config.card.fields) });
    setFieldOptionsText("");
    setLocalError(null);
  }, [config, open]);

  const orderedFields = useMemo(() => draft.card.fields.slice().sort((a, b) => a.order - b.order), [draft.card.fields]);

  async function saveDraft() {
    setLocalError(null);
    try {
      await onSubmit({ ...draft, configVersion: 1 });
    } catch (err) {
      setLocalError((err as Error)?.message ?? "Falha ao salvar configuracao.");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await saveDraft();
  }

  function addField() {
    const key = fieldDraft.key.trim();
    const label = fieldDraft.label.trim();
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(key)) {
      setLocalError("A key deve usar letras minusculas, numeros e underline, sem espacos.");
      return;
    }
    if (!label) {
      setLocalError("Informe o label do campo.");
      return;
    }
    if (orderedFields.some((field) => field.key === key)) {
      setLocalError("Ja existe um campo com esta key.");
      return;
    }
    const options = parseOptions(fieldOptionsText);
    if (fieldDraft.type === "select" && options.length === 0) {
      setLocalError("Campos de selecao exigem opcoes.");
      return;
    }
    const nextField: KanbanCustomFieldDefinition = {
      ...fieldDraft,
      key,
      label,
      order: nextFieldOrder(orderedFields),
      options: fieldDraft.type === "select" ? options : null,
    };
    setDraft((current) => ({
      ...current,
      card: { fields: [...current.card.fields, nextField] },
    }));
    setFieldDraft({ ...EMPTY_FIELD, order: nextField.order + 10 });
    setFieldOptionsText("");
    setLocalError(null);
  }

  function removeField(key: string) {
    setDraft((current) => ({
      ...current,
      card: { fields: current.card.fields.filter((field) => field.key !== key) },
    }));
  }

  function moveField(key: string, direction: -1 | 1) {
    const fields = orderedFields.slice();
    const index = fields.findIndex((field) => field.key === key);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= fields.length) return;
    [fields[index], fields[next]] = [fields[next], fields[index]];
    setDraft((current) => ({
      ...current,
      card: { fields: fields.map((field, orderIndex) => ({ ...field, order: (orderIndex + 1) * 10 })) },
    }));
  }

  return (
    <>
      <PortalDrawer
        open={open}
        title="Configuracoes do quadro"
        description={board ? `Ajustes configuraveis de ${board.name}` : "Ajustes configuraveis do Kanban"}
        onClose={onClose}
        widthClassName="max-w-4xl"
        footer={
          <>
            <PortalButton variant="secondary" onClick={onClose}>
              Cancelar
            </PortalButton>
            <PortalButton onClick={() => void saveDraft()} disabled={submitting}>
              <Save className="h-4 w-4" />
              Salvar configuracao
            </PortalButton>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-5">
          <PortalTabs
            value={tab}
            onChange={setTab}
            options={[
              { value: "geral", label: "Geral" },
              { value: "terminologia", label: "Terminologia" },
              { value: "campos", label: "Campos" },
              { value: "tv", label: "TV/Foco" },
            ]}
          />

          {error || localError ? (
            <ErrorState error={error ?? new Error(localError ?? "")} title="Falha na configuracao" fallback={localError ?? "Falha ao salvar configuracao."} />
          ) : null}

          {tab === "geral" ? (
            <section className="grid gap-4 md:grid-cols-2">
              <ReadOnly label="Nome do quadro" value={board?.name ?? "-"} />
              <ReadOnly label="Tipo" value={board?.board_type ?? "-"} />
              <ReadOnly label="Contexto" value={board?.module_context ?? "-"} />
              <Input
                label="Cor de destaque"
                value={draft.visual.accentColor}
                onChange={(value) => setDraft((current) => ({ ...current, visual: { ...current.visual, accentColor: value } }))}
              />
              <Input
                label="Icone"
                value={draft.visual.icon}
                onChange={(value) => setDraft((current) => ({ ...current, visual: { ...current.visual, icon: value } }))}
              />
              <PortalSelect
                label="Densidade do card"
                value={draft.visual.cardDensity}
                onChange={(value) => setDraft((current) => ({ ...current, visual: { ...current.visual, cardDensity: value as "compact" | "comfortable" } }))}
                options={[
                  { value: "comfortable", label: "Confortavel" },
                  { value: "compact", label: "Compacta" },
                ]}
              />
            </section>
          ) : null}

          {tab === "terminologia" ? (
            <section className="grid gap-4 md:grid-cols-2">
              <Input label="Singular" value={draft.terminology.itemSingular} onChange={(value) => updateTerminology("itemSingular", value)} />
              <Input label="Plural" value={draft.terminology.itemPlural} onChange={(value) => updateTerminology("itemPlural", value)} />
              <Input label="Botao principal" value={draft.terminology.newItemLabel} onChange={(value) => updateTerminology("newItemLabel", value)} />
              <Input label="Botao de edicao" value={draft.terminology.editItemLabel} onChange={(value) => updateTerminology("editItemLabel", value)} />
              <Input label="Label do titulo" value={draft.terminology.itemTitleLabel} onChange={(value) => updateTerminology("itemTitleLabel", value)} />
              <Input label="Label da descricao" value={draft.terminology.itemDescriptionLabel} onChange={(value) => updateTerminology("itemDescriptionLabel", value)} />
              <div className="md:col-span-2">
                <Input label="Texto de vazio" value={draft.terminology.emptyStateText} onChange={(value) => updateTerminology("emptyStateText", value)} />
              </div>
            </section>
          ) : null}

          {tab === "campos" ? (
            <section className="space-y-4">
              <div className="rounded-lg border border-border bg-slate-950/30 p-4">
                <div className="grid gap-4 lg:grid-cols-4">
                  <Input label="Key" value={fieldDraft.key} onChange={(value) => setFieldDraft((current) => ({ ...current, key: value }))} placeholder="cliente" />
                  <Input label="Label" value={fieldDraft.label} onChange={(value) => setFieldDraft((current) => ({ ...current, label: value }))} placeholder="Cliente" />
                  <PortalSelect
                    label="Tipo"
                    value={fieldDraft.type}
                    onChange={(value) => setFieldDraft((current) => ({ ...current, type: value as KanbanCustomFieldType }))}
                    options={FIELD_TYPES}
                  />
                  <div className="flex items-end">
                    <PortalButton className="w-full" onClick={addField}>
                      <Plus className="h-4 w-4" />
                      Adicionar campo
                    </PortalButton>
                  </div>
                </div>
                {fieldDraft.type === "select" ? (
                  <div className="mt-4">
                    <label className="text-xs font-medium text-slate-300">Opcoes do select</label>
                    <PortalTextarea
                      className="mt-2"
                      value={fieldOptionsText}
                      onChange={(event) => setFieldOptionsText(event.target.value)}
                      placeholder={"novo=Novo\nandamento=Em andamento"}
                    />
                  </div>
                ) : null}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Toggle label="Obrigatorio" checked={fieldDraft.required} onChange={(checked) => setFieldDraft((current) => ({ ...current, required: checked }))} />
                  <Toggle label="Mostrar no card" checked={fieldDraft.showInCard} onChange={(checked) => setFieldDraft((current) => ({ ...current, showInCard: checked }))} />
                  <Toggle label="Mostrar no drawer" checked={fieldDraft.showInDrawer} onChange={(checked) => setFieldDraft((current) => ({ ...current, showInDrawer: checked }))} />
                  <Toggle label="Mostrar na TV" checked={fieldDraft.showInTv} onChange={(checked) => setFieldDraft((current) => ({ ...current, showInTv: checked }))} />
                  <Toggle label="Mostrar nos filtros" checked={fieldDraft.showInFilters} onChange={(checked) => setFieldDraft((current) => ({ ...current, showInFilters: checked }))} />
                </div>
              </div>

              <div className="space-y-2">
                {orderedFields.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-4 text-sm text-slate-400">Nenhum campo customizado configurado.</p>
                ) : (
                  orderedFields.map((field, index) => (
                    <div key={field.key} className="grid gap-3 rounded-lg border border-border bg-panel/45 p-3 md:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{field.label}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {field.key} · {field.type}
                          {field.required ? " · obrigatorio" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <IconButton label="Subir campo" disabled={index === 0} onClick={() => moveField(field.key, -1)} icon={<ArrowUp className="h-4 w-4" />} />
                        <IconButton label="Descer campo" disabled={index === orderedFields.length - 1} onClick={() => moveField(field.key, 1)} icon={<ArrowDown className="h-4 w-4" />} />
                        <IconButton label="Remover campo" onClick={() => setFieldToRemove(field)} icon={<Trash2 className="h-4 w-4" />} danger />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : null}

          {tab === "tv" ? (
            <section className="grid gap-4 md:grid-cols-2">
              <Toggle label="TV/Foco habilitada" checked={draft.tv.enabled} onChange={(checked) => setDraft((current) => ({ ...current, tv: { ...current.tv, enabled: checked } }))} />
              <PortalSelect
                label="Modo padrao"
                value={draft.tv.defaultMode}
                onChange={(value) => setDraft((current) => ({ ...current, tv: { ...current.tv, defaultMode: value as "list" | "kanban" } }))}
                options={[
                  { value: "list", label: "Lista" },
                  { value: "kanban", label: "Kanban" },
                ]}
              />
              <PortalSelect
                label="Tamanho do texto"
                value={draft.tv.textSize}
                onChange={(value) => setDraft((current) => ({ ...current, tv: { ...current.tv, textSize: value as "normal" | "large" | "xlarge" } }))}
                options={[
                  { value: "normal", label: "Normal" },
                  { value: "large", label: "Grande" },
                  { value: "xlarge", label: "Extra grande" },
                ]}
              />
              <Input
                label="Campos de subtitulo"
                value={draft.tv.subtitleFields.join(",")}
                onChange={(value) => setDraft((current) => ({ ...current, tv: { ...current.tv, subtitleFields: value.split(",").map((item) => item.trim()).filter(Boolean) } }))}
                placeholder="cliente,projeto"
              />
              <Toggle label="Mostrar prioridade" checked={draft.tv.showPriority} onChange={(checked) => setDraft((current) => ({ ...current, tv: { ...current.tv, showPriority: checked } }))} />
              <Toggle label="Mostrar responsavel" checked={draft.tv.showAssignee} onChange={(checked) => setDraft((current) => ({ ...current, tv: { ...current.tv, showAssignee: checked } }))} />
              <Toggle label="Mostrar entrega" checked={draft.tv.showDueDate} onChange={(checked) => setDraft((current) => ({ ...current, tv: { ...current.tv, showDueDate: checked } }))} />
              <Toggle label="Mostrar checklist" checked={draft.tv.showChecklist} onChange={(checked) => setDraft((current) => ({ ...current, tv: { ...current.tv, showChecklist: checked } }))} />
            </section>
          ) : null}
        </form>
      </PortalDrawer>

      <ConfirmDialog
        open={Boolean(fieldToRemove)}
        title="Remover campo customizado"
        description="Remover o campo pode ocultar dados ja preenchidos nos cards. Os valores existentes nao serao apagados nesta fase."
        destructive
        confirmLabel="Remover campo"
        onClose={() => setFieldToRemove(null)}
        onConfirm={() => {
          if (fieldToRemove) removeField(fieldToRemove.key);
          setFieldToRemove(null);
        }}
      />
    </>
  );

  function updateTerminology(key: keyof KanbanBoardConfig["terminology"], value: string) {
    setDraft((current) => ({ ...current, terminology: { ...current.terminology, [key]: value } }));
  }
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="min-w-0 space-y-2 text-xs font-medium text-slate-300">
      <span>{label}</span>
      <PortalInput value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-slate-950/40 p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-border bg-slate-950/35 p-3 text-sm text-slate-200">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-cyan" />
      <span>{label}</span>
    </label>
  );
}

function IconButton({ label, icon, disabled, onClick, danger }: { label: string; icon: ReactNode; disabled?: boolean; danger?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={danger ? "grid h-9 w-9 place-items-center rounded-md bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/20 hover:bg-rose-500/25 disabled:opacity-40" : "grid h-9 w-9 place-items-center rounded-md bg-white/5 text-slate-200 ring-1 ring-border hover:bg-white/10 disabled:opacity-40"}
    >
      {icon}
    </button>
  );
}

function nextFieldOrder(fields: KanbanCustomFieldDefinition[]) {
  return fields.length === 0 ? 10 : Math.max(...fields.map((field) => field.order ?? 0)) + 10;
}

function parseOptions(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawValue, ...labelParts] = line.split("=");
      const optionValue = rawValue.trim();
      const label = labelParts.join("=").trim() || optionValue;
      return { value: optionValue, label };
    });
}
