import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Edit, Archive, RotateCw } from "lucide-react";

import productionQueryKeys from "./queryKeys";
import {
  getProductionOrder,
  updateProductionOrder,
  listProductionChecklist,
  createProductionChecklistItem,
  updateProductionChecklistItem,
  deleteProductionChecklistItem,
  reorderProductionChecklistItems,
  listProductionActivity,
  archiveProductionOrder,
  restoreProductionOrder,
} from "./api";
import type { ProductionOrder, ProductionChecklistItem } from "./types";
import { Button } from "../../shared/components/Button";
import { useToast } from "../../shared/components/ToastProvider";

type Props = { orderId: string; onClose: () => void };

export function ProductionOrderDrawer({ orderId, onClose }: Props) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState(false);

  const orderQuery = useQuery({ queryKey: productionQueryKeys.orderDetail(orderId), queryFn: () => getProductionOrder(orderId) });
  const checklistQuery = useQuery({ queryKey: productionQueryKeys.checklist(orderId), queryFn: () => listProductionChecklist(orderId) });
  const activityQuery = useQuery({ queryKey: productionQueryKeys.activity(orderId), queryFn: () => listProductionActivity(orderId) });

  const order = orderQuery.data as ProductionOrder | undefined;

  const updateOrderMutation = useMutation({
    mutationFn: ({ payload }: { payload: Partial<ProductionOrder> }) => updateProductionOrder(orderId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productionQueryKeys.orders }),
        queryClient.invalidateQueries({ queryKey: productionQueryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: productionQueryKeys.orderDetail(orderId) }),
        queryClient.invalidateQueries({ queryKey: productionQueryKeys.tv }),
      ]);
      setEditing(false);
      toast.success("OP atualizada", "Alterações salvas com sucesso.");
    },
    onError: (err) => toast.error("Falha ao atualizar OP", (err as Error).message),
  });

  const archiveMutation = useMutation({ mutationFn: () => archiveProductionOrder(orderId), onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: productionQueryKeys.orders });
    await queryClient.invalidateQueries({ queryKey: productionQueryKeys.dashboard });
    toast.success("OP arquivada", "A OP foi arquivada com sucesso.");
    onClose();
  }, onError: (err) => toast.error("Falha ao arquivar OP", (err as Error).message) });

  const restoreMutation = useMutation({ mutationFn: () => restoreProductionOrder(orderId), onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: productionQueryKeys.orders });
    await queryClient.invalidateQueries({ queryKey: productionQueryKeys.dashboard });
    toast.success("OP restaurada", "A OP foi restaurada com sucesso.");
    onClose();
  }, onError: (err) => toast.error("Falha ao restaurar OP", (err as Error).message) });

  const addChecklistMutation = useMutation({ mutationFn: ({ title }: { title: string }) => createProductionChecklistItem(orderId, title), onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: productionQueryKeys.checklist(orderId) });
    await queryClient.invalidateQueries({ queryKey: productionQueryKeys.orders });
  }, onError: (err) => toast.error("Falha ao adicionar item", (err as Error).message) });

  const updateChecklistMutation = useMutation({ mutationFn: ({ itemId, payload }: { itemId: string; payload: Partial<ProductionChecklistItem> }) => updateProductionChecklistItem(itemId, payload), onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: productionQueryKeys.checklist(orderId) });
    await queryClient.invalidateQueries({ queryKey: productionQueryKeys.orders });
  }, onError: (err) => toast.error("Falha ao atualizar item", (err as Error).message) });

  const deleteChecklistMutation = useMutation({ mutationFn: (itemId: string) => deleteProductionChecklistItem(itemId), onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: productionQueryKeys.checklist(orderId) });
    await queryClient.invalidateQueries({ queryKey: productionQueryKeys.orders });
  }, onError: (err) => toast.error("Falha ao remover item", (err as Error).message) });

  const reorderChecklistMutation = useMutation({ mutationFn: (items: { item_id: string; order_index: number }[]) => reorderProductionChecklistItems(orderId, items), onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: productionQueryKeys.checklist(orderId) });
    await queryClient.invalidateQueries({ queryKey: productionQueryKeys.orders });
  }, onError: (err) => toast.error("Falha ao reordenar checklist", (err as Error).message) });

  const percentual = useMemo(() => {
    if (!order) return 0;
    return Number(order.percentual_checklist) || 0;
  }, [order]);

  const [editForm, setEditForm] = useState<Partial<ProductionOrder>>({});

  useEffect(() => {
    if (order) setEditForm(order);
  }, [order]);

  useEffect(() => {
    // refetch when open
    orderQuery.refetch();
    checklistQuery.refetch();
    activityQuery.refetch();
  }, [orderId]);

  if (orderQuery.isLoading) return <div className="p-4">Carregando...</div>;
  if (orderQuery.isError) return <div className="p-4 text-red-400">Erro ao carregar OP.</div>;

  return (
    <div className="fixed right-0 top-0 h-full w-[480px] bg-panel/95 border-l border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{order?.numero_op} <span className="text-sm text-slate-400">{order?.modelo}</span></h3>
          <p className="text-xs text-slate-300">{order?.cliente} — {order?.projeto}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setEditing((v) => !v)}><Edit className="h-4 w-4" /> Editar</Button>
          {!order?.is_archived ? (
            <Button onClick={() => archiveMutation.mutate()}><Archive className="h-4 w-4" /> Arquivar</Button>
          ) : (
            <Button onClick={() => restoreMutation.mutate()}><RotateCw className="h-4 w-4" /> Restaurar</Button>
          )}
          <Button onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <section className="rounded border border-border bg-panel/40 p-3">
          <p className="text-sm text-slate-300">Status: <strong className="text-white">{order?.status}</strong></p>
          <p className="text-sm text-slate-300">Prioridade: <strong className="text-white">{order?.prioridade}</strong></p>
          <p className="text-sm text-slate-300">Percentual checklist: <strong className="text-white">{percentual}%</strong></p>
          <p className="text-sm text-slate-300">Data entrega: <strong className="text-white">{order?.data_entrega ?? "—"}</strong></p>
          <p className="text-sm text-slate-300">Setor: <strong className="text-white">{order?.setor ?? "—"}</strong></p>
          <p className="text-sm text-slate-300">Card: <strong className="text-white">{order?.card_id}</strong></p>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-white">Checklist</h4>
          <div className="mt-2 space-y-2">
            {(checklistQuery.data ?? []).slice().sort((a: ProductionChecklistItem, b: ProductionChecklistItem) => a.order_index - b.order_index).map((item: ProductionChecklistItem, idx: number, arr: ProductionChecklistItem[]) => (
              <div key={item.id} className="flex items-center justify-between gap-2 rounded border border-border p-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={item.is_done} onChange={(e) => updateChecklistMutation.mutate({ itemId: item.id, payload: { is_done: e.target.checked } })} />
                  <div>
                    <div className={item.is_done ? "line-through text-slate-500" : "text-white"}>{item.title}</div>
                    {item.description ? <div className="text-xs text-slate-400">{item.description}</div> : null}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button disabled={idx === 0 || reorderChecklistMutation.isPending} onClick={() => {
                    const copy = arr.map((it) => ({ item_id: it.id, order_index: it.order_index }));
                    const prev = copy[idx - 1]; const cur = copy[idx]; const tmp = prev.order_index; prev.order_index = cur.order_index; cur.order_index = tmp; reorderChecklistMutation.mutate(copy);
                  }}>↑</button>
                  <button disabled={idx === arr.length - 1 || reorderChecklistMutation.isPending} onClick={() => {
                    const copy = arr.map((it) => ({ item_id: it.id, order_index: it.order_index }));
                    const next = copy[idx + 1]; const cur = copy[idx]; const tmp = next.order_index; next.order_index = cur.order_index; cur.order_index = tmp; reorderChecklistMutation.mutate(copy);
                  }}>↓</button>
                  <button onClick={() => deleteChecklistMutation.mutate(item.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); const input = (e.target as any).elements?.title as HTMLInputElement; if (!input?.value?.trim()) return; addChecklistMutation.mutate({ title: input.value.trim() }); input.value = ""; }} className="mt-3 flex gap-2">
            <input name="title" placeholder="Novo item" className="flex-1 rounded border border-border bg-slate-950 px-3 py-2 text-sm text-white" />
            <Button type="submit">Adicionar</Button>
          </form>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-white">Resumo / Edição</h4>
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const payload: Partial<ProductionOrder> = {
                  numero_op: editForm.numero_op,
                  cliente: editForm.cliente ?? null,
                  projeto: editForm.projeto ?? null,
                  modelo: editForm.modelo ?? null,
                  quantidade: editForm.quantidade ?? null,
                  setor: editForm.setor ?? null,
                  data_entrega: editForm.data_entrega ?? null,
                  prioridade: editForm.prioridade,
                  status: editForm.status,
                  observacoes: editForm.observacoes ?? null,
                };
                updateOrderMutation.mutate({ payload });
              }}
              className="space-y-2"
            >
              <input value={editForm.numero_op ?? ""} onChange={(e) => setEditForm((s) => ({ ...s, numero_op: e.target.value }))} className="w-full rounded border border-border bg-slate-950 px-2 py-1 text-sm text-white" />
              <input value={editForm.cliente ?? ""} onChange={(e) => setEditForm((s) => ({ ...s, cliente: e.target.value }))} className="w-full rounded border border-border bg-slate-950 px-2 py-1 text-sm text-white" placeholder="Cliente" />
              <input value={editForm.projeto ?? ""} onChange={(e) => setEditForm((s) => ({ ...s, projeto: e.target.value }))} className="w-full rounded border border-border bg-slate-950 px-2 py-1 text-sm text-white" placeholder="Projeto" />
              <input value={editForm.modelo ?? ""} onChange={(e) => setEditForm((s) => ({ ...s, modelo: e.target.value }))} className="w-full rounded border border-border bg-slate-950 px-2 py-1 text-sm text-white" placeholder="Modelo" />
              <div className="flex gap-2">
                <input type="number" value={editForm.quantidade ?? "" as any} onChange={(e) => setEditForm((s) => ({ ...s, quantidade: e.target.value ? Number(e.target.value) : null }))} className="w-1/2 rounded border border-border bg-slate-950 px-2 py-1 text-sm text-white" placeholder="Quantidade" />
                <input type="date" value={editForm.data_entrega ?? "" as any} onChange={(e) => setEditForm((s) => ({ ...s, data_entrega: e.target.value || null }))} className="w-1/2 rounded border border-border bg-slate-950 px-2 py-1 text-sm text-white" />
              </div>
              <select value={editForm.prioridade ?? "normal"} onChange={(e) => setEditForm((s) => ({ ...s, prioridade: e.target.value as any }))} className="w-full rounded border border-border bg-slate-950 px-2 py-1 text-sm text-white">
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
              <select value={editForm.status ?? "aberta"} onChange={(e) => setEditForm((s) => ({ ...s, status: e.target.value as any }))} className="w-full rounded border border-border bg-slate-950 px-2 py-1 text-sm text-white">
                <option value="aberta">Aberta</option>
                <option value="em_andamento">Em andamento</option>
                <option value="aguardando">Aguardando</option>
                <option value="pronta">Pronta</option>
              </select>
              <textarea value={editForm.observacoes ?? ""} onChange={(e) => setEditForm((s) => ({ ...s, observacoes: e.target.value }))} className="w-full rounded border border-border bg-slate-950 px-2 py-1 text-sm text-white" placeholder="Observações" />
              <div className="flex gap-2">
                <Button type="submit" disabled={updateOrderMutation.isPending}>Salvar</Button>
                <Button onClick={() => { setEditing(false); setEditForm(order ?? {}); }}>Cancelar</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-1 text-sm text-slate-300">
              <div>Observações: <div className="text-white">{order?.observacoes ?? "-"}</div></div>
            </div>
          )}
        </section>
        <section>
          <h4 className="text-sm font-semibold text-white">Atividade</h4>
          <div className="mt-2 space-y-2 max-h-40 overflow-auto">
            {(activityQuery.data ?? [])?.length === 0 ? (
              <p className="text-sm text-slate-400">Sem atividade recente.</p>
            ) : (
              (activityQuery.data ?? []).map((act: any) => (
                <div key={act.id} className="rounded border border-border p-2">
                  <div className="text-xs text-slate-400">{new Date(act.created_at).toLocaleString()}</div>
                  <div className="text-sm text-white">{act.action}</div>
                  {act.new_value ? <div className="text-xs text-slate-300">{JSON.stringify(act.new_value)}</div> : null}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProductionOrderDrawer;
