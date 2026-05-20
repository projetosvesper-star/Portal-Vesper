import type { CustomFields, KanbanBoard, KanbanBoardConfig, KanbanCustomFieldDefinition, KanbanFieldOption } from "./types";

export const DEFAULT_BOARD_CONFIG: KanbanBoardConfig = {
  configVersion: 1,
  terminology: {
    itemSingular: "Card",
    itemPlural: "Cards",
    newItemLabel: "Novo card",
    editItemLabel: "Editar card",
    itemTitleLabel: "Titulo",
    itemDescriptionLabel: "Descricao",
    emptyStateText: "Nenhum card encontrado",
  },
  visual: {
    accentColor: "#38d3ee",
    icon: "KanbanSquare",
    cardDensity: "comfortable",
  },
  features: {
    checklist: true,
    comments: true,
    attachments: true,
    activity: true,
  },
  card: {
    fields: [],
  },
  tv: {
    enabled: true,
    defaultMode: "kanban",
    titleField: "title",
    subtitleFields: [],
    showPriority: true,
    showAssignee: true,
    showDueDate: true,
    showChecklist: true,
    showTags: true,
    textSize: "large",
  },
};

export function normalizeBoardConfig(board?: KanbanBoard | null): KanbanBoardConfig {
  const raw = board?.metadata?.config;
  if (!isRecord(raw)) return DEFAULT_BOARD_CONFIG;
  const merged: KanbanBoardConfig = {
    ...DEFAULT_BOARD_CONFIG,
    ...raw,
    configVersion: 1,
    terminology: { ...DEFAULT_BOARD_CONFIG.terminology, ...(isRecord(raw.terminology) ? raw.terminology : {}) },
    visual: { ...DEFAULT_BOARD_CONFIG.visual, ...(isRecord(raw.visual) ? raw.visual : {}) },
    features: { ...DEFAULT_BOARD_CONFIG.features, ...(isRecord(raw.features) ? raw.features : {}) },
    card: {
      fields: Array.isArray((raw.card as any)?.fields)
        ? ((raw.card as any).fields as KanbanCustomFieldDefinition[]).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : [],
    },
    tv: { ...DEFAULT_BOARD_CONFIG.tv, ...(isRecord(raw.tv) ? raw.tv : {}) },
  };
  return merged;
}

export function getCardCustomFields(metadata?: Record<string, unknown> | null): CustomFields {
  const raw = metadata?.customFields;
  if (!isRecord(raw)) return {};
  return raw as CustomFields;
}

export function formatCustomFieldValue(field: KanbanCustomFieldDefinition, value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (field.type === "checkbox") return value ? "Sim" : "Nao";
  if (field.type === "currency") {
    const cents = typeof value === "number" ? value : Number.parseInt(String(value), 10);
    if (!Number.isFinite(cents)) return "-";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  }
  if (field.type === "select") {
    const option = (field.options ?? []).find((item: KanbanFieldOption) => item.value === value);
    return option?.label ?? String(value);
  }
  if (field.type === "date") {
    const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleDateString("pt-BR");
  }
  return String(value);
}

export function parseCurrencyToCents(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number.parseInt(digits, 10) : null;
}

export function formatCentsInput(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  const cents = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(cents)) return "";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
