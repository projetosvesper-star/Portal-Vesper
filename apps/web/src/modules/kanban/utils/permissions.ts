import { useAuthStore } from "../../../shared/auth/store";

function has(permissionKey: string) {
  const permissions = useAuthStore.getState().permissions ?? [];
  return permissions.includes(permissionKey) || permissions.includes("kanban.admin");
}

export function canCreateBoard() {
  return has("kanban.board.create");
}
export function canEditBoard() {
  return has("kanban.board.edit");
}
export function canDeleteBoard() {
  return has("kanban.board.delete");
}

export function canCreateCard() {
  return has("kanban.card.create");
}
export function canEditCard() {
  return has("kanban.card.edit");
}
export function canMoveCard() {
  return has("kanban.card.move");
}
export function canArchiveCard() {
  return has("kanban.card.archive");
}
export function canRestoreCard() {
  return has("kanban.card.restore");
}
export function canDeleteCard() {
  return has("kanban.card.delete");
}
export function canAssignCard() {
  // backend possui endpoint dedicado kanban.card.assign, mas o PATCH do card pode aceitar assigned_to via kanban.card.edit
  return has("kanban.card.assign") || has("kanban.card.edit");
}
export function canCommentCard() {
  return has("kanban.card.comment");
}
export function canChecklistCard() {
  return has("kanban.card.checklist");
}
export function canAttachCard() {
  return has("kanban.card.attach");
}
export function canViewActivity() {
  return has("kanban.activity.view");
}
