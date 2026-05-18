import { apiRequest } from "../../shared/api/client";

export type KanbanBoard = {
  id: string;
  key?: string | null;
  name: string;
  board_type: string;
};

export type KanbanCard = {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  priority: "low" | "medium" | "high" | "critical";
};

export async function listBoards() {
  return apiRequest<KanbanBoard[]>("/api/kanban/boards");
}

export async function getBoard(boardId: string) {
  return apiRequest<KanbanBoard>(`/api/kanban/boards/${boardId}`);
}

export async function listCards(boardId: string) {
  return apiRequest<KanbanCard[]>(`/api/kanban/boards/${boardId}/cards`);
}

