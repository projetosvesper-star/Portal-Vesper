export const productionQueryKeys = {
  dashboard: ["kanban-producao", "dashboard"] as const,
  orders: ["kanban-producao", "orders"] as const,
  templates: ["kanban-producao", "templates"] as const,
  tv: ["kanban-producao", "tv"] as const,
  checklist: (orderId: string | null) => ["kanban-producao", "checklist", orderId] as const,
  orderDetail: (orderId: string | null) => ["kanban-producao", "order", orderId] as const,
  activity: (orderId: string | null) => ["kanban-producao", "activity", orderId] as const,
};

export default productionQueryKeys;
