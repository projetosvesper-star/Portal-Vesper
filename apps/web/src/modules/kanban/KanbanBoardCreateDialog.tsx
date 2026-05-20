import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

import { ErrorState, PortalButton, PortalDialog, PortalInput, PortalSelect, PortalTextarea } from "../../shared/ui";
import { FALLBACK_TEMPLATES } from "./hubConfig";
import type { BoardType, CreateBoardFromTemplatePayload, CreateBoardPayload, KanbanBoard, KanbanBoardTemplate, KanbanHubContext } from "./types";

export type InitialColumnsPreset = "basic" | "projects" | "ti" | "custom";

export type BoardCreateValues = (CreateBoardPayload & { initial_columns: string[] }) | (CreateBoardFromTemplatePayload & { fromTemplate: true });

const presetColumns: Record<InitialColumnsPreset, string[]> = {
  basic: ["A fazer", "Em andamento", "Revisão", "Concluído"],
  projects: ["Backlog", "Planejamento", "Em execução", "Validação", "Entregue"],
  ti: ["Aberto", "Em atendimento", "Aguardando", "Resolvido", "Fechado"],
  custom: [],
};

const boardTypeOptions = [
  { value: "projects", label: "Projetos" },
  { value: "operational", label: "Operacional" },
  { value: "helpdesk", label: "HelpDesk" },
  { value: "custom", label: "Personalizado" },
  { value: "production", label: "Produção" },
];

const contextOptions = [
  { value: "projetos", label: "Projetos" },
  { value: "ti", label: "TI" },
  { value: "operacional", label: "Operacional" },
  { value: "compras", label: "Compras" },
  { value: "manutencao", label: "Manutenção" },
  { value: "outro", label: "Outro" },
];

const presetOptions = [
  { value: "basic", label: "Básico", description: "A fazer, Em andamento, Revisão, Concluído" },
  { value: "projects", label: "Projetos", description: "Backlog, Planejamento, Execução, Validação, Entregue" },
  { value: "ti", label: "TI", description: "Aberto, Atendimento, Aguardando, Resolvido, Fechado" },
  { value: "custom", label: "Personalizado", description: "Informe as colunas manualmente" },
];

export function KanbanBoardCreateDialog({
  open,
  initialBoardType = "projects",
  initialModuleContext = "projetos",
  onClose,
  onSubmit,
  templates = FALLBACK_TEMPLATES,
  contexts = [],
}: {
  open: boolean;
  initialBoardType?: BoardType;
  initialModuleContext?: string;
  onClose: () => void;
  onSubmit: (values: BoardCreateValues) => Promise<KanbanBoard>;
  templates?: KanbanBoardTemplate[];
  contexts?: KanbanHubContext[];
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [boardType, setBoardType] = useState<BoardType>(initialBoardType);
  const [moduleContext, setModuleContext] = useState(initialModuleContext);
  const [color, setColor] = useState("#38d3ee");
  const [icon, setIcon] = useState("KanbanSquare");
  const [preset, setPreset] = useState<InitialColumnsPreset>(initialBoardType === "projects" ? "projects" : initialModuleContext === "ti" ? "ti" : "basic");
  const [templateKey, setTemplateKey] = useState("basico");
  const [customColumns, setCustomColumns] = useState("A fazer\nEm andamento\nConcluído");
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBoardType(initialBoardType);
    setModuleContext(initialModuleContext);
    setPreset(initialBoardType === "projects" ? "projects" : initialModuleContext === "ti" ? "ti" : "basic");
    setTemplateKey(templates.find((template) => template.moduleContext === initialModuleContext)?.key ?? templates[0]?.key ?? "basico");
  }, [initialBoardType, initialModuleContext, open]);

  const activeTemplates = useMemo(() => templates.filter((template) => template.isActive && !template.deletedAt).sort((a, b) => a.order - b.order), [templates]);
  const selectedTemplate = activeTemplates.find((template) => template.key === templateKey) ?? null;

  const columns = useMemo(() => {
    if (preset === "custom") {
      return customColumns
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return presetColumns[preset];
  }, [customColumns, preset]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError(new Error("Informe o nome do quadro."));
      return;
    }
    if (!selectedTemplate && columns.length === 0) {
      setError(new Error("Informe pelo menos uma coluna inicial."));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (selectedTemplate) {
        await onSubmit({
          fromTemplate: true,
          templateKey: selectedTemplate.key,
          contextKey: contexts.find((context) => context.moduleContext === (selectedTemplate.moduleContext ?? moduleContext))?.key ?? null,
          name: name.trim(),
          description: description.trim() || selectedTemplate.description,
        });
      } else {
        await onSubmit({
          name: name.trim(),
          description: description.trim() || null,
          board_type: boardType,
          module_context: moduleContext || null,
          color: color || null,
          icon: icon.trim() || null,
          metadata: { created_from: "kanban_hub" },
          initial_columns: columns,
        });
      }
      setName("");
      setDescription("");
      setCustomColumns("A fazer\nEm andamento\nConcluído");
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PortalDialog
      open={open}
      title="Novo quadro"
      description="Crie um quadro genérico usando o Kanban Engine."
      onClose={onClose}
      footer={
        <>
          <PortalButton variant="secondary" onClick={onClose}>
            Cancelar
          </PortalButton>
          <PortalButton form="kanban-board-create-form" type="submit" disabled={submitting}>
            Criar quadro
          </PortalButton>
        </>
      }
    >
      <form id="kanban-board-create-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome">
            <PortalInput required value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <PortalSelect
            label="Template"
            value={selectedTemplate?.key ?? "manual"}
            onChange={setTemplateKey}
            options={[
              { value: "manual", label: "Manual", description: "Criar quadro com colunas informadas na tela." },
              ...activeTemplates.map((template) => ({
                value: template.key,
                label: template.name,
                description: template.description ?? `${template.columns.length} colunas`,
              })),
            ]}
          />
          <PortalSelect label="Tipo" value={boardType} onChange={(value) => setBoardType(value as BoardType)} options={boardTypeOptions} />
          <PortalSelect label="Contexto" value={moduleContext} onChange={setModuleContext} options={contextOptions} />
          {!selectedTemplate ? <PortalSelect label="Colunas iniciais" value={preset} onChange={(value) => setPreset(value as InitialColumnsPreset)} options={presetOptions} /> : null}
          <Field label="Cor">
            <PortalInput value={color} onChange={(event) => setColor(event.target.value)} />
          </Field>
          <Field label="Ícone">
            <PortalInput value={icon} onChange={(event) => setIcon(event.target.value)} />
          </Field>
          <Field label="Descrição" className="sm:col-span-2">
            <PortalTextarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          {selectedTemplate ? (
            <div className="rounded-lg border border-border bg-slate-950/40 p-3 text-sm text-slate-300 sm:col-span-2">
              <p className="font-semibold text-white">Preview do template</p>
              <p className="mt-1 text-xs text-slate-400">
                {selectedTemplate.config.terminology.itemPlural} · {selectedTemplate.columns.map((column) => column.name).join(" / ")}
              </p>
            </div>
          ) : preset === "custom" ? (
            <Field label="Colunas personalizadas, uma por linha" className="sm:col-span-2">
              <PortalTextarea className="min-h-28" value={customColumns} onChange={(event) => setCustomColumns(event.target.value)} />
            </Field>
          ) : null}
        </div>

        {error ? <ErrorState error={error} title="Falha ao criar quadro" fallback="Falha ao criar quadro." /> : null}
      </form>
    </PortalDialog>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={`space-y-1 text-sm text-slate-300 ${className ?? ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
