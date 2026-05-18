# Kanban Engine (Backend)

O **Kanban Engine** e o primeiro modulo real do Portal Vesper. Ele e um motor **generico** de quadros Kanban para evitar duplicacao entre:

- Kanban Producao
- Kanban Projetos
- Kanban Operacional
- HelpDesk (se necessario)
- Quadros customizados

Nesta etapa foi implementado **somente backend** (dominio, banco, permissoes, eventos, auditoria e testes). A UI completa (incluindo drag-and-drop) fica para a proxima etapa.

## Objetivos desta etapa

- Criar tabelas e modelos do motor generico (boards/columns/cards/types, checklist, comentarios, anexos, activity log e permissoes por quadro).
- Expor endpoints basicos de CRUD e operacoes de dominio (ex.: mover card).
- Publicar eventos via Redis Streams e WebSocket.
- Registrar activity logs por card/quadro e auditoria global para acoes criticas.

## Modelo de dados (tabelas)

Tabelas criadas (PostgreSQL):

- `kanban_boards`
- `kanban_columns`
- `kanban_card_types`
- `kanban_cards`
- `kanban_card_assignees`
- `kanban_checklist_items`
- `kanban_comments`
- `kanban_attachments`
- `kanban_activity_logs`
- `kanban_board_permissions`

Migracao: `backend/alembic/versions/0002_kanban_engine.py`.

## Permissoes

As permissoes do modulo ficam em `backend/app/modules/kanban/permissions.py`.

Resumo:

- `kanban.view`
- `kanban.board.*`
- `kanban.column.*`
- `kanban.card.*`
- `kanban.activity.view`
- `kanban.audit.view`
- `kanban.admin`

Observacao: o seed inicial associa as permissoes conforme os perfis (Administrador, Gestor, Producao, Comercial, Compras, TI, Usuario).

## Endpoints (FastAPI)

Prefixo: `/api/kanban`

Boards:

- `GET /boards`
- `POST /boards`
- `GET /boards/{board_id}`
- `PATCH /boards/{board_id}`
- `DELETE /boards/{board_id}` (arquiva)
- `GET /boards/{board_id}/permissions`
- `POST /boards/{board_id}/permissions`
- `DELETE /boards/{board_id}/permissions/{permission_id}`

Columns:

- `GET /boards/{board_id}/columns`
- `POST /boards/{board_id}/columns`
- `PATCH /columns/{column_id}`
- `DELETE /columns/{column_id}?force=false`
- `POST /boards/{board_id}/columns/reorder`

Cards:

- `GET /boards/{board_id}/cards`
- `POST /cards`
- `GET /cards/{card_id}`
- `PATCH /cards/{card_id}`
- `DELETE /cards/{card_id}` (soft delete)
- `POST /cards/{card_id}/move`
- `POST /cards/{card_id}/archive`
- `POST /cards/{card_id}/restore`

Assignees:

- `POST /cards/{card_id}/assignees`
- `DELETE /cards/{card_id}/assignees/{user_id}`

Checklist:

- `GET /cards/{card_id}/checklist`
- `POST /cards/{card_id}/checklist`
- `PATCH /checklist/{item_id}`
- `DELETE /checklist/{item_id}`

Comments:

- `GET /cards/{card_id}/comments`
- `POST /cards/{card_id}/comments`
- `PATCH /comments/{comment_id}`
- `DELETE /comments/{comment_id}`

Attachments:

- `GET /cards/{card_id}/attachments`
- `POST /cards/{card_id}/attachments`
- `DELETE /cards/{card_id}/attachments/{attachment_id}`

Activity:

- `GET /cards/{card_id}/activity`
- `GET /boards/{board_id}/activity`

## Eventos (Redis / WebSocket)

Eventos sao publicados com payload padrao:

```json
{
  "type": "kanban.card.moved",
  "payload": { "board_id": "...", "card_id": "...", "from_column_id": "...", "to_column_id": "...", "old_order_index": 1, "new_order_index": 2, "actor_user_id": "..." },
  "timestamp": "..."
}
```

Destino:

- Redis Stream: `stream:module_events` (campo `module_key=kanban`)
- Redis Pub/Sub (WebSocket): `ws:module:kanban`

Lista completa em `docs/websocket-events.md`.

## Regras de dominio (minimo)

- Card nao pode ser criado em coluna de outro quadro.
- Mover card valida coluna de destino e atualiza `column_id` e `order_index`.
- Comentario: editar/excluir apenas autor ou admin.
- Checklist: ao marcar como feito registra `done_by` e `done_at`.
- Anexos: exige `file_id` existente em `files` e impede duplicacao por card.
- Soft delete de card via `deleted_at`.

## Diferenca entre Kanban Engine e Kanban Producao especifico

O **Kanban Engine** possui apenas campos genericos e metadados (`metadata` JSONB).

Campos industriais, regras de OP, integracao com ordens, estoques, etc. devem ficar em tabelas futuras (ex.: `production_orders`) e se relacionar ao Kanban via `card_id`/`code`/relacionamentos, sem poluir `kanban_cards`.

## Proximos passos

- UI completa do Kanban (drag-and-drop, colunas, cards, filtros).
- Regras mais fortes de ordenacao/reorder (shifts e consistencia de order_index).
- Enforcar permissoes por quadro (`kanban_board_permissions`) e sharing.
- Especializacoes (Producao, Projetos, Operacional) com tabelas dedicadas.

