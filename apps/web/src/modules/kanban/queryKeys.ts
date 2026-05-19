export const kanbanQueryKeys = {
  boards: () => ["kanban", "boards"] as const,
  boardsFiltered: (filters: { boardType?: string | null; moduleContext?: string | null } = {}) =>
    ["kanban", "boards", filters.boardType ?? "all", filters.moduleContext ?? "all"] as const,
  board: (boardId: string) => ["kanban", "boards", boardId] as const,
  columns: (boardId: string) => ["kanban", "boards", boardId, "columns"] as const,
  cards: (boardId: string) => ["kanban", "boards", boardId, "cards"] as const,
  card: (cardId: string) => ["kanban", "cards", cardId] as const,
  checklist: (cardId: string) => ["kanban", "cards", cardId, "checklist"] as const,
  comments: (cardId: string) => ["kanban", "cards", cardId, "comments"] as const,
  attachments: (cardId: string) => ["kanban", "cards", cardId, "attachments"] as const,
  activity: (cardId: string) => ["kanban", "cards", cardId, "activity"] as const,
  boardActivity: (boardId: string) => ["kanban", "boards", boardId, "activity"] as const,
  tv: (boardId?: string | null, mode?: string) => ["kanban", "tv", boardId ?? "all", mode ?? "list"] as const,
};

export default kanbanQueryKeys;
