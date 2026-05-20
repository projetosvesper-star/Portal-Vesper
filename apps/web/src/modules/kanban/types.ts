export type UUID = string;
export type ISODateTime = string;

export type BoardType = "production" | "projects" | "operational" | "helpdesk" | "custom";

export type Priority = "low" | "medium" | "high" | "critical";

export type KanbanCustomFieldType = "text" | "textarea" | "number" | "date" | "select" | "checkbox" | "user" | "currency";

export type KanbanFieldOption = {
  value: string;
  label: string;
};

export type KanbanCustomFieldDefinition = {
  key: string;
  label: string;
  type: KanbanCustomFieldType;
  required: boolean;
  showInCard: boolean;
  showInDrawer: boolean;
  showInTv: boolean;
  showInFilters: boolean;
  order: number;
  options?: KanbanFieldOption[] | null;
};

export type KanbanTerminologyConfig = {
  itemSingular: string;
  itemPlural: string;
  newItemLabel: string;
  editItemLabel: string;
  itemTitleLabel: string;
  itemDescriptionLabel: string;
  emptyStateText: string;
};

export type KanbanVisualConfig = {
  accentColor: string;
  icon: string;
  cardDensity: "compact" | "comfortable";
};

export type KanbanFeaturesConfig = {
  checklist: boolean;
  comments: boolean;
  attachments: boolean;
  activity: boolean;
};

export type KanbanCardConfig = {
  fields: KanbanCustomFieldDefinition[];
};

export type KanbanTvConfig = {
  enabled: boolean;
  defaultMode: "list" | "kanban";
  titleField: string;
  subtitleFields: string[];
  showPriority: boolean;
  showAssignee: boolean;
  showDueDate: boolean;
  showChecklist: boolean;
  showTags: boolean;
  textSize: "normal" | "large" | "xlarge";
};

export type KanbanBoardConfig = {
  configVersion: 1;
  terminology: KanbanTerminologyConfig;
  visual: KanbanVisualConfig;
  features: KanbanFeaturesConfig;
  card: KanbanCardConfig;
  tv: KanbanTvConfig;
};

export type KanbanBoardConfigEnvelope = {
  board_id: UUID;
  config: KanbanBoardConfig;
  metadata: Record<string, unknown>;
};

export type KanbanHubContext = {
  key: string;
  name: string;
  description: string | null;
  kind: "generic" | "specialized" | "system";
  boardType: BoardType | null;
  moduleContext: string | null;
  route: string | null;
  icon: string;
  order: number;
  visible: boolean;
  isSystem: boolean;
  requiredPermission: string | null;
  deletedAt: ISODateTime | null;
};

export type KanbanTemplateColumn = {
  name: string;
  key?: string | null;
  order: number;
  isDone?: boolean;
};

export type KanbanBoardTemplate = {
  key: string;
  name: string;
  description: string | null;
  boardType: BoardType;
  moduleContext: string | null;
  icon: string;
  color: string;
  isSystem: boolean;
  isActive: boolean;
  order: number;
  columns: KanbanTemplateColumn[];
  config: KanbanBoardConfig;
  deletedAt: ISODateTime | null;
};

export type CustomFieldValue = string | number | boolean | null;
export type CustomFields = Record<string, CustomFieldValue>;

export type KanbanBoard = {
  id: UUID;
  key: string | null;
  name: string;
  description: string | null;
  board_type: BoardType;
  module_context: string | null;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  is_archived: boolean;
  created_by: UUID | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  archived_at: ISODateTime | null;
  metadata: Record<string, unknown>;
};

export type KanbanColumn = {
  id: UUID;
  board_id: UUID;
  name: string;
  key: string | null;
  description: string | null;
  order_index: number;
  color: string | null;
  wip_limit: number | null;
  is_done: boolean;
  is_active: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  metadata: Record<string, unknown>;
};

export type KanbanCardType = {
  id: UUID;
  board_id: UUID | null;
  key: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  field_schema: Record<string, unknown>;
  is_active: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type KanbanCard = {
  id: UUID;
  board_id: UUID;
  column_id: UUID;
  card_type_id: UUID | null;
  title: string;
  description: string | null;
  code: string | null;
  priority: Priority;
  status: string | null;
  order_index: number;
  due_date: ISODateTime | null;
  start_date: ISODateTime | null;
  completed_at: ISODateTime | null;
  created_by: UUID | null;
  assigned_to: UUID | null;
  is_archived: boolean;
  archived_at: ISODateTime | null;
  deleted_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  metadata: Record<string, unknown>;
};

export type KanbanCardAssignee = {
  id: UUID;
  card_id: UUID;
  user_id: UUID;
  role: string | null;
  created_at: ISODateTime;
};

export type KanbanChecklistItem = {
  id: UUID;
  card_id: UUID;
  title: string;
  description: string | null;
  is_done: boolean;
  order_index: number;
  done_by: UUID | null;
  done_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type KanbanComment = {
  id: UUID;
  card_id: UUID;
  user_id: UUID;
  content: string;
  edited_at: ISODateTime | null;
  deleted_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type KanbanAttachment = {
  id: UUID;
  card_id: UUID;
  file_id: UUID;
  uploaded_by: UUID | null;
  created_at: ISODateTime;
};

export type KanbanActivityLog = {
  id: UUID;
  board_id: UUID | null;
  card_id: UUID | null;
  user_id: UUID | null;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: ISODateTime;
};

// -------------------------
// Payloads (requests)
// -------------------------

export type CreateBoardPayload = {
  key?: string | null;
  name: string;
  description?: string | null;
  board_type: BoardType;
  module_context?: string | null;
  color?: string | null;
  icon?: string | null;
  metadata?: Record<string, unknown>;
};

export type CreateContextPayload = Omit<KanbanHubContext, "isSystem" | "deletedAt">;
export type UpdateContextPayload = Partial<Omit<KanbanHubContext, "key" | "isSystem" | "deletedAt">>;
export type ReorderContextsPayload = { contexts: Array<{ key: string; order: number }> };

export type CreateTemplatePayload = Omit<KanbanBoardTemplate, "isSystem" | "isActive" | "deletedAt">;
export type UpdateTemplatePayload = Partial<Omit<KanbanBoardTemplate, "key" | "isSystem" | "deletedAt">>;
export type DuplicateTemplatePayload = { key?: string | null; name?: string | null };
export type CreateBoardFromTemplatePayload = {
  templateKey: string;
  name: string;
  description?: string | null;
  contextKey?: string | null;
};

export type UpdateBoardPayload = {
  name?: string | null;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  is_active?: boolean | null;
  metadata?: Record<string, unknown> | null;
};

export type CreateColumnPayload = {
  name: string;
  key?: string | null;
  description?: string | null;
  order_index: number;
  color?: string | null;
  wip_limit?: number | null;
  is_done?: boolean;
  metadata?: Record<string, unknown>;
};

export type UpdateColumnPayload = {
  name?: string | null;
  description?: string | null;
  order_index?: number | null;
  color?: string | null;
  wip_limit?: number | null;
  is_done?: boolean | null;
  is_active?: boolean | null;
  metadata?: Record<string, unknown> | null;
};

export type ReorderColumnsPayload = {
  columns: Array<{ column_id: UUID; order_index: number }>;
};

export type CreateCardPayload = {
  board_id: UUID;
  column_id: UUID;
  card_type_id?: UUID | null;
  title: string;
  description?: string | null;
  code?: string | null;
  priority?: Priority;
  status?: string | null;
  order_index?: number;
  due_date?: ISODateTime | null;
  start_date?: ISODateTime | null;
  assigned_to?: UUID | null;
  metadata?: Record<string, unknown>;
};

export type UpdateCardPayload = {
  title?: string | null;
  description?: string | null;
  code?: string | null;
  priority?: Priority | null;
  status?: string | null;
  order_index?: number | null;
  due_date?: ISODateTime | null;
  start_date?: ISODateTime | null;
  assigned_to?: UUID | null;
  metadata?: Record<string, unknown> | null;
};

export type MoveCardPayload = {
  to_column_id: UUID;
  new_order_index: number;
};

export type CreateChecklistItemPayload = {
  title: string;
  description?: string | null;
  order_index?: number;
};

export type UpdateChecklistItemPayload = {
  title?: string | null;
  description?: string | null;
  is_done?: boolean | null;
  order_index?: number | null;
};

export type CreateCommentPayload = {
  content: string;
};

export type UpdateCommentPayload = {
  content: string;
};

export type AttachFilePayload = {
  file_id: UUID;
};
