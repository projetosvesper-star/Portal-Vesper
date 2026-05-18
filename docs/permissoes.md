# Permissoes

O modelo usa RBAC com permissoes granulares no formato `modulo.acao`.

Tabelas principais:

- `users`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `user_permissions`
- `portal_modules`
- `module_permissions`
- `user_module_access`

O frontend usa `/api/me/modules` para exibir a sidebar, mas o backend sempre valida acesso com `require_permission()` ou `require_module_access()`.

Rotas diretas no frontend tambem passam por uma protecao visual por modulo. Isso melhora UX, mas nao substitui a validacao do backend.

## Perfis iniciais

- Administrador: acesso total.
- Gestor: acesso operacional sem administracao total.
- Usuario: acesso basico.
- TI: HelpDesk, Controle TI, Chat e Atalhos.
- Comercial: Propostas, Chat e Kanban limitado.
- Compras: Compras, Chat e Kanban limitado.
- Producao: Kanban, Chat e HelpDesk limitado.

## Permissoes Kanban Engine

As permissoes do Kanban Engine seguem o padrao `kanban.*` e sao granulares por recurso:

- `kanban.view`
- `kanban.board.*` (view/create/edit/delete/manage_permissions)
- `kanban.column.*` (view/create/edit/delete/reorder)
- `kanban.card.*` (view/create/edit/delete/archive/restore/move/reorder/assign/comment/attach/checklist)
- `kanban.activity.view`
- `kanban.audit.view`
- `kanban.admin`

Referencia completa (inclui descricao de cada chave): `backend/app/modules/kanban/permissions.py` e `docs/kanban-engine.md`.
