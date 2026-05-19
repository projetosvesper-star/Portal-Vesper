# Implementação — UI do Kanban Engine (Portal Vesper)

Data: 2026-05-18

## 1. O que foi implementado

- Página funcional do **Kanban Engine** integrada ao backend real (`/api/kanban`).
- Listagem e seleção de boards com suporte às rotas:
  - `/kanban` (auto-seleciona um board)
  - `/kanban/:boardId`
- Carregamento de colunas e cards do board.
- KPIs básicos (total, em andamento, atrasados, concluídos, arquivados).
- Criação e edição de cards via modal.
- Drawer de detalhes do card (checklist, comentários, activity log).
- Arquivar/restaurar card.
- Drag-and-drop entre colunas com **dnd kit**.
- Invalidação/refetch via **TanStack Query** após mutations e via **eventos WebSocket** do Kanban.
- Respeito às permissões do usuário para mostrar/ocultar ações na UI.

## 2. Componentes criados

Em `apps/web/src/modules/kanban/components/`:

- `BoardSelector.tsx`
- `BoardToolbar.tsx`
- `KanbanBoard.tsx`
- `KanbanColumn.tsx`
- `KanbanCard.tsx`
- `CardDetailDrawer.tsx`
- `CardFormDialog.tsx`
- `ChecklistPanel.tsx`
- `CommentsPanel.tsx`
- `ActivityPanel.tsx`
- `EmptyKanbanState.tsx`

## 3. APIs consumidas

Arquivo: `apps/web/src/modules/kanban/api.ts`

- Boards
  - `GET /api/kanban/boards`
  - `POST /api/kanban/boards`
  - `GET /api/kanban/boards/{board_id}`
  - `PATCH /api/kanban/boards/{board_id}`
  - `DELETE /api/kanban/boards/{board_id}`
- Columns
  - `GET /api/kanban/boards/{board_id}/columns`
  - `POST /api/kanban/boards/{board_id}/columns`
  - `PATCH /api/kanban/columns/{column_id}`
  - `DELETE /api/kanban/columns/{column_id}?force=false`
  - `POST /api/kanban/boards/{board_id}/columns/reorder`
- Cards
  - `GET /api/kanban/boards/{board_id}/cards`
  - `POST /api/kanban/cards`
  - `GET /api/kanban/cards/{card_id}`
  - `PATCH /api/kanban/cards/{card_id}`
  - `DELETE /api/kanban/cards/{card_id}`
  - `POST /api/kanban/cards/{card_id}/move`
  - `POST /api/kanban/cards/{card_id}/archive`
  - `POST /api/kanban/cards/{card_id}/restore`
- Assignees
  - `POST /api/kanban/cards/{card_id}/assignees`
  - `DELETE /api/kanban/cards/{card_id}/assignees/{user_id}`
- Checklist
  - `GET /api/kanban/cards/{card_id}/checklist`
  - `POST /api/kanban/cards/{card_id}/checklist`
  - `PATCH /api/kanban/checklist/{item_id}`
  - `DELETE /api/kanban/checklist/{item_id}`
- Comments
  - `GET /api/kanban/cards/{card_id}/comments`
  - `POST /api/kanban/cards/{card_id}/comments`
  - `PATCH /api/kanban/comments/{comment_id}`
  - `DELETE /api/kanban/comments/{comment_id}`
- Attachments
  - `GET /api/kanban/cards/{card_id}/attachments`
  - `POST /api/kanban/cards/{card_id}/attachments`
  - `DELETE /api/kanban/cards/{card_id}/attachments/{attachment_id}`
- Activity
  - `GET /api/kanban/cards/{card_id}/activity`
  - `GET /api/kanban/boards/{board_id}/activity`

## 4. Permissões usadas na UI

Arquivo: `apps/web/src/modules/kanban/utils/permissions.ts`

- `kanban.board.create`, `kanban.board.edit`, `kanban.board.delete`
- `kanban.card.create`, `kanban.card.edit`, `kanban.card.move`
- `kanban.card.archive`, `kanban.card.restore`, `kanban.card.delete`
- `kanban.card.comment`, `kanban.card.checklist`, `kanban.card.attach`
- `kanban.activity.view`
- `kanban.admin` (bypass)

Obs.: as permissões são consumidas do `useAuthStore` (preenchidas pelo PortalShell via `/api/me/permissions`).

## 5. Drag-and-drop

- Libs instaladas:
  - `@dnd-kit/core`
  - `@dnd-kit/sortable`
  - `@dnd-kit/utilities`
  - `@dnd-kit/modifiers`
- Implementação:
  - `KanbanBoard` + `KanbanColumn` (droppable) + `KanbanCard` (sortable/draggable)
  - Move entre colunas chama `moveCard(cardId, { to_column_id, new_order_index })`
  - Update otimista simples (troca de `column_id`/`order_index`) e refetch após concluir
- Restrições nesta etapa:
  - reordenação detalhada dentro da mesma coluna não foi priorizada (mantido para próxima etapa).

## 6. WebSocket

- Foi criado um provider único para expor `subscribe()` sem abrir WebSockets paralelos:
  - `apps/web/src/shared/hooks/PortalWebSocketProvider.tsx`
- A página `KanbanEnginePage` assina eventos `kanban.*` e invalida queries relacionadas.

## 7. Comandos executados

- `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers --workspace=apps/web`
- `npm run build --workspace=apps/web`
- `npm run lint`
- `npm run typecheck`
- `npm run backend:test`

## 8. Resultado dos testes

- Web build: OK
- Lint (tsc --noEmit): OK
- Typecheck: OK
- Backend tests: OK (19 passed)

## 9. Problemas encontrados

- O projeto ainda não possui `shadcn/ui` instalado (não há `src/components/ui`), então os componentes do Kanban foram implementados com Tailwind + componentes básicos existentes (`Button`, `Input`) seguindo o tema dark premium.

## 10. O que ficou para próxima etapa

- Reordenação completa (precisa) dentro da mesma coluna (order_index) com UX mais rica.
- Melhorar seleção de responsável (picker de usuários) em vez de input UUID.
- Implementar edição/exclusão de comentários com regra “somente autor/admin” (quando UX e fluxo estiverem maduros).
- Implementar anexos no drawer (upload/attach/detach) usando MinIO/files do Portal.

