export type UUID = string;
export type ISODate = string;
export type ISODateTime = string;

export type ProductionPriority = "baixa" | "normal" | "alta" | "urgente";
export type ProductionStatus = "aberta" | "em_andamento" | "aguardando" | "pronta" | "arquivada";

export type ProductionOrder = {
  id: UUID;
  card_id: UUID;
  board_id: UUID;
  numero_op: string;
  cliente: string | null;
  projeto: string | null;
  modelo: string | null;
  quantidade: number | null;
  setor: string | null;
  data_inicio: ISODate | null;
  data_entrega: ISODate | null;
  prioridade: ProductionPriority;
  status: ProductionStatus;
  percentual_checklist: string;
  observacoes?: string | null;
  is_archived: boolean;
  deleted_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  metadata: Record<string, unknown>;
};

export type ProductionChecklistItem = {
  id: UUID;
  production_order_id: UUID;
  title: string;
  description: string | null;
  order_index: number;
  is_required: boolean;
  is_done: boolean;
  done_by: UUID | null;
  done_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  metadata: Record<string, unknown>;
};

export type ProductionTemplateItem = {
  id: UUID;
  template_id: UUID;
  title: string;
  description: string | null;
  order_index: number;
  is_required: boolean;
  metadata: Record<string, unknown>;
};

export type ProductionTemplate = {
  id: UUID;
  name: string;
  description: string | null;
  template_type: "producao" | "projeto" | "custom";
  is_default: boolean;
  is_active: boolean;
  items: ProductionTemplateItem[];
};

export type ProductionDashboard = {
  total_ops: number;
  abertas: number;
  em_andamento: number;
  aguardando: number;
  prontas: number;
  arquivadas: number;
  percentual_medio_checklist: string;
};

export type ProductionTVItem = {
  numero_op: string;
  cliente: string | null;
  projeto: string | null;
  modelo: string | null;
  status: ProductionStatus;
  prioridade: ProductionPriority;
  percentual_checklist: string;
  data_entrega: ISODate | null;
  card_id: UUID;
  column_id: UUID;
};

export type ProductionTVResponse = {
  mode: "list" | "kanban";
  items: ProductionTVItem[] | Record<string, ProductionTVItem[]>;
};

export type ProductionActivity = {
  id: UUID;
  production_order_id: UUID | null;
  card_id: UUID | null;
  user_id: UUID | null;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: ISODateTime;
};

export type CreateProductionOrderPayload = {
  numero_op: string;
  cliente?: string | null;
  projeto?: string | null;
  modelo?: string | null;
  quantidade?: number | null;
  setor?: string | null;
  data_inicio?: ISODate | null;
  data_entrega?: ISODate | null;
  prioridade?: ProductionPriority;
  status?: ProductionStatus;
  observacoes?: string | null;
  checklist_template_id?: UUID | null;
  metadata?: Record<string, unknown>;
};
