import { type ReactNode, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Plus, RotateCcw, Save, Trash2 } from "lucide-react";

import { ErrorState, PortalButton, PortalDrawer, PortalInput, PortalSelect, PortalTabs, PortalTextarea, SectionCard } from "../../shared/ui";
import {
  createContext,
  createTemplate,
  deleteContext,
  deleteTemplate,
  duplicateTemplate,
  reorderContexts,
  restoreDefaultContexts,
  restoreTemplate,
  updateContext,
  updateTemplate,
} from "./api";
import { FALLBACK_TEMPLATES } from "./hubConfig";
import { useKanbanTemplates } from "./hooks";
import { DEFAULT_BOARD_CONFIG } from "./config";
import { kanbanQueryKeys } from "./queryKeys";
import type { BoardType, KanbanBoardTemplate, KanbanHubContext } from "./types";

type TabKey = "contextos" | "templates" | "padroes" | "atividade";

type Props = {
  open: boolean;
  onClose: () => void;
  contexts: KanbanHubContext[];
  templates: KanbanBoardTemplate[];
};

const BOARD_TYPE_OPTIONS = [
  { value: "projects", label: "Projetos" },
  { value: "operational", label: "Operacional" },
  { value: "helpdesk", label: "HelpDesk" },
  { value: "custom", label: "Personalizado" },
];

export function KanbanHubConfigDialog({ open, onClose, contexts, templates }: Props) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>("contextos");
  const [error, setError] = useState<unknown>(null);
  const [contextDraft, setContextDraft] = useState({ key: "", name: "", description: "", boardType: "custom" as BoardType, moduleContext: "" });
  const [templateDraft, setTemplateDraft] = useState({
    key: "",
    name: "",
    description: "",
    boardType: "custom" as BoardType,
    moduleContext: "outro",
    itemSingular: "Item",
    itemPlural: "Itens",
    newItemLabel: "Novo item",
    columns: "A fazer\nEm andamento\nConcluido",
  });
  const [editingTemplateKey, setEditingTemplateKey] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState("");

  // Usar query interna quando o dialog está aberto para refletir imediatamente
  // qualquer mutação (duplicate, archive, create) sem depender do ciclo de re-render do pai.
  const templatesQuery = useKanbanTemplates();
  const liveTemplates = (templatesQuery.data && templatesQuery.data.length > 0 ? templatesQuery.data : templates.length > 0 ? templates : FALLBACK_TEMPLATES);

  const activeTemplates = useMemo(() => liveTemplates.slice().sort((a, b) => a.order - b.order), [liveTemplates]);
  const orderedContexts = useMemo(() => contexts.slice().sort((a, b) => a.order - b.order), [contexts]);

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.contexts() }),
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.templates() }),
      queryClient.invalidateQueries({ queryKey: kanbanQueryKeys.boards() }),
    ]);
  };

  const actionMutation = useMutation({
    mutationFn: async (operation: () => Promise<unknown>) => operation(),
    onSuccess: invalidate,
    onError: setError,
  });

  // Mutação especializada para duplicar template: injeta o resultado no cache
  // imediatamente (sem aguardar refetch) para que a UI atualize na hora.
  const duplicateMutation = useMutation({
    mutationFn: (args: { templateKey: string; key: string; name: string }) =>
      duplicateTemplate(args.templateKey, { key: args.key, name: args.name }),
    onSuccess: (newTemplate) => {
      // Injetar imediatamente no cache antes do refetch
      queryClient.setQueryData<KanbanBoardTemplate[]>(
        kanbanQueryKeys.templates(),
        (old) => (old ? [...old, newTemplate] : [newTemplate]),
      );
      void invalidate();
    },
    onError: setError,
  });

  function run(operation: () => Promise<unknown>) {
    setError(null);
    actionMutation.mutate(operation);
  }

  function addContext() {
    const key = slugify(contextDraft.key || contextDraft.name);
    run(async () => {
      await createContext({
        key,
        name: contextDraft.name.trim(),
        description: contextDraft.description.trim() || null,
        kind: "generic",
        boardType: contextDraft.boardType,
        moduleContext: contextDraft.moduleContext.trim() || key,
        route: null,
        icon: "KanbanSquare",
        order: (orderedContexts[orderedContexts.length - 1]?.order ?? 0) + 10,
        visible: true,
        requiredPermission: "kanban.board.view",
      });
      setContextDraft({ key: "", name: "", description: "", boardType: "custom", moduleContext: "" });
    });
  }

  function moveContext(context: KanbanHubContext, direction: -1 | 1) {
    const list = orderedContexts.slice();
    const index = list.findIndex((item) => item.key === context.key);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= list.length) return;
    [list[index], list[next]] = [list[next], list[index]];
    run(() => reorderContexts({ contexts: list.map((item, idx) => ({ key: item.key, order: (idx + 1) * 10 })) }));
  }

  function addTemplate() {
    const columns = parseColumns(templateDraft.columns);
    run(async () => {
      await createTemplate({
        key: slugify(templateDraft.key || templateDraft.name),
        name: templateDraft.name.trim(),
        description: templateDraft.description.trim() || null,
        boardType: templateDraft.boardType,
        moduleContext: templateDraft.moduleContext.trim() || null,
        icon: "KanbanSquare",
        color: "#38d3ee",
        order: (activeTemplates[activeTemplates.length - 1]?.order ?? 0) + 10,
        columns,
        config: {
          ...DEFAULT_BOARD_CONFIG,
          terminology: {
            ...DEFAULT_BOARD_CONFIG.terminology,
            itemSingular: templateDraft.itemSingular,
            itemPlural: templateDraft.itemPlural,
            newItemLabel: templateDraft.newItemLabel,
          },
        },
      });
      setTemplateDraft({
        key: "",
        name: "",
        description: "",
        boardType: "custom",
        moduleContext: "outro",
        itemSingular: "Item",
        itemPlural: "Itens",
        newItemLabel: "Novo item",
        columns: "A fazer\nEm andamento\nConcluido",
      });
    });
  }

  return (
    <PortalDrawer open={open} title="Configurar Kanban" description="Contextos e templates persistentes do Hub Kanban." onClose={onClose} widthClassName="max-w-5xl">
      <div className="space-y-5">
        <PortalTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "contextos", label: "Contextos" },
            { value: "templates", label: "Templates" },
            { value: "padroes", label: "Padroes" },
            { value: "atividade", label: "Atividade" },
          ]}
        />

        {error ? <ErrorState error={error} title="Falha ao configurar Kanban" fallback="A operacao nao foi concluida." /> : null}

        {tab === "contextos" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-3">
              {orderedContexts.map((context, index) => (
                <SectionCard key={context.key} className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{context.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{context.description}</p>
                      <p className="mt-1 text-xs text-slate-500">{context.key} · {context.kind} · ordem {context.order}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <IconButton label={`Subir ${context.name}`} disabled={index === 0 || actionMutation.isPending} onClick={() => moveContext(context, -1)} icon={<ArrowUp className="h-4 w-4" />} />
                      <IconButton label={`Descer ${context.name}`} disabled={index === orderedContexts.length - 1 || actionMutation.isPending} onClick={() => moveContext(context, 1)} icon={<ArrowDown className="h-4 w-4" />} />
                      <PortalButton
                        variant="secondary"
                        disabled={actionMutation.isPending}
                        onClick={() => run(() => updateContext(context.key, { visible: !context.visible }))}
                      >
                        {context.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {context.visible ? `Ocultar ${context.name}` : `Reativar ${context.name}`}
                      </PortalButton>
                      {!context.isSystem ? (
                        <PortalButton variant="danger" disabled={actionMutation.isPending} onClick={() => run(() => deleteContext(context.key))}>
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </PortalButton>
                      ) : null}
                    </div>
                  </div>
                </SectionCard>
              ))}
            </div>

            <SectionCard className="space-y-3 p-4">
              <h3 className="font-semibold text-white">Novo contexto</h3>
              <LabeledInput label="Key" value={contextDraft.key} onChange={(value) => setContextDraft((current) => ({ ...current, key: value }))} placeholder="manutencao" />
              <LabeledInput label="Nome" value={contextDraft.name} onChange={(value) => setContextDraft((current) => ({ ...current, name: value }))} placeholder="Manutencao" />
              <LabeledInput label="Descricao" value={contextDraft.description} onChange={(value) => setContextDraft((current) => ({ ...current, description: value }))} />
              <PortalSelect label="Tipo de board" value={contextDraft.boardType} onChange={(value) => setContextDraft((current) => ({ ...current, boardType: value as BoardType }))} options={BOARD_TYPE_OPTIONS} />
              <LabeledInput label="Module context" value={contextDraft.moduleContext} onChange={(value) => setContextDraft((current) => ({ ...current, moduleContext: value }))} placeholder="manutencao" />
              <PortalButton className="w-full" onClick={addContext} disabled={!contextDraft.name.trim() || actionMutation.isPending}>
                <Plus className="h-4 w-4" />
                Criar contexto
              </PortalButton>
            </SectionCard>
          </div>
        ) : null}

        {tab === "templates" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-3">
              {activeTemplates.map((template) => (
                <SectionCard key={template.key} className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      {editingTemplateKey === template.key ? (
                        <div className="flex gap-2">
                          <PortalInput value={editingTemplateName} onChange={(event) => setEditingTemplateName(event.target.value)} aria-label="Nome do template" />
                          <PortalButton onClick={() => run(() => updateTemplate(template.key, { name: editingTemplateName.trim() || template.name }))}>
                            <Save className="h-4 w-4" />
                            Salvar
                          </PortalButton>
                        </div>
                      ) : (
                        <p className="font-semibold text-white">{template.name}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">{template.description}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {template.key} · {template.boardType} · {template.columns.length} colunas · {template.isActive ? "ativo" : "inativo"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <PortalButton
                        variant="secondary"
                        disabled={actionMutation.isPending}
                        onClick={() => {
                          setEditingTemplateKey(template.key);
                          setEditingTemplateName(template.name);
                        }}
                      >
                        Editar template
                      </PortalButton>
                      <PortalButton
                        variant="secondary"
                        disabled={actionMutation.isPending || duplicateMutation.isPending}
                        onClick={() =>
                          duplicateMutation.mutate({
                            templateKey: template.key,
                            key: `${template.key}_copia_${Date.now()}`,
                            name: `${template.name} copia`,
                          })
                        }
                      >
                        <Copy className="h-4 w-4" />
                        Duplicar
                      </PortalButton>
                      {template.isActive ? (
                        <PortalButton variant="secondary" disabled={actionMutation.isPending} onClick={() => run(() => deleteTemplate(template.key))}>
                          Arquivar
                        </PortalButton>
                      ) : (
                        <PortalButton variant="secondary" disabled={actionMutation.isPending} onClick={() => run(() => restoreTemplate(template.key))}>
                          Restaurar
                        </PortalButton>
                      )}
                    </div>
                  </div>
                </SectionCard>
              ))}
            </div>

            <SectionCard className="space-y-3 p-4">
              <h3 className="font-semibold text-white">Novo template</h3>
              <LabeledInput label="Key" value={templateDraft.key} onChange={(value) => setTemplateDraft((current) => ({ ...current, key: value }))} placeholder="auditoria" />
              <LabeledInput label="Nome" value={templateDraft.name} onChange={(value) => setTemplateDraft((current) => ({ ...current, name: value }))} placeholder="Auditoria" />
              <LabeledInput label="Descricao" value={templateDraft.description} onChange={(value) => setTemplateDraft((current) => ({ ...current, description: value }))} />
              <PortalSelect label="Tipo de board" value={templateDraft.boardType} onChange={(value) => setTemplateDraft((current) => ({ ...current, boardType: value as BoardType }))} options={BOARD_TYPE_OPTIONS} />
              <LabeledInput label="Contexto" value={templateDraft.moduleContext} onChange={(value) => setTemplateDraft((current) => ({ ...current, moduleContext: value }))} />
              <LabeledInput label="Singular" value={templateDraft.itemSingular} onChange={(value) => setTemplateDraft((current) => ({ ...current, itemSingular: value }))} />
              <LabeledInput label="Plural" value={templateDraft.itemPlural} onChange={(value) => setTemplateDraft((current) => ({ ...current, itemPlural: value }))} />
              <LabeledInput label="Botao" value={templateDraft.newItemLabel} onChange={(value) => setTemplateDraft((current) => ({ ...current, newItemLabel: value }))} />
              <label className="space-y-1 text-sm text-slate-300">
                <span>Colunas</span>
                <PortalTextarea className="min-h-24" value={templateDraft.columns} onChange={(event) => setTemplateDraft((current) => ({ ...current, columns: event.target.value }))} />
              </label>
              <PortalButton className="w-full" onClick={addTemplate} disabled={!templateDraft.name.trim() || actionMutation.isPending}>
                <Plus className="h-4 w-4" />
                Criar template
              </PortalButton>
            </SectionCard>
          </div>
        ) : null}

        {tab === "padroes" ? (
          <SectionCard className="space-y-3 p-4">
            <h3 className="font-semibold text-white">Restaurar padroes</h3>
            <p className="text-sm text-slate-400">Restaura contextos de sistema e preserva contextos customizados.</p>
            <PortalButton variant="secondary" onClick={() => run(() => restoreDefaultContexts())}>
              <RotateCcw className="h-4 w-4" />
              Restaurar contextos padrao
            </PortalButton>
          </SectionCard>
        ) : null}

        {tab === "atividade" ? (
          <SectionCard className="p-4">
            <h3 className="font-semibold text-white">Atividade</h3>
            <p className="mt-2 text-sm text-slate-400">A atividade administrativa detalhada do Hub sera conectada a um endpoint dedicado em fase futura. As alteracoes ja geram audit log global e eventos WebSocket.</p>
          </SectionCard>
        ) : null}
      </div>
    </PortalDrawer>
  );
}

function LabeledInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="space-y-1 text-sm text-slate-300">
      <span>{label}</span>
      <PortalInput value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function IconButton({ label, icon, disabled, onClick }: { label: string; icon: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-md bg-white/5 text-slate-200 ring-1 ring-border hover:bg-white/10 disabled:opacity-40"
    >
      {icon}
    </button>
  );
}

function parseColumns(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name, index) => ({ name, key: slugify(name), order: (index + 1) * 10, isDone: index === value.split(/\r?\n/).filter(Boolean).length - 1 }));
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}
