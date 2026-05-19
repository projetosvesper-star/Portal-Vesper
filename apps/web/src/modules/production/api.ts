import { apiRequest } from "../../shared/api/client";

import type {
  CreateProductionOrderPayload,
  ProductionChecklistItem,
  ProductionDashboard,
  ProductionOrder,
  ProductionTemplate,
  ProductionTVResponse,
} from "./types";

export async function listProductionOrders() {
  return apiRequest<ProductionOrder[]>("/api/kanban/producao/ops");
}

export async function createProductionOrder(payload: CreateProductionOrderPayload) {
  return apiRequest<ProductionOrder>("/api/kanban/producao/ops", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listProductionTemplates() {
  return apiRequest<ProductionTemplate[]>("/api/kanban/producao/checklist-templates");
}

export async function getProductionDashboard() {
  return apiRequest<ProductionDashboard>("/api/kanban/producao/dashboard");
}

export async function getProductionTVPreview() {
  return apiRequest<ProductionTVResponse>("/api/kanban/producao/tv?mode=list&limit=8&include_done=false");
}

export async function getProductionOrder(orderId: string) {
  return apiRequest<ProductionOrder>(`/api/kanban/producao/ops/${orderId}`);
}

export async function updateProductionOrder(orderId: string, payload: Partial<CreateProductionOrderPayload>) {
  return apiRequest<ProductionOrder>(`/api/kanban/producao/ops/${orderId}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function archiveProductionOrder(orderId: string) {
  return apiRequest<ProductionOrder>(`/api/kanban/producao/ops/${orderId}/archive`, { method: "POST" });
}

export async function restoreProductionOrder(orderId: string) {
  return apiRequest<ProductionOrder>(`/api/kanban/producao/ops/${orderId}/restore`, { method: "POST" });
}

import type { ProductionActivity } from "./types";

export async function listProductionActivity(orderId: string) {
  return apiRequest<ProductionActivity[]>(`/api/kanban/producao/ops/${orderId}/activity`);
}

export async function listProductionChecklist(orderId: string) {
  return apiRequest<ProductionChecklistItem[]>(`/api/kanban/producao/ops/${orderId}/checklist`);
}

export async function createProductionChecklistItem(orderId: string, title: string) {
  return apiRequest<ProductionChecklistItem>(`/api/kanban/producao/ops/${orderId}/checklist`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function updateProductionChecklistItem(itemId: string, payload: Partial<Pick<ProductionChecklistItem, "title" | "is_done">>) {
  return apiRequest<ProductionChecklistItem>(`/api/kanban/producao/checklist/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteProductionChecklistItem(itemId: string) {
  return apiRequest(`/api/kanban/producao/checklist/${itemId}`, { method: "DELETE" });
}

export async function reorderProductionChecklistItems(orderId: string, items: { item_id: string; order_index: number }[]) {
  return apiRequest<ProductionChecklistItem[]>(`/api/kanban/producao/ops/${orderId}/checklist/reorder`, {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}
