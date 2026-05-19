import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Factory, MonitorUp, Plus, RefreshCw } from "lucide-react";
import { FormEvent, useMemo, useState, useEffect, useRef } from "react";

import { Button } from "../../shared/components/Button";
import { useToast } from "../../shared/components/ToastProvider";
import ProductionOrderDrawer from "./ProductionOrderDrawer";
import {
  createProductionChecklistItem,
  createProductionOrder,
  getProductionDashboard,
  getProductionTVPreview,
  listProductionChecklist,
  listProductionOrders,
  listProductionTemplates,
  updateProductionChecklistItem,
  deleteProductionChecklistItem,
  reorderProductionChecklistItems,
} from "./api";
import { usePortalWebSocketContext } from "../../shared/hooks/usePortalWebSocket";
import type { CreateProductionOrderPayload, ProductionOrder, ProductionTVItem, ProductionChecklistItem } from "./types";

const queryKeys = {
  dashboard: ["kanban-producao", "dashboard"] as const,
  orders: ["kanban-producao", "orders"] as const,
  templates: ["kanban-producao", "templates"] as const,
  tv: ["kanban-producao", "tv"] as const,
  checklist: (orderId: string | null) => ["kanban-producao", "checklist", orderId] as const,
};

export function KanbanProducaoPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [form, setForm] = useState<CreateProductionOrderPayload>({
    numero_op: "",
    cliente: "",
    projeto: "",
    modelo: "",
    quantidade: null,
    setor: "",
    prioridade: "normal",
    status: "aberta",
    checklist_template_id: null,
  });

  const dashboardQuery = useQuery({ queryKey: queryKeys.dashboard, queryFn: getProductionDashboard });
  const ordersQuery = useQuery({ queryKey: queryKeys.orders, queryFn: listProductionOrders });
  const templatesQuery = useQuery({ queryKey: queryKeys.templates, queryFn: listProductionTemplates });
  const tvQuery = useQuery({ queryKey: queryKeys.tv, queryFn: getProductionTVPreview });
  const orders = ordersQuery.data ?? [];
  const selectedOrder = useMemo(() => orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null, [orders, selectedOrderId]);
  const checklistQuery = useQuery({
    queryKey: queryKeys.checklist(selectedOrder?.id ?? null),
    queryFn: () => listProductionChecklist(selectedOrder?.id as string),
    enabled: Boolean(selectedOrder?.id),
  });
  const tvItems = Array.isArray(tvQuery.data?.items) ? (tvQuery.data?.items as ProductionTVItem[]) : [];
  const checklistItemsSorted = ((checklistQuery.data ?? []) as ProductionChecklistItem[]).slice().sort((a, b) => a.order_index - b.order_index);

  const { subscribe } = usePortalWebSocketContext();
  const wsTimerRef = useRef<number | null>(null);
  const wsPendingRef = useRef<{ any?: boolean }>({});

  useEffect(() => {
    return subscribe((event) => {
      if (!event?.type?.startsWith("kanban_producao.")) return;
      wsPendingRef.current.any = true;
      if (wsTimerRef.current) window.clearTimeout(wsTimerRef.current);
      wsTimerRef.current = window.setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
        queryClient.invalidateQueries({ queryKey: queryKeys.orders });
        queryClient.invalidateQueries({ queryKey: queryKeys.tv });
        queryClient.invalidateQueries({ queryKey: queryKeys.checklist(selectedOrder?.id ?? null) });
        wsPendingRef.current = {};
        wsTimerRef.current = null;
      }, 250);
    });
  }, [subscribe, queryClient, selectedOrder?.id]);

  const createOrderMutation = useMutation({
    mutationFn: createProductionOrder,
    onSuccess: async (order) => {
      toast.success("OP criada", "A ordem foi vinculada ao Kanban Engine.");
      setShowForm(false);
      setSelectedOrderId(order.id);
      setForm({ numero_op: "", cliente: "", projeto: "", modelo: "", quantidade: null, setor: "", prioridade: "normal", status: "aberta", checklist_template_id: null });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tv }),
      ]);
    },
    onError: (err) => toast.error("Falha ao criar OP", (err as Error).message),
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: ({ itemId, isDone }: { itemId: string; isDone: boolean }) => updateProductionChecklistItem(itemId, { is_done: isDone }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.checklist(selectedOrder?.id ?? null) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tv }),
      ]);
    },
    onError: (err) => toast.error("Falha ao atualizar checklist", (err as Error).message),
  });

  const addChecklistMutation = useMutation({
    mutationFn: ({ orderId, title }: { orderId: string; title: string }) => createProductionChecklistItem(orderId, title),
    onSuccess: async () => {
      setNewChecklistTitle("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.checklist(selectedOrder?.id ?? null) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders }),
      ]);
    },
    onError: (err) => toast.error("Falha ao adicionar item", (err as Error).message),
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: (itemId: string) => deleteProductionChecklistItem(itemId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.checklist(selectedOrder?.id ?? null) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders }),
      ]);
    },
    onError: (err) => toast.error("Falha ao remover item", (err as Error).message),
  });

  const reorderChecklistMutation = useMutation({
    mutationFn: ({ orderId, items }: { orderId: string; items: { item_id: string; order_index: number }[] }) => reorderProductionChecklistItems(orderId, items),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.checklist(selectedOrder?.id ?? null) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders }),
      ]);
    },
    onError: (err) => toast.error("Falha ao reordenar checklist", (err as Error).message),
  });

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createOrderMutation.mutate({
      ...form,
      numero_op: form.numero_op.trim(),
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

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan/30 bg-cyan/10 text-cyan">
              <Factory className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-white">Kanban Producao</h1>
              <p className="mt-1 text-sm text-slate-400">Controle simples de OPs com checklist editavel</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-panel text-slate-100 ring-1 ring-border hover:bg-slate-800"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
              queryClient.invalidateQueries({ queryKey: queryKeys.orders });
              queryClient.invalidateQueries({ queryKey: queryKeys.tv });
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={() => setShowForm((value) => !value)}>
            <Plus className="h-4 w-4" />
            Nova OP
          </Button>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-6">
        {[
          ["Total", dashboardQuery.data?.total_ops ?? 0],
          ["Abertas", dashboardQuery.data?.abertas ?? 0],
          ["Em andamento", dashboardQuery.data?.em_andamento ?? 0],
          ["Aguardando", dashboardQuery.data?.aguardando ?? 0],
          ["Prontas", dashboardQuery.data?.prontas ?? 0],
          ["Arquivadas", dashboardQuery.data?.arquivadas ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-panel/60 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </section>

      {showForm ? (
        <form onSubmit={submitOrder} className="grid gap-3 rounded-lg border border-border bg-panel/50 p-4 md:grid-cols-4">
          <Input label="Numero OP" value={form.numero_op} onChange={(value) => setForm((current) => ({ ...current, numero_op: value }))} required />
          <Input label="Cliente" value={form.cliente ?? ""} onChange={(value) => setForm((current) => ({ ...current, cliente: value }))} />
          <Input label="Projeto" value={form.projeto ?? ""} onChange={(value) => setForm((current) => ({ ...current, projeto: value }))} />
          <Input label="Modelo" value={form.modelo ?? ""} onChange={(value) => setForm((current) => ({ ...current, modelo: value }))} />
          <Input label="Quantidade" type="number" value={form.quantidade?.toString() ?? ""} onChange={(value) => setForm((current) => ({ ...current, quantidade: value ? Number(value) : null }))} />
          <Input label="Setor" value={form.setor ?? ""} onChange={(value) => setForm((current) => ({ ...current, setor: value }))} />
          <label className="space-y-1 text-sm text-slate-300">
            <span>Prioridade</span>
            <select className="h-10 w-full rounded-md border border-border bg-slate-950 px-3 text-sm text-white" value={form.prioridade} onChange={(event) => setForm((current) => ({ ...current, prioridade: event.target.value as CreateProductionOrderPayload["prioridade"] }))}>
              <option value="baixa">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-slate-300">
            <span>Template</span>
            <select className="h-10 w-full rounded-md border border-border bg-slate-950 px-3 text-sm text-white" value={form.checklist_template_id ?? ""} onChange={(event) => setForm((current) => ({ ...current, checklist_template_id: event.target.value || null }))}>
              <option value="">Default producao</option>
              {(templatesQuery.data ?? []).map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </label>
          <div className="md:col-span-4">
            <Button type="submit" disabled={createOrderMutation.isPending || !form.numero_op.trim()}>
              Criar OP
            </Button>
          </div>
        </form>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
        <div className="rounded-lg border border-border bg-panel/45">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-semibold text-white">OPs</h2>
          </div>
          <div className="divide-y divide-border">
            {ordersQuery.isLoading ? (
              <p className="p-4 text-sm text-slate-400">Carregando OPs...</p>
            ) : orders.length === 0 ? (
              <p className="p-4 text-sm text-slate-400">Nenhuma OP cadastrada.</p>
            ) : (
              orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    setDrawerOpen(true);
                  }}
                  className="grid w-full gap-2 px-4 py-3 text-left hover:bg-white/[0.03] md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{order.numero_op}</span>
                      <Badge>{order.prioridade}</Badge>
                      <Badge>{order.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{[order.cliente, order.projeto, order.modelo].filter(Boolean).join(" - ") || "Sem cliente/projeto"}</p>
                  </div>
                  <div className="text-right text-sm text-slate-300">
                    <p>{Number(order.percentual_checklist).toFixed(0)}%</p>
                    <p className="text-xs text-slate-500">{order.data_entrega ?? "sem entrega"}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-panel/45 p-4">
            <h2 className="font-semibold text-white">Checklist da OP</h2>
            {selectedOrder ? (
              <>
                <p className="mt-1 text-sm text-slate-400">{selectedOrder.numero_op}</p>
                <form onSubmit={addChecklistItem} className="mt-4 flex gap-2">
                  <input
                    value={newChecklistTitle}
                    onChange={(event) => setNewChecklistTitle(event.target.value)}
                    placeholder="Novo item"
                    className="h-10 min-w-0 flex-1 rounded-md border border-border bg-slate-950 px-3 text-sm text-white"
                  />
                  <Button type="submit" disabled={!newChecklistTitle.trim() || addChecklistMutation.isPending}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>
                <div className="mt-4 space-y-2">
                  {checklistItemsSorted.map((item, idx, arr) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-slate-950/40 px-3 py-2 text-sm text-slate-200">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={item.is_done} onChange={(event) => toggleChecklistMutation.mutate({ itemId: item.id, isDone: event.target.checked })} />
                        <span className={item.is_done ? "text-slate-500 line-through" : ""}>{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          title="Subir"
                          disabled={idx === 0 || reorderChecklistMutation.isPending}
                          onClick={() => {
                            if (!selectedOrder) return;
                            const copy = arr.map((it) => ({ item_id: it.id, order_index: it.order_index }));
                            // swap with previous
                            const prev = copy[idx - 1];
                            const cur = copy[idx];
                            const tmp = prev.order_index;
                            prev.order_index = cur.order_index;
                            cur.order_index = tmp;
                            reorderChecklistMutation.mutate({ orderId: selectedOrder.id, items: copy });
                          }}
                          className="rounded bg-panel/60 px-2 py-1 text-xs"
                        >
                          ↑
                        </button>
                        <button
                          title="Descer"
                          disabled={idx === arr.length - 1 || reorderChecklistMutation.isPending}
                          onClick={() => {
                            if (!selectedOrder) return;
                            const copy = arr.map((it) => ({ item_id: it.id, order_index: it.order_index }));
                            // swap with next
                            const next = copy[idx + 1];
                            const cur = copy[idx];
                            const tmp = next.order_index;
                            next.order_index = cur.order_index;
                            cur.order_index = tmp;
                            reorderChecklistMutation.mutate({ orderId: selectedOrder.id, items: copy });
                          }}
                          className="rounded bg-panel/60 px-2 py-1 text-xs"
                        >
                          ↓
                        </button>
                        <button title="Remover" onClick={() => deleteChecklistMutation.mutate(item.id)} className="rounded bg-red-700/40 px-2 py-1 text-xs">
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Selecione uma OP para editar o checklist.</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-panel/45 p-4">
            <div className="flex items-center gap-2">
              <MonitorUp className="h-4 w-4 text-cyan" />
              <h2 className="font-semibold text-white">TV/Foco simples</h2>
            </div>
            <div className="mt-3 space-y-2">
              {tvItems.length === 0 ? (
                <p className="text-sm text-slate-400">Sem OPs pendentes no preview.</p>
              ) : (
                tvItems.map((item) => (
                  <div key={item.card_id} className="rounded-md border border-border bg-slate-950/40 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-white">{item.numero_op}</span>
                      <span className="text-cyan">{Number(item.percentual_checklist).toFixed(0)}%</span>
                    </div>
                    <p className="mt-1 text-slate-400">{[item.cliente, item.projeto].filter(Boolean).join(" - ")}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </section>
      {drawerOpen && selectedOrderId ? <ProductionOrderDrawer orderId={selectedOrderId} onClose={() => { setDrawerOpen(false); setSelectedOrderId(null); }} /> : null}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="space-y-1 text-sm text-slate-300">
      <span>{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-border bg-slate-950 px-3 text-sm text-white"
      />
    </label>
  );
}

function Badge({ children }: { children: string }) {
  return <span className="rounded-full border border-cyan/20 bg-cyan/10 px-2 py-0.5 text-xs text-cyan">{children}</span>;
}
