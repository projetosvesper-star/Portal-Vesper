import { apiRequest } from "../../shared/api/client";

import type {
  AttachFilePayload,
  CreateBoardPayload,
  CreateCardPayload,
  CreateChecklistItemPayload,
  CreateColumnPayload,
  CreateCommentPayload,
  KanbanActivityLog,
  KanbanAttachment,
  KanbanBoard,
  KanbanCard,
  KanbanCardAssignee,
  KanbanChecklistItem,
  KanbanColumn,
  KanbanComment,
  MoveCardPayload,
  ReorderColumnsPayload,
  UpdateBoardPayload,
  UpdateCardPayload,
  UpdateChecklistItemPayload,
  UpdateColumnPayload,
  UpdateCommentPayload,
  UUID,
} from "./types";

export async function listBoards() {
  return apiRequest<KanbanBoard[]>("/api/kanban/boards");
}

export async function createBoard(payload: CreateBoardPayload) {
  return apiRequest<KanbanBoard>("/api/kanban/boards", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getBoard(boardId: string) {
  return apiRequest<KanbanBoard>(`/api/kanban/boards/${boardId}`);
}

export async function updateBoard(boardId: string, payload: UpdateBoardPayload) {
  return apiRequest<KanbanBoard>(`/api/kanban/boards/${boardId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteBoard(boardId: string) {
  return apiRequest<KanbanBoard>(`/api/kanban/boards/${boardId}`, {
    method: "DELETE",
  });
}

// -----------------------------
// Columns
// -----------------------------

export async function listColumns(boardId: string) {
  return apiRequest<KanbanColumn[]>(`/api/kanban/boards/${boardId}/columns`);
}

export async function createColumn(boardId: string, payload: CreateColumnPayload) {
  return apiRequest<KanbanColumn>(`/api/kanban/boards/${boardId}/columns`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateColumn(columnId: string, payload: UpdateColumnPayload) {
  return apiRequest<KanbanColumn>(`/api/kanban/columns/${columnId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteColumn(columnId: string, force = false) {
  const query = force ? "?force=true" : "";
  return apiRequest<{ message: string }>(`/api/kanban/columns/${columnId}${query}`, { method: "DELETE" });
}

export async function reorderColumns(boardId: string, payload: ReorderColumnsPayload) {
  return apiRequest<KanbanColumn[]>(`/api/kanban/boards/${boardId}/columns/reorder`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// -----------------------------
// Cards
// -----------------------------

export async function listCards(boardId: string) {
  return apiRequest<KanbanCard[]>(`/api/kanban/boards/${boardId}/cards`);
}

export async function createCard(payload: CreateCardPayload) {
  return apiRequest<KanbanCard>("/api/kanban/cards", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCard(cardId: string) {
  return apiRequest<KanbanCard>(`/api/kanban/cards/${cardId}`);
}

export async function updateCard(cardId: string, payload: UpdateCardPayload) {
  return apiRequest<KanbanCard>(`/api/kanban/cards/${cardId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCard(cardId: string) {
  return apiRequest<KanbanCard>(`/api/kanban/cards/${cardId}`, {
    method: "DELETE",
  });
}

export async function moveCard(cardId: string, payload: MoveCardPayload) {
  return apiRequest<KanbanCard>(`/api/kanban/cards/${cardId}/move`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function archiveCard(cardId: string) {
  return apiRequest<KanbanCard>(`/api/kanban/cards/${cardId}/archive`, {
    method: "POST",
  });
}

export async function restoreCard(cardId: string) {
  return apiRequest<KanbanCard>(`/api/kanban/cards/${cardId}/restore`, {
    method: "POST",
  });
}

// -----------------------------
// Assignees
// -----------------------------

export async function addAssignee(cardId: string, userId: UUID) {
  return apiRequest<KanbanCardAssignee>(`/api/kanban/cards/${cardId}/assignees`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function removeAssignee(cardId: string, userId: UUID) {
  return apiRequest<{ message: string }>(`/api/kanban/cards/${cardId}/assignees/${userId}`, { method: "DELETE" });
}

// -----------------------------
// Checklist
// -----------------------------

export async function listChecklist(cardId: string) {
  return apiRequest<KanbanChecklistItem[]>(`/api/kanban/cards/${cardId}/checklist`);
}

export async function createChecklistItem(cardId: string, payload: CreateChecklistItemPayload) {
  return apiRequest<KanbanChecklistItem>(`/api/kanban/cards/${cardId}/checklist`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateChecklistItem(itemId: string, payload: UpdateChecklistItemPayload) {
  return apiRequest<KanbanChecklistItem>(`/api/kanban/checklist/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteChecklistItem(itemId: string) {
  return apiRequest<{ message: string }>(`/api/kanban/checklist/${itemId}`, { method: "DELETE" });
}

// -----------------------------
// Comments
// -----------------------------

export async function listComments(cardId: string) {
  return apiRequest<KanbanComment[]>(`/api/kanban/cards/${cardId}/comments`);
}

export async function createComment(cardId: string, payload: CreateCommentPayload) {
  return apiRequest<KanbanComment>(`/api/kanban/cards/${cardId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateComment(commentId: string, payload: UpdateCommentPayload) {
  return apiRequest<KanbanComment>(`/api/kanban/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteComment(commentId: string) {
  return apiRequest<{ message: string }>(`/api/kanban/comments/${commentId}`, { method: "DELETE" });
}

// -----------------------------
// Attachments
// -----------------------------

export async function listAttachments(cardId: string) {
  return apiRequest<KanbanAttachment[]>(`/api/kanban/cards/${cardId}/attachments`);
}

export async function attachFile(cardId: string, payload: AttachFilePayload) {
  return apiRequest<KanbanAttachment>(`/api/kanban/cards/${cardId}/attachments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteAttachment(cardId: string, attachmentId: string) {
  return apiRequest<{ message: string }>(`/api/kanban/cards/${cardId}/attachments/${attachmentId}`, {
    method: "DELETE",
  });
}

// -----------------------------
// Activity
// -----------------------------

export async function listCardActivity(cardId: string) {
  return apiRequest<KanbanActivityLog[]>(`/api/kanban/cards/${cardId}/activity`);
}

export async function listBoardActivity(boardId: string) {
  return apiRequest<KanbanActivityLog[]>(`/api/kanban/boards/${boardId}/activity`);
}
