import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { ArrowDown, ArrowUp, Columns3, Factory, List, MonitorUp, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Children, FormEvent, isValidElement, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../../shared/components/Button";
import { useToast } from "../../shared/components/ToastProvider";
import { getApiErrorMessage } from "../../shared/api/errors";
import { usePortalWebSocketContext } from "../../shared/hooks/usePortalWebSocket";
import { ErrorState, PortalSelect } from "../../shared/ui";
import { listBoards } from "../kanban/api";
import { DEFAULT_BOARD_CONFIG, normalizeBoardConfig } from "../kanban/config";
import {
  createProductionChecklistItem,
  createProductionOrder,
  deleteProductionChecklistItem,
  getProductionDashboard,
  getProductionTVPreview,
  listProductionChecklist,
  listProductionOrders,
  listProductionTemplates,
  reorderProductionChecklistItems,
  updateProductionChecklistItem,
} from "./api";
import ProductionOrderDrawer from "./ProductionOrderDrawer";
import productionQueryKeys from "./queryKeys";
import type {
  CreateProductionOrderPayload,
  ProductionChecklistItem,
  ProductionOrder,
  ProductionPriority,
  ProductionStatus,
  ProductionTVItem,
  ProductionTVResponse,
} from "./types";

const PRODUCTION_TERMINOLOGY = {
  ...DEFAULT_BOARD_CONFIG.terminology,
  itemSingular: "OP",
  itemPlural: "OPs",
  newItemLabel: "Nova OP",
  editItemLabel: "Editar OP",
  itemTitleLabel: "Numero OP",
  itemDescriptionLabel: "Observacoes",
  emptyStateText: "Nenhuma OP encontrada.",
};

export function KanbanProducaoPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [tvMode, setTvMode] = useState<ProductionTVResponse["mode"]>("list");
  const [form, setForm] = useState<CreateProductionOrderPayload>(emptyOrderForm);

  const dashboardQuery = useQuery({ queryKey: productionQueryKeys.dashboard, queryFn: getProductionDashboard });
  const ordersQuery = useQuery({ queryKey: productionQueryKeys.orders, queryFn: listProductionOrders });
  const templatesQuery = useQuery({ queryKey: productionQueryKeys.templates, queryFn: listProductionTemplates });
  const tvQuery = useQuery<ProductionTVResponse>({
    queryKey: productionQueryKeys.tvByMode(tvMode),
    queryFn: () => getProductionTVPreview(tvMode),
  });
  const boardsQuery = useQuery({ queryKey: ["kanban", "boards", "production-config"], queryFn: () => listBoards() });
  const productionBoard = useMemo(() => {
    const boards = boardsQuery.data ?? [];
    const defaults = boards.filter((board) => board.metadata?.systemKey === "kanban_producao" && board.metadata?.isDefaultProductionBoard === true);
    if (defaults.length === 1) return defaults[0];
    const system = boards.filter((board) => board.metadata?.systemKey === "kanban_producao");
    if (system.length === 1) return system[0];
    const fallback = boards.filter((board) => board.board_type === "production" && board.module_context === "producao");
    return fallback.length === 1 ? fallback[0] : null;
  }, [boardsQuery.data]);
  const productionBoardConfig = normalizeBoardConfig(productionBoard);
  const rawProductionConfig =
    productionBoard?.metadata && typeof productionBoard.metadata === "object" && "config" in productionBoard.metadata
      ? (productionBoard.metadata.config as Record<string, unknown> | undefined)
      : undefined;
  const rawTerminology =
    rawProductionConfig && typeof rawProductionConfig === "object" && "terminology" in rawProductionConfig
      ? (rawProductionConfig.terminology as Record<string, unknown> | undefined)
      : undefined;
  const hasCustomProductionTerminology =
    Boolean(rawTerminology) && productionBoardConfig.terminology.newItemLabel !== DEFAULT_BOARD_CONFIG.terminology.newItemLabel;
  const terminology = hasCustomProductionTerminology ? productionBoardConfig.terminology : PRODUCTION_TERMINOLOGY;

  const orders = ordersQuery.data ?? [];
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null,
    [orders, selectedOrderId],
  );

  const checklistQuery = useQuery({
    queryKey: productionQueryKeys.checklist(selectedOrder?.id ?? null),
    queryFn: () => listProductionChecklist(selectedOrder?.id as string),
    enabled: Boolean(selectedOrder?.id),
  });

  const checklistItemsSorted = useMemo(
    () => ((checklistQuery.data ?? []) as ProductionChecklistItem[]).slice().sort((a, b) => a.order_index - b.order_index),
    [checklistQuery.data],
  );

  const tvItems = useMemo(() => {
    if (!tvQuery.data || tvMode !== "list" || !Array.isArray(tvQuery.data.items)) return [] as ProductionTVItem[];
    return tvQuery.data.items as ProductionTVItem[];
  }, [tvMode, tvQuery.data]);

  const tvKanbanColumns = useMemo(() => {
    if (!tvQuery.data || tvMode !== "kanban" || Array.isArray(tvQuery.data.items)) return {} as Record<string, ProductionTVItem[]>;
    return tvQuery.data.items as Record<string, ProductionTVItem[]>;
  }, [tvMode, tvQuery.data]);

  const invalidateProductionData = useCallback(
    async (orderId?: string | null) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productionQueryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: productionQueryKeys.orders }),
        queryClient.invalidateQueries({ queryKey: productionQueryKeys.tv }),
        queryClient.invalidateQueries({ queryKey: productionQueryKeys.templates }),
        orderId ? queryClient.invalidateQueries({ queryKey: productionQueryKeys.orderDetail(orderId) }) : Promise.resolve(),
        orderId ? queryClient.invalidateQueries({ queryKey: productionQueryKeys.checklist(orderId) }) : Promise.resolve(),
        orderId ? queryClient.invalidateQueries({ queryKey: productionQueryKeys.activity(orderId) }) : Promise.resolve(),
      ]);
    },
    [queryClient],
  );

  const { subscribe } = usePortalWebSocketContext();
  const wsTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (!event?.type?.startsWith("kanban_producao.")) return;
      if (wsTimerRef.current) window.clearTimeout(wsTimerRef.current);
      wsTimerRef.current = window.setTimeout(() => {
        void invalidateProductionData(selectedOrder?.id ?? null);
        wsTimerRef.current = null;
      }, 250);
    });

    return () => {
      unsubscribe();
      if (wsTimerRef.current) window.clearTimeout(wsTimerRef.current);
    };
  }, [invalidateProductionData, selectedOrder?.id, subscribe]);

  const createOrderMutation = useMutation({
    mutationFn: createProductionOrder,
    onSuccess: async (order) => {
      toast.success("OP criada", "A ordem foi vinculada ao Kanban Engine.");
      setFormError(null);
      setShowForm(false);
      setDrawerOpen(true);
      setSelectedOrderId(order.id);
      setForm(emptyOrderForm);
      await invalidateProductionData(order.id);
    },
    onError: (err) => {
      const message = (err as Error).message || "Erro ao criar OP";
      setFormError(message);
      toast.error("Falha ao criar OP", message);
    },
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: ({ itemId, isDone }: { itemId: string; isDone: boolean }) => updateProductionChecklistItem(itemId, { is_done: isDone }),
    onSuccess: async () => invalidateProductionData(selectedOrder?.id ?? null),
    onError: (err) => toast.error("Falha ao atualizar checklist", (err as Error).message),
  });

  const addChecklistMutation = useMutation({
    mutationFn: ({ orderId, title }: { orderId: string; title: string }) => createProductionChecklistItem(orderId, title),
    onSuccess: async () => {
      setNewChecklistTitle("");
      await invalidateProductionData(selectedOrder?.id ?? null);
    },
    onError: (err) => toast.error("Falha ao adicionar item", (err as Error).message),
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: (itemId: string) => deleteProductionChecklistItem(itemId),
    onSuccess: async () => invalidateProductionData(selectedOrder?.id ?? null),
    onError: (err) => toast.error("Falha ao remover item", (err as Error).message),
  });

  const reorderChecklistMutation = useMutation({
    mutationFn: ({ orderId, items }: { orderId: string; items: { item_id: string; order_index: number }[] }) =>
      reorderProductionChecklistItems(orderId, items),
    onSuccess: async () => invalidateProductionData(selectedOrder?.id ?? null),
    onError: (err) => toast.error("Falha ao reordenar checklist", (err as Error).message),
  });

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numeroOp = form.numero_op.trim();
    if (!numeroOp) {
      setFormError("O campo Numero OP e obrigatorio.");
      return;
    }
    if (form.quantidade != null && form.quantidade <= 0) {
      setFormError("Quantidade deve ser um numero positivo.");
      return;
    }
    if (form.data_inicio && Number.isNaN(Date.parse(form.data_inicio))) {
      setFormError("Data de inicio invalida.");
      return;
    }
    if (form.data_entrega && Number.isNaN(Date.parse(form.data_entrega))) {
      setFormError("Data de entrega invalida.");
      return;
    }

    setFormError(null);
    createOrderMutation.mutate({
      ...form,
      numero_op: numeroOp,
      cliente: form.cliente?.trim() || null,
      projeto: form.projeto?.trim() || null,
      modelo: form.modelo?.trim() || null,
      setor: form.setor?.trim() || null,
      quantidade: form.quantidade ? Number(form.quantidade) : null,
      checklist_template_id: form.checklist_template_id || null,
    });
  }

  function addChecklistItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrder || !newChecklistTitle.trim()) return;
    addChecklistMutation.mutate({ orderId: selectedOrder.id, title: newChecklistTitle.trim() });
  }

  function moveChecklistItem(index: number, direction: -1 | 1) {
    if (!selectedOrder) return;
    const payload = buildChecklistReorderPayload(checklistItemsSorted, index, direction);
    if (payload.length === 0) return;
    reorderChecklistMutation.mutate({ orderId: selectedOrder.id, items: payload });
  }

  return (
    <div className="mx-auto min-w-0 max-w-[1600px] space-y-5 overflow-x-hidden p-3 sm:space-y-6 sm:p-0">
      <header className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan/30 bg-cyan/10 text-cyan">
              <Factory className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">Kanban Producao</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">Controle simples de {terminology.itemPlural} com checklist editavel e preview TV/Foco.</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button
            className="bg-panel text-slate-100 ring-1 ring-border hover:bg-slate-800"
            onClick={() => void invalidateProductionData(selectedOrder?.id ?? null)}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={() => setShowForm((value) => !value)}>
            <Plus className="h-4 w-4" />
            {terminology.newItemLabel}
          </Button>
        </div>
      </header>

      <section className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ["Total", dashboardQuery.data?.total_ops ?? 0],
          ["Abertas", dashboardQuery.data?.abertas ?? 0],
          ["Em andamento", dashboardQuery.data?.em_andamento ?? 0],
          ["Aguardando", dashboardQuery.data?.aguardando ?? 0],
          ["Prontas", dashboardQuery.data?.prontas ?? 0],
          ["Arquivadas", dashboardQuery.data?.arquivadas ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-lg border border-border bg-panel/60 p-3 sm:p-4">
            <p className="truncate text-[0.68rem] font-medium uppercase tracking-[0.12em] text-slate-500 sm:text-xs">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </section>

      {showForm ? (
        <form onSubmit={submitOrder} className="grid min-w-0 gap-3 rounded-lg border border-border bg-panel/50 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {formError ? <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200 sm:col-span-2 xl:col-span-4">{formError}</div> : null}
          <Input label="Numero OP" value={form.numero_op} onChange={(value) => setForm((current) => ({ ...current, numero_op: value }))} required />
          <Input label="Cliente" value={form.cliente ?? ""} onChange={(value) => setForm((current) => ({ ...current, cliente: value }))} />
          <Input label="Projeto" value={form.projeto ?? ""} onChange={(value) => setForm((current) => ({ ...current, projeto: value }))} />
          <Input label="Modelo" value={form.modelo ?? ""} onChange={(value) => setForm((current) => ({ ...current, modelo: value }))} />
          <Input label="Quantidade" type="number" value={form.quantidade?.toString() ?? ""} onChange={(value) => setForm((current) => ({ ...current, quantidade: value ? Number(value) : null }))} />
          <Input label="Setor" value={form.setor ?? ""} onChange={(value) => setForm((current) => ({ ...current, setor: value }))} />
          <DateInput label="Data de inicio" value={form.data_inicio} onChange={(value) => setForm((current) => ({ ...current, data_inicio: value }))} />
          <DateInput label="Data de entrega" value={form.data_entrega} onChange={(value) => setForm((current) => ({ ...current, data_entrega: value }))} />
          <SelectInput label="Prioridade" value={form.prioridade ?? "normal"} onChange={(value) => setForm((current) => ({ ...current, prioridade: value as ProductionPriority }))}>
            <option value="baixa">Baixa</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </SelectInput>
          <SelectInput label="Status" value={form.status ?? "aberta"} onChange={(value) => setForm((current) => ({ ...current, status: value as ProductionStatus }))}>
            <option value="aberta">Aberta</option>
            <option value="em_andamento">Em andamento</option>
            <option value="aguardando">Aguardando</option>
            <option value="pronta">Pronta</option>
          </SelectInput>
          <SelectInput label="Template" value={form.checklist_template_id ?? ""} onChange={(value) => setForm((current) => ({ ...current, checklist_template_id: value || null }))}>
            <option value="">Default producao</option>
            {(templatesQuery.data ?? []).map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </SelectInput>
          <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row xl:col-span-4">
            <Button className="w-full sm:w-auto" type="submit" disabled={createOrderMutation.isPending || !form.numero_op.trim()}>
              Criar OP
            </Button>
            <Button className="w-full bg-panel text-slate-100 ring-1 ring-border hover:bg-slate-800 sm:w-auto" type="button" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.9fr)]">
        <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-panel/45">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-semibold text-white">OPs</h2>
          </div>
          <div className="divide-y divide-border">
            {ordersQuery.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse rounded-xl bg-slate-950/50 p-4">
                    <div className="h-4 w-32 rounded bg-slate-800" />
                    <div className="mt-3 h-3 w-24 rounded bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : ordersQuery.isError ? (
              <div className="space-y-3 p-4 text-sm text-rose-200">
                <p>{getApiErrorMessage(ordersQuery.error, "Falha ao carregar OPs.")}</p>
                <Button className="bg-panel text-slate-100 ring-1 ring-border hover:bg-slate-800" onClick={() => ordersQuery.refetch()}>
                  Tentar novamente
                </Button>
              </div>
            ) : orders.length === 0 ? (
                  <div className="p-4 text-sm text-slate-400">{terminology.emptyStateText}</div>
            ) : (
              orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    setDrawerOpen(true);
                  }}
                  className="grid w-full min-w-0 gap-3 px-4 py-3 text-left hover:bg-white/[0.03] sm:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="max-w-full truncate font-semibold text-white">{order.numero_op}</span>
                      <PriorityBadge priority={order.prioridade} />
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-400">{[order.cliente, order.projeto, order.modelo].filter(Boolean).join(" - ") || "Sem cliente/projeto"}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-300 sm:block sm:text-right">
                    <p>{Number(order.percentual_checklist).toFixed(0)}%</p>
                    <p className="text-xs text-slate-500">{formatDate(order.data_entrega)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <aside className="min-w-0 space-y-4">
          <div className="min-w-0 rounded-lg border border-border bg-panel/45 p-4">
            <h2 className="font-semibold text-white">Checklist rapido</h2>
            {selectedOrder ? (
              <>
                <p className="mt-1 truncate text-sm text-slate-400">{selectedOrder.numero_op}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-950">
                  <div className="h-2 rounded-full bg-cyan" style={{ width: `${Number(selectedOrder.percentual_checklist).toFixed(0)}%` }} />
                </div>
                <form onSubmit={addChecklistItem} className="mt-4 flex min-w-0 gap-2">
                  <input
                    value={newChecklistTitle}
                    onChange={(event) => setNewChecklistTitle(event.target.value)}
                    placeholder="Novo item"
                    className="h-10 min-w-0 flex-1 rounded-md border border-border bg-slate-950 px-3 text-sm text-white"
                  />
                  <Button aria-label="Adicionar item" type="submit" disabled={!newChecklistTitle.trim() || addChecklistMutation.isPending}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>
                <div className="mt-4 space-y-2">
                  {checklistItemsSorted.map((item, index, items) => (
                    <div key={item.id} className="grid min-w-0 gap-3 rounded-md border border-border bg-slate-950/40 px-3 py-2 text-sm text-slate-200 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <label className="flex min-w-0 items-start gap-3">
                        <input
                          type="checkbox"
                          checked={item.is_done}
                          onChange={(event) => toggleChecklistMutation.mutate({ itemId: item.id, isDone: event.target.checked })}
                          className="mt-1"
                        />
                        <span className={clsx("min-w-0 break-words", item.is_done && "text-slate-500 line-through")}>{item.title}</span>
                      </label>
                      <ChecklistActions
                        index={index}
                        total={items.length}
                        busy={reorderChecklistMutation.isPending || deleteChecklistMutation.isPending}
                        onMoveUp={() => moveChecklistItem(index, -1)}
                        onMoveDown={() => moveChecklistItem(index, 1)}
                        onDelete={() => {
                          if (!window.confirm("Remover este item do checklist?")) return;
                          deleteChecklistMutation.mutate(item.id);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Selecione uma OP para editar o checklist.</p>
            )}
          </div>

          <div className="min-w-0 rounded-lg border border-border bg-panel/45 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <MonitorUp className="h-4 w-4 shrink-0 text-cyan" />
                <h2 className="truncate font-semibold text-white">TV/Foco simples</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                {(["list", "kanban"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTvMode(mode)}
                    aria-pressed={tvMode === mode}
                    className={clsx(
                      "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium",
                      tvMode === mode ? "bg-cyan text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10",
                    )}
                  >
                    {mode === "list" ? <List className="h-3.5 w-3.5" /> : <Columns3 className="h-3.5 w-3.5" />}
                    {mode === "list" ? "Lista" : "Kanban"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {tvQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="h-20 animate-pulse rounded-md bg-slate-950/40 p-3" />
                  ))}
                </div>
              ) : tvQuery.isError ? (
                <ErrorState
                  error={tvQuery.error}
                  title="Falha ao carregar preview TV/Foco"
                  fallback="Falha ao carregar preview TV/Foco."
                  onRetry={() => void tvQuery.refetch()}
                />
              ) : tvMode === "kanban" ? (
                <TVKanbanPreview columns={tvKanbanColumns} />
              ) : (
                <TVListPreview items={tvItems} />
              )}
            </div>
          </div>
        </aside>
      </section>

      {drawerOpen && selectedOrderId ? (
        <ProductionOrderDrawer
          orderId={selectedOrderId}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedOrderId(null);
          }}
        />
      ) : null}
    </div>
  );
}

const emptyOrderForm: CreateProductionOrderPayload = {
  numero_op: "",
  cliente: "",
  projeto: "",
  modelo: "",
  quantidade: null,
  setor: "",
  data_inicio: null,
  data_entrega: null,
  prioridade: "normal",
  status: "aberta",
  checklist_template_id: null,
};

function buildChecklistReorderPayload(items: ProductionChecklistItem[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return [];
  const reordered = items.slice();
  [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
  return reordered.map((item, orderIndex) => ({ item_id: item.id, order_index: orderIndex + 1 }));
}

function Input({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="min-w-0 space-y-1 text-sm text-slate-300">
      <span>{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full min-w-0 rounded-md border border-border bg-slate-950 px-3 text-sm text-white"
      />
    </label>
  );
}

function DateInput({ label, value, onChange }: { label: string; value?: string | null; onChange: (value: string | null) => void }) {
  return (
    <label className="min-w-0 space-y-1 text-sm text-slate-300">
      <span>{label}</span>
      <input
        type="date"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className="h-10 w-full min-w-0 rounded-md border border-border bg-slate-950 px-3 text-sm text-white"
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  const options = Children.toArray(children)
    .filter(isValidElement)
    .map((child) => {
      const props = child.props as { value?: string; children?: ReactNode };
      return {
        value: String(props.value ?? ""),
        label: Children.toArray(props.children).join(""),
      };
    });

  return (
    <PortalSelect label={label} value={value} onChange={onChange} options={options} className="min-w-0" />
  );
}

function ChecklistActions({ index, total, busy, onMoveUp, onMoveDown, onDelete }: { index: number; total: number; busy: boolean; onMoveUp: () => void; onMoveDown: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-2 sm:justify-end">
      <button
        aria-label="Subir item"
        type="button"
        disabled={index === 0 || busy}
        onClick={onMoveUp}
        className="grid h-8 w-8 place-items-center rounded-md bg-panel/70 text-slate-200 ring-1 ring-border hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
      <button
        aria-label="Descer item"
        type="button"
        disabled={index === total - 1 || busy}
        onClick={onMoveDown}
        className="grid h-8 w-8 place-items-center rounded-md bg-panel/70 text-slate-200 ring-1 ring-border hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowDown className="h-4 w-4" />
      </button>
      <button
        aria-label="Remover item"
        type="button"
        disabled={busy}
        onClick={onDelete}
        className="grid h-8 w-8 place-items-center rounded-md bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/20 hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function TVListPreview({ items }: { items: ProductionTVItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">Sem OPs pendentes no preview.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.card_id} className="rounded-lg border border-border bg-slate-950/50 p-4 text-sm shadow-sm ring-1 ring-white/5">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span className="block truncate text-base font-semibold text-white">{item.numero_op}</span>
              <p className="mt-1 truncate text-slate-400">{[item.cliente, item.projeto, item.modelo].filter(Boolean).join(" - ") || "Sem cliente/projeto"}</p>
            </div>
            <span className="w-fit rounded-full bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">{Number(item.percentual_checklist).toFixed(0)}%</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
            <StatusBadge status={item.status} />
            <PriorityBadge priority={item.prioridade} />
            <span className="rounded-full bg-white/5 px-2 py-1">Entrega: {formatDate(item.data_entrega)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TVKanbanPreview({ columns }: { columns: Record<string, ProductionTVItem[]> }) {
  if (Object.entries(columns).length === 0) {
    return <p className="text-sm text-slate-400">Nenhum cartao disponivel para o modo Kanban.</p>;
  }

  return (
    <div className="grid min-w-0 gap-3 lg:grid-cols-2">
      {Object.entries(columns).map(([column, items]) => (
        <div key={column} className="min-w-0 rounded-lg border border-border bg-slate-950/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold text-white">{column}</p>
            <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-400">{items.length}</span>
          </div>
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <div key={item.card_id} className="min-w-0 rounded-md border border-border bg-panel/60 p-3">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span className="truncate font-semibold text-white">{item.numero_op}</span>
                  <span className="shrink-0 text-cyan">{Number(item.percentual_checklist).toFixed(0)}%</span>
                </div>
                <p className="mt-1 truncate text-xs text-slate-400">{[item.cliente, item.projeto].filter(Boolean).join(" - ") || "Sem cliente/projeto"}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(date?: string | null) {
  if (!date) return "sem entrega";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("pt-BR");
}

function StatusBadge({ status }: { status: ProductionStatus }) {
  const className = clsx(
    "rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.12em]",
    status === "aberta" && "border-emerald-500/20 bg-emerald-500/15 text-emerald-200",
    status === "em_andamento" && "border-sky-500/20 bg-sky-500/15 text-sky-200",
    status === "aguardando" && "border-amber-500/20 bg-amber-500/15 text-amber-200",
    status === "pronta" && "border-cyan-500/20 bg-cyan-500/15 text-cyan-200",
    status === "arquivada" && "border-rose-500/20 bg-rose-500/15 text-rose-200",
  );
  return <span className={className}>{status.replace("_", " ")}</span>;
}

function PriorityBadge({ priority }: { priority: ProductionPriority }) {
  const className = clsx(
    "rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.12em]",
    priority === "baixa" && "border-emerald-500/10 bg-emerald-500/10 text-emerald-200",
    priority === "normal" && "border-slate-500/10 bg-slate-500/10 text-slate-200",
    priority === "alta" && "border-amber-500/20 bg-amber-500/15 text-amber-200",
    priority === "urgente" && "border-rose-500/20 bg-rose-500/15 text-rose-200",
  );
  return <span className={className}>{priority}</span>;
}
