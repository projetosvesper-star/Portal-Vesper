import { Dispatch, FormEvent, ReactNode, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { Archive, ArrowDown, ArrowUp, Edit, RotateCw, Trash2, X } from "lucide-react";

import { Button } from "../../shared/components/Button";
import { useToast } from "../../shared/components/ToastProvider";
import {
  archiveProductionOrder,
  createProductionChecklistItem,
  deleteProductionChecklistItem,
  getProductionOrder,
  listProductionActivity,
  listProductionChecklist,
  reorderProductionChecklistItems,
  restoreProductionOrder,
  updateProductionChecklistItem,
  updateProductionOrder,
} from "./api";
import productionQueryKeys from "./queryKeys";
import type { CreateProductionOrderPayload, ProductionActivity, ProductionChecklistItem, ProductionOrder, ProductionPriority, ProductionStatus } from "./types";

type Props = {
  orderId: string;
  onClose: () => void;
};

export function ProductionOrderDrawer({ orderId, onClose }: Props) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"resumo" | "checklist" | "atividade">("resumo");
  const [editChecklistItemId, setEditChecklistItemId] = useState<string | null>(null);
  const [checklistEditTitle, setChecklistEditTitle] = useState("");
  const [checklistEditDescription, setChecklistEditDescription] = useState<string | null>(null);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [orderSaveError, setOrderSaveError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreateProductionOrderPayload>>({});

  const orderQuery = useQuery({ queryKey: productionQueryKeys.orderDetail(orderId), queryFn: () => getProductionOrder(orderId) });
  const checklistQuery = useQuery({ queryKey: productionQueryKeys.checklist(orderId), queryFn: () => listProductionChecklist(orderId) });
  const activityQuery = useQuery({ queryKey: productionQueryKeys.activity(orderId), queryFn: () => listProductionActivity(orderId) });

  const order = orderQuery.data;
  const checklistItems = useMemo(
    () => ((checklistQuery.data ?? []) as ProductionChecklistItem[]).slice().sort((a, b) => a.order_index - b.order_index),
    [checklistQuery.data],
  );
  const percentual = Math.min(100, Math.max(0, Number(order?.percentual_checklist) || 0));

  const invalidateOrderData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: productionQueryKeys.orders }),
      queryClient.invalidateQueries({ queryKey: productionQueryKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: productionQueryKeys.orderDetail(orderId) }),
      queryClient.invalidateQueries({ queryKey: productionQueryKeys.checklist(orderId) }),
      queryClient.invalidateQueries({ queryKey: productionQueryKeys.activity(orderId) }),
      queryClient.invalidateQueries({ queryKey: productionQueryKeys.tv }),
    ]);
  }, [orderId, queryClient]);

  useEffect(() => {
    if (!order) return;
    setEditForm({
      numero_op: order.numero_op,
      cliente: order.cliente,
      projeto: order.projeto,
      modelo: order.modelo,
      quantidade: order.quantidade,
      setor: order.setor,
      data_inicio: order.data_inicio,
      data_entrega: order.data_entrega,
      prioridade: order.prioridade,
      status: order.status,
      observacoes: order.observacoes ?? null,
    });
  }, [order]);

  useEffect(() => {
    setEditing(false);
    setActiveTab("resumo");
    setEditChecklistItemId(null);
    setUpdateError(null);
    setOrderSaveError(null);
  }, [orderId]);

  const updateOrderMutation = useMutation({
    mutationFn: ({ payload }: { payload: Partial<CreateProductionOrderPayload> }) => updateProductionOrder(orderId, payload),
    onSuccess: async () => {
      setOrderSaveError(null);
      await invalidateOrderData();
      setEditing(false);
      toast.success("OP atualizada", "Alteracoes salvas com sucesso.");
    },
    onError: (err) => {
      const message = (err as Error).message || "Falha ao atualizar OP";
      setOrderSaveError(message);
      toast.error("Falha ao atualizar OP", message);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveProductionOrder(orderId),
    onSuccess: async () => {
      await invalidateOrderData();
      toast.success("OP arquivada", "A OP foi arquivada com sucesso.");
    },
    onError: (err) => toast.error("Falha ao arquivar OP", (err as Error).message),
  });

  const restoreMutation = useMutation({
    mutationFn: () => restoreProductionOrder(orderId),
    onSuccess: async () => {
      await invalidateOrderData();
      toast.success("OP restaurada", "A OP foi restaurada com sucesso.");
    },
    onError: (err) => toast.error("Falha ao restaurar OP", (err as Error).message),
  });

  const addChecklistMutation = useMutation({
    mutationFn: ({ title }: { title: string }) => createProductionChecklistItem(orderId, title),
    onSuccess: async () => {
      setNewChecklistTitle("");
      await invalidateOrderData();
    },
    onError: (err) => toast.error("Falha ao adicionar item", (err as Error).message),
  });

  const updateChecklistMutation = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: Partial<Pick<ProductionChecklistItem, "title" | "description" | "is_done" | "is_required" | "order_index">> }) =>
      updateProductionChecklistItem(itemId, payload),
    onSuccess: async () => {
      setUpdateError(null);
      setEditChecklistItemId(null);
      await invalidateOrderData();
    },
    onError: (err) => {
      const message = (err as Error).message || "Falha ao atualizar item";
      setUpdateError(message);
      toast.error("Falha ao atualizar item", message);
    },
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: (itemId: string) => deleteProductionChecklistItem(itemId),
    onSuccess: async () => {
      setUpdateError(null);
      await invalidateOrderData();
    },
    onError: (err) => {
      const message = (err as Error).message || "Falha ao remover item";
      setUpdateError(message);
      toast.error("Falha ao remover item", message);
    },
  });

  const reorderChecklistMutation = useMutation({
    mutationFn: (items: { item_id: string; order_index: number }[]) => reorderProductionChecklistItems(orderId, items),
    onSuccess: async () => {
      setUpdateError(null);
      await invalidateOrderData();
    },
    onError: (err) => {
      const message = (err as Error).message || "Falha ao reordenar checklist";
      setUpdateError(message);
      toast.error("Falha ao reordenar checklist", message);
    },
  });

  function submitOrderEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editForm.numero_op?.trim()) {
      setOrderSaveError("O campo Numero OP e obrigatorio.");
      return;
    }

    updateOrderMutation.mutate({
      payload: {
        numero_op: editForm.numero_op.trim(),
        cliente: editForm.cliente?.trim() || null,
        projeto: editForm.projeto?.trim() || null,
        modelo: editForm.modelo?.trim() || null,
        quantidade: editForm.quantidade ?? null,
        setor: editForm.setor?.trim() || null,
        data_inicio: editForm.data_inicio || null,
        data_entrega: editForm.data_entrega || null,
        prioridade: editForm.prioridade,
        status: editForm.status,
        observacoes: editForm.observacoes?.trim() || null,
      },
    });
  }

  function moveChecklistItem(index: number, direction: -1 | 1) {
    const payload = buildChecklistReorderPayload(checklistItems, index, direction);
    if (payload.length === 0) return;
    reorderChecklistMutation.mutate(payload);
  }

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Fechar painel" type="button" className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="production-order-drawer-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-[min(100vw,760px)] flex-col overflow-hidden border-l border-border bg-panel/98 shadow-2xl"
      >
        <header className="shrink-0 border-b border-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h3 id="production-order-drawer-title" className="truncate text-lg font-semibold text-white">
                {order?.numero_op ?? "Carregando OP"}
                {order?.modelo ? <span className="ml-2 text-sm text-slate-400">{order.modelo}</span> : null}
              </h3>
              <p className="mt-1 truncate text-xs text-slate-300">{[order?.cliente, order?.projeto].filter(Boolean).join(" - ") || "Sem cliente/projeto"}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center lg:justify-end">
              <Button
                className="bg-panel text-slate-100 ring-1 ring-border hover:bg-slate-800"
                onClick={() => {
                  setEditing((value) => !value);
                  setOrderSaveError(null);
                  setActiveTab("resumo");
                }}
                disabled={orderQuery.isLoading || orderQuery.isError}
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              {order?.is_archived ? (
                <Button className="bg-panel text-slate-100 ring-1 ring-border hover:bg-slate-800" onClick={() => restoreMutation.mutate()} disabled={restoreMutation.isPending}>
                  <RotateCw className="h-4 w-4" />
                  Restaurar
                </Button>
              ) : (
                <Button className="bg-panel text-slate-100 ring-1 ring-border hover:bg-slate-800" onClick={() => archiveMutation.mutate()} disabled={!order || archiveMutation.isPending}>
                  <Archive className="h-4 w-4" />
                  Arquivar
                </Button>
              )}
              <Button className="col-span-2 bg-panel text-slate-100 ring-1 ring-border hover:bg-slate-800 sm:col-span-1" onClick={onClose} aria-label="Fechar">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {orderQuery.isLoading ? (
            <div className="rounded-lg border border-border bg-slate-950/40 p-4 text-sm text-slate-300">Carregando OP...</div>
          ) : orderQuery.isError ? (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">Erro ao carregar OP: {(orderQuery.error as Error)?.message ?? "Erro inesperado."}</div>
          ) : (
            <div className="space-y-4">
              <SummaryCard order={order} percentual={percentual} />

              <div className="overflow-hidden rounded-lg border border-border bg-panel/40">
                <div className="grid grid-cols-3 gap-2 border-b border-border p-2">
                  {([
                    { key: "resumo", label: "Resumo" },
                    { key: "checklist", label: "Checklist" },
                    { key: "atividade", label: "Atividade" },
                  ] as const).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={clsx(
                        "rounded-md px-2 py-2 text-sm font-semibold transition",
                        activeTab === tab.key ? "bg-cyan text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10",
                      )}
                      aria-pressed={activeTab === tab.key}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4 p-4">
                  {activeTab === "resumo" ? (
                    editing ? (
                      <OrderEditForm
                        editForm={editForm}
                        setEditForm={setEditForm}
                        onSubmit={submitOrderEdit}
                        onCancel={() => {
                          setEditing(false);
                          setEditForm(orderToPayload(order));
                          setOrderSaveError(null);
                        }}
                        isPending={updateOrderMutation.isPending}
                        error={orderSaveError}
                      />
                    ) : (
                      <OrderReadOnly order={order} />
                    )
                  ) : null}

                  {activeTab === "checklist" ? (
                    <ChecklistTab
                      items={checklistItems}
                      updateError={updateError}
                      editChecklistItemId={editChecklistItemId}
                      checklistEditTitle={checklistEditTitle}
                      checklistEditDescription={checklistEditDescription}
                      busy={updateChecklistMutation.isPending || deleteChecklistMutation.isPending || reorderChecklistMutation.isPending}
                      newChecklistTitle={newChecklistTitle}
                      setNewChecklistTitle={setNewChecklistTitle}
                      onToggle={(itemId, isDone) => updateChecklistMutation.mutate({ itemId, payload: { is_done: isDone } })}
                      onStartEdit={(item) => {
                        setEditChecklistItemId(item.id);
                        setChecklistEditTitle(item.title);
                        setChecklistEditDescription(item.description);
                        setUpdateError(null);
                      }}
                      onSaveEdit={(item) => {
                        updateChecklistMutation.mutate({
                          itemId: item.id,
                          payload: {
                            title: checklistEditTitle.trim() || item.title,
                            description: checklistEditDescription?.trim() || null,
                          },
                        });
                      }}
                      onCancelEdit={() => {
                        setEditChecklistItemId(null);
                        setUpdateError(null);
                      }}
                      setChecklistEditTitle={setChecklistEditTitle}
                      setChecklistEditDescription={setChecklistEditDescription}
                      onMoveUp={(index) => moveChecklistItem(index, -1)}
                      onMoveDown={(index) => moveChecklistItem(index, 1)}
                      onDelete={(itemId) => {
                        if (!window.confirm("Remover este item do checklist?")) return;
                        deleteChecklistMutation.mutate(itemId);
                      }}
                      onAdd={(event) => {
                        event.preventDefault();
                        if (!newChecklistTitle.trim()) return;
                        addChecklistMutation.mutate({ title: newChecklistTitle.trim() });
                      }}
                      addPending={addChecklistMutation.isPending}
                    />
                  ) : null}

                  {activeTab === "atividade" ? <ActivityTab activity={activityQuery.data ?? []} loading={activityQuery.isLoading} /> : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function SummaryCard({ order, percentual }: { order?: ProductionOrder; percentual: number }) {
  return (
    <section className="rounded-lg border border-border bg-panel/40 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order?.status ?? "aberta"} />
            <PriorityBadge priority={order?.prioridade ?? "normal"} />
          </div>
          <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
            <Info label="Entrega" value={formatDate(order?.data_entrega)} />
            <Info label="Inicio" value={formatDate(order?.data_inicio)} />
            <Info label="Setor" value={order?.setor ?? "-"} />
            <Info label="Card" value={order?.card_id ?? "-"} breakAll />
          </div>
        </div>
        <div className="min-w-0 lg:min-w-[190px]">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Checklist</div>
          <div className="mt-2 text-3xl font-semibold text-white">{percentual.toFixed(0)}%</div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-950">
            <div className="h-2 rounded-full bg-cyan transition-all" style={{ width: `${percentual}%` }} />
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
        <Info label="Criado em" value={formatDateTime(order?.created_at)} />
        <Info label="Atualizado em" value={formatDateTime(order?.updated_at)} />
      </div>
    </section>
  );
}

function OrderEditForm({
  editForm,
  setEditForm,
  onSubmit,
  onCancel,
  isPending,
  error,
}: {
  editForm: Partial<CreateProductionOrderPayload>;
  setEditForm: Dispatch<SetStateAction<Partial<CreateProductionOrderPayload>>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput label="Numero OP" value={editForm.numero_op ?? ""} onChange={(value) => setEditForm((state) => ({ ...state, numero_op: value }))} />
        <TextInput label="Cliente" value={editForm.cliente ?? ""} onChange={(value) => setEditForm((state) => ({ ...state, cliente: value }))} />
        <TextInput label="Projeto" value={editForm.projeto ?? ""} onChange={(value) => setEditForm((state) => ({ ...state, projeto: value }))} />
        <TextInput label="Modelo" value={editForm.modelo ?? ""} onChange={(value) => setEditForm((state) => ({ ...state, modelo: value }))} />
        <TextInput label="Quantidade" type="number" value={editForm.quantidade?.toString() ?? ""} onChange={(value) => setEditForm((state) => ({ ...state, quantidade: value ? Number(value) : null }))} />
        <TextInput label="Setor" value={editForm.setor ?? ""} onChange={(value) => setEditForm((state) => ({ ...state, setor: value }))} />
        <DateInput label="Data de inicio" value={editForm.data_inicio ?? null} onChange={(value) => setEditForm((state) => ({ ...state, data_inicio: value }))} />
        <DateInput label="Data de entrega" value={editForm.data_entrega ?? null} onChange={(value) => setEditForm((state) => ({ ...state, data_entrega: value }))} />
        <SelectInput label="Prioridade" value={editForm.prioridade ?? "normal"} onChange={(value) => setEditForm((state) => ({ ...state, prioridade: value as ProductionPriority }))}>
          <option value="baixa">Baixa</option>
          <option value="normal">Normal</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </SelectInput>
        <SelectInput label="Status" value={editForm.status ?? "aberta"} onChange={(value) => setEditForm((state) => ({ ...state, status: value as ProductionStatus }))}>
          <option value="aberta">Aberta</option>
          <option value="em_andamento">Em andamento</option>
          <option value="aguardando">Aguardando</option>
          <option value="pronta">Pronta</option>
          <option value="arquivada">Arquivada</option>
        </SelectInput>
      </div>
      <label className="block space-y-1 text-sm text-slate-300">
        <span>Observacoes</span>
        <textarea
          value={editForm.observacoes ?? ""}
          onChange={(event) => setEditForm((state) => ({ ...state, observacoes: event.target.value }))}
          className="min-h-24 w-full rounded-md border border-border bg-slate-950 px-3 py-2 text-sm text-white"
        />
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="w-full sm:w-auto" type="submit" disabled={isPending}>
          Salvar
        </Button>
        <Button className="w-full bg-panel text-slate-100 ring-1 ring-border hover:bg-slate-800 sm:w-auto" type="button" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function OrderReadOnly({ order }: { order?: ProductionOrder }) {
  return (
    <div className="space-y-4 text-sm text-slate-300">
      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-slate-500">Observacoes</div>
        <p className="mt-2 whitespace-pre-wrap break-words text-white">{order?.observacoes ?? "-"}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="Cliente" value={order?.cliente ?? "-"} />
        <Info label="Projeto" value={order?.projeto ?? "-"} />
        <Info label="Modelo" value={order?.modelo ?? "-"} />
        <Info label="Quantidade" value={order?.quantidade?.toString() ?? "-"} />
      </div>
    </div>
  );
}

function ChecklistTab({
  items,
  updateError,
  editChecklistItemId,
  checklistEditTitle,
  checklistEditDescription,
  busy,
  newChecklistTitle,
  setNewChecklistTitle,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  setChecklistEditTitle,
  setChecklistEditDescription,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAdd,
  addPending,
}: {
  items: ProductionChecklistItem[];
  updateError: string | null;
  editChecklistItemId: string | null;
  checklistEditTitle: string;
  checklistEditDescription: string | null;
  busy: boolean;
  newChecklistTitle: string;
  setNewChecklistTitle: (value: string) => void;
  onToggle: (itemId: string, isDone: boolean) => void;
  onStartEdit: (item: ProductionChecklistItem) => void;
  onSaveEdit: (item: ProductionChecklistItem) => void;
  onCancelEdit: () => void;
  setChecklistEditTitle: (value: string) => void;
  setChecklistEditDescription: (value: string | null) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (itemId: string) => void;
  onAdd: (event: FormEvent<HTMLFormElement>) => void;
  addPending: boolean;
}) {
  return (
    <div className="space-y-4">
      {updateError ? <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100">{updateError}</div> : null}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="rounded-md border border-border bg-slate-950/50 p-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="flex min-w-0 items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.is_done}
                  onChange={(event) => onToggle(item.id, event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border border-slate-700 bg-slate-900 text-cyan"
                />
                <span className="min-w-0">
                  <span className={clsx("block break-words text-sm font-semibold", item.is_done ? "text-slate-500 line-through" : "text-white")}>{item.title}</span>
                  {item.description ? <span className="mt-1 block break-words text-xs text-slate-400">{item.description}</span> : null}
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <button type="button" onClick={() => onStartEdit(item)} className="h-8 rounded-md bg-white/5 px-3 text-xs text-slate-200 hover:bg-white/10">
                  Editar
                </button>
                <IconAction label="Subir item" disabled={index === 0 || busy} onClick={() => onMoveUp(index)}>
                  <ArrowUp className="h-4 w-4" />
                </IconAction>
                <IconAction label="Descer item" disabled={index === items.length - 1 || busy} onClick={() => onMoveDown(index)}>
                  <ArrowDown className="h-4 w-4" />
                </IconAction>
                <IconAction label="Remover item" variant="danger" disabled={busy} onClick={() => onDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </IconAction>
              </div>
            </div>

            {editChecklistItemId === item.id ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  onSaveEdit(item);
                }}
                className="mt-3 space-y-2"
              >
                <TextInput label="Titulo do item" value={checklistEditTitle} onChange={setChecklistEditTitle} />
                <label className="block space-y-1 text-sm text-slate-300">
                  <span>Descricao opcional</span>
                  <textarea
                    value={checklistEditDescription ?? ""}
                    onChange={(event) => setChecklistEditDescription(event.target.value || null)}
                    className="min-h-20 w-full rounded-md border border-border bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className="w-full sm:w-auto" type="submit" disabled={busy || !checklistEditTitle.trim()}>
                    Salvar item
                  </Button>
                  <Button className="w-full bg-panel text-slate-100 ring-1 ring-border hover:bg-slate-800 sm:w-auto" type="button" onClick={onCancelEdit}>
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : null}
          </div>
        ))}
      </div>
      <form onSubmit={onAdd} className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <input
          name="title"
          value={newChecklistTitle}
          onChange={(event) => setNewChecklistTitle(event.target.value)}
          placeholder="Novo item"
          className="h-10 min-w-0 flex-1 rounded-md border border-border bg-slate-950 px-3 text-sm text-white"
        />
        <Button className="w-full sm:w-auto" type="submit" disabled={addPending || !newChecklistTitle.trim()}>
          Adicionar
        </Button>
      </form>
    </div>
  );
}

function ActivityTab({ activity, loading }: { activity: ProductionActivity[]; loading: boolean }) {
  if (loading) {
    return <p className="text-sm text-slate-400">Carregando atividade...</p>;
  }
  if (activity.length === 0) {
    return <p className="text-sm text-slate-400">Sem atividade recente.</p>;
  }
  return (
    <div className="space-y-3">
      {activity.map((item) => (
        <div key={item.id} className="min-w-0 rounded-md border border-border bg-slate-950/40 p-3">
          <div className="text-xs text-slate-400">{formatDateTime(item.created_at)}</div>
          <div className="mt-1 break-words text-sm text-white">{item.action}</div>
          {item.new_value ? <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded bg-slate-950 p-2 text-xs text-slate-300">{JSON.stringify(item.new_value, null, 2)}</pre> : null}
        </div>
      ))}
    </div>
  );
}

function Info({ label, value, breakAll = false }: { label: string; value: string; breakAll?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-[0.15em] text-slate-500">{label}</div>
      <p className={clsx("mt-1 text-white", breakAll ? "break-all" : "truncate")}>{value}</p>
    </div>
  );
}

function TextInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block min-w-0 space-y-1 text-sm text-slate-300">
      <span>{label}</span>
      <input
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
    <label className="block min-w-0 space-y-1 text-sm text-slate-300">
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
  return (
    <label className="block min-w-0 space-y-1 text-sm text-slate-300">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full min-w-0 rounded-md border border-border bg-slate-950 px-3 text-sm text-white">
        {children}
      </select>
    </label>
  );
}

function IconAction({ label, disabled, onClick, children, variant = "default" }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode; variant?: "default" | "danger" }) {
  return (
    <button
      aria-label={label}
      title={label}
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "grid h-8 w-8 place-items-center rounded-md ring-1 disabled:cursor-not-allowed disabled:opacity-40",
        variant === "danger" ? "bg-rose-500/15 text-rose-200 ring-rose-500/20 hover:bg-rose-500/25" : "bg-panel/70 text-slate-200 ring-border hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

function buildChecklistReorderPayload(items: ProductionChecklistItem[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return [];
  const reordered = items.slice();
  [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
  return reordered.map((item, orderIndex) => ({ item_id: item.id, order_index: orderIndex + 1 }));
}

function orderToPayload(order?: ProductionOrder): Partial<CreateProductionOrderPayload> {
  if (!order) return {};
  return {
    numero_op: order.numero_op,
    cliente: order.cliente,
    projeto: order.projeto,
    modelo: order.modelo,
    quantidade: order.quantidade,
    setor: order.setor,
    data_inicio: order.data_inicio,
    data_entrega: order.data_entrega,
    prioridade: order.prioridade,
    status: order.status,
    observacoes: order.observacoes ?? null,
  };
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("pt-BR");
}

function formatDateTime(date?: string | null) {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString("pt-BR");
}

function StatusBadge({ status }: { status: ProductionStatus }) {
  const labelMap: Record<ProductionStatus, string> = {
    aberta: "Aberta",
    em_andamento: "Em andamento",
    aguardando: "Aguardando",
    pronta: "Pronta",
    arquivada: "Arquivada",
  };
  const classMap: Record<ProductionStatus, string> = {
    aberta: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    em_andamento: "border-sky-500/20 bg-sky-500/10 text-sky-300",
    aguardando: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    pronta: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    arquivada: "border-slate-500/20 bg-slate-500/10 text-slate-300",
  };
  return <span className={clsx("rounded-full border px-3 py-1 text-xs font-semibold", classMap[status])}>{labelMap[status]}</span>;
}

function PriorityBadge({ priority }: { priority: ProductionPriority }) {
  const labelMap: Record<ProductionPriority, string> = {
    baixa: "Baixa",
    normal: "Normal",
    alta: "Alta",
    urgente: "Urgente",
  };
  const classMap: Record<ProductionPriority, string> = {
    baixa: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    normal: "border-slate-500/20 bg-slate-500/10 text-slate-300",
    alta: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    urgente: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  };
  return <span className={clsx("rounded-full border px-3 py-1 text-xs font-semibold", classMap[priority])}>{labelMap[priority]}</span>;
}

export default ProductionOrderDrawer;
