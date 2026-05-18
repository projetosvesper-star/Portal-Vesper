# WebSocket Events

Endpoint:

```text
WS /ws
```

O token deve ser JWT valido emitido pelo login. No frontend, o token e enviado pelo subprotocolo WebSocket `token.<jwt>` junto com `portal-vesper`, evitando gravar JWT em logs de URL. O backend ainda aceita `?token=...` apenas para compatibilidade e testes, mas clientes novos devem usar subprotocolo. Socket.IO nao e usado.

Eventos base:

- `system.notification.created`
- `user.presence.updated`
- `module.status.updated`
- `admin.permission.updated`
- `admin.module.updated`
- `file.uploaded`
- `kanban.*` (Kanban Engine)

Formato recomendado:

```json
{
  "type": "system.notification.created",
  "payload": {},
  "timestamp": "2026-05-18T10:00:00Z"
}
```

Redis Pub/Sub e usado para broadcast rapido entre instancias.

## Canais Redis

- `ws:broadcast`
- `ws:user:{user_id}`
- `ws:module:{module_key}`

O servidor escuta broadcast geral, canais por usuario e canais por modulo. Mensagens por modulo ainda sao redistribuidas como broadcast na base atual; modulos futuros podem evoluir para inscricao granular.

## Eventos Kanban Engine

Canal por modulo:

- `ws:module:kanban`

Stream:

- `stream:module_events` (campo `module_key=kanban`)

Eventos publicados:

- `kanban.board.created`
- `kanban.board.updated`
- `kanban.board.archived`
- `kanban.column.created`
- `kanban.column.updated`
- `kanban.column.reordered`
- `kanban.card.created`
- `kanban.card.updated`
- `kanban.card.moved`
- `kanban.card.archived`
- `kanban.card.restored`
- `kanban.card.deleted`
- `kanban.card.assigned`
- `kanban.comment.created`
- `kanban.comment.updated`
- `kanban.comment.deleted`
- `kanban.checklist.created`
- `kanban.checklist.updated`
- `kanban.attachment.created`
- `kanban.attachment.deleted`

## Heartbeat

O cliente pode enviar:

```json
{ "type": "ping" }
```

O servidor responde:

```json
{ "type": "pong", "timestamp": "..." }
```
