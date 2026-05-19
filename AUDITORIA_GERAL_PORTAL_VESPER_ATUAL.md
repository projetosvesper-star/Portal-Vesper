# Auditoria Geral Portal Vesper Atual

Data: 2026-05-19

## 1. Resumo Executivo

O Portal Vesper foi auditado de ponta a ponta considerando infraestrutura, backend, banco, seed, RBAC, frontend, WebSocket, Redis, MinIO, Tauri e Kanban Engine.

Resultado final: **GO tecnico para iniciar o desenho do Kanban Producao**, com pendencias nao bloqueantes documentadas. Os comandos obrigatorios passaram e os fluxos essenciais do Kanban Engine foram validados por testes automatizados, smoke API e navegador real. A movimentacao/reordenacao de cards foi validada por API/testes; o drag-and-drop visual por ponteiro precisa de confirmacao manual antes de considerar a UI fechada para release.

## 2. Estado Geral Do Projeto

- Monorepo npm com `apps/web`, `apps/desktop`, `backend`, `infra`, `docs` e `packages`.
- Backend FastAPI em `http://localhost:8000`.
- Frontend Vite em `http://127.0.0.1:5174`.
- API Docs em `http://localhost:8000/api/docs`.
- Docker Compose sobe PostgreSQL, Redis, MinIO e pgAdmin.
- Backend/worker existem no Docker Compose via profile `app`.
- Kanban Engine existe no backend e frontend, sem implementar ainda Kanban Producao especifico.

## 3. O Que Foi Testado

- `git status`, scripts npm, workspaces, migrations, routers FastAPI, OpenAPI, estrutura Kanban e testes.
- `npm run infra:up`.
- `npm run backend:migrate`.
- `npm run backend:seed` duas vezes.
- `npm run backend:test`.
- `npm run build --workspace=apps/web`.
- `npm run lint`.
- `npm run typecheck`.
- `ruff check backend/app backend/seeds backend/tests`.
- Health check, `/api/docs`, CORS de `127.0.0.1:5174` e `localhost:5174`.
- Login Admin, refresh token, logout, token invalido/ausente, RBAC e usuario sem permissao.
- Tabelas globais e tabelas Kanban no PostgreSQL.
- Senha Admin como bcrypt e refresh tokens com hash.
- WebSocket via subprotocolo, `ping`/`pong` e ausencia de token em URL nos logs recentes.
- Redis ping, `stream:module_events` e `stream:files`.
- Upload MinIO via backend, arquivo invalido rejeitado, presigned URL, anexo no Kanban.
- Navegador real: login, sidebar, Admin, Kanban, criacao de card pela UI, drawer e `WS online`.
- Reconnect WebSocket: backend local reiniciado e a aba voltou para `WS online` sem reload.
- Drag-and-drop visual: tentativa por automacao de ponteiro no navegador nao foi conclusiva; a regra de movimentacao/reordenacao passou por API e testes automatizados.

## 4. O Que Passou

- Infra Docker: PostgreSQL, Redis, MinIO e pgAdmin ativos.
- Migrations aplicadas.
- Seed idempotente executado duas vezes.
- OpenAPI disponivel com 47 paths e endpoint de mover card presente.
- Todas as tabelas esperadas foram encontradas.
- Admin ve 10 modulos.
- Admin possui permissoes Kanban.
- Usuario sem permissao admin recebe 403.
- Rota protegida sem token recebe 401.
- Login Admin funciona.
- Refresh token rotaciona.
- Logout revoga refresh token.
- Kanban cria board, colunas e card.
- Kanban edita card.
- Kanban move card entre colunas.
- Kanban reordena card na mesma coluna.
- Checklist cria e marca item como concluido.
- Comentario cria.
- Upload funciona.
- Anexo vincula ao card.
- Activity log registra eventos esperados.
- Arquivar/restaurar card funciona.
- Redis Streams recebem eventos.
- WebSocket responde `pong`.
- Frontend build/lint/typecheck passam.
- Backend tests passam.

## 5. O Que Falhou Inicialmente

### CRITICO

1. Build/lint/typecheck do frontend falhavam.
   - Causa: chamada `moveMutation.mutateAsync` usava `toColumnId` e `newOrderIndex` fora do contrato tipado.
   - Correcao: payload ajustado para `{ payload: { to_column_id, new_order_index } }`.

2. `PATCH /api/kanban/cards/{card_id}` retornava 500.
   - Causa: `updated_at` expirava apos `flush` e Pydantic tentava carregar atributo async fora de greenlet (`MissingGreenlet`).
   - Correcao: repository do Kanban passou a executar `refresh` apos updates que retornam entidades.

### ALTO

3. Rotas protegidas sem token retornavam 403 em vez de 401.
   - Causa: `HTTPBearer(auto_error=True)`.
   - Correcao: auth dependency agora usa `auto_error=False` e retorna 401 padronizado para credencial ausente.

4. Checagem estatica Python falhava no modulo Kanban.
   - Causa: import ausente de `UUID`, imports nao usados e nomes ambiguos em testes.
   - Correcao: imports corrigidos e `ruff --fix` aplicado.

5. UI ficava `WS offline` apos restart do backend.
   - Causa: provider WebSocket nao tinha reconexao apos fechamento da conexao.
   - Correcao: adicionado reconnect com backoff e preservada uma conexao por aba.

## 6. Correcoes Aplicadas

- `apps/web/src/modules/kanban/KanbanEnginePage.tsx`
  - Corrigido payload de movimentacao ao trocar coluna pela edicao do card.

- `backend/app/core/permissions.py`
  - Corrigido retorno 401 para rotas sem Bearer token.

- `backend/app/modules/kanban/events.py`
  - Adicionado import de `UUID`.

- `backend/app/modules/kanban/repository.py`
  - Adicionado `_flush_refresh`.
  - Atualizacoes que retornam entidade agora fazem `flush` + `refresh`.
  - Imports formatados.

- `backend/app/modules/kanban/service.py`
  - Removido import nao usado.

- `backend/tests/test_kanban_engine.py`
  - Teste de rota sem login agora espera 401.
  - Ajustado uso de data timezone-aware no fake repo.

- `apps/web/src/shared/hooks/PortalWebSocketProvider.tsx`
  - Adicionada reconexao automatica com backoff apos desconexao.

## 7. Bugs Encontrados

- CRITICO: build web quebrado por payload tipado incorreto. Corrigido.
- CRITICO: edicao de card retornava 500 por `MissingGreenlet`. Corrigido.
- ALTO: ausencia de token retornava 403 em vez de 401. Corrigido.
- MEDIO: warnings Pydantic por `Config` class-based e campo `schema` em schemas Kanban. Documentado.
- MEDIO: seed de desenvolvimento usa nomes de producao (`Producao`, `Ordem de Producao`). Nao bloqueia o Engine, mas deve ser revisado antes de separar Kanban Producao especifico.
- BAIXO: `apps/web/tsconfig.tsbuildinfo` aparece modificado no git status; deve ser tratado como artefato de build em decisao de limpeza/versionamento.

## 8. Riscos

### Criticos

Nenhum risco critico restante encontrado apos as correcoes.

### Altos

Nenhum risco alto restante encontrado apos as correcoes.

### Medios

- Pydantic v2 emite warnings de configuracao antiga (`class Config`). Recomendado migrar para `ConfigDict`.
- Campo `schema` nos schemas de Card Type sombreia atributo do `BaseModel`. Recomendado renomear internamente para `schema_json`/alias publico se o recurso for usado.
- Dados seedados de Kanban usam nomes de Producao. Recomendado decidir se o seed do Engine deve ser generico ou se este board deve migrar para o futuro modulo Kanban Producao.
- Nao foi validado `cargo check` porque Rust/Cargo nao esta no PATH.
- Drag-and-drop visual por ponteiro precisa de execucao manual confirmatoria. API, permissoes e persistencia de mover/reordenar passaram, mas a automacao visual nao confirmou o gesto.

### Baixos

- Warning do React Router sobre future flag v7 no console.
- Warning interno de `python-jose` usando `datetime.utcnow`.
- Worktree ja estava sujo antes desta auditoria; ha alteracoes de etapas anteriores que nao foram revertidas.

## 9. Seguranca

- `.env` existe localmente e esta ignorado pelo git.
- `.env.example` nao contem segredo real.
- Senha Admin dev esta apenas como credencial de desenvolvimento/seed.
- Senha Admin no banco esta com bcrypt.
- Refresh tokens parecem hash SHA-256 com tamanho esperado.
- WebSocket do frontend usa subprotocolo e nao query string.
- Logs recentes nao exibiram token, refresh token ou senha.
- Upload passa pelo backend, valida bucket, tipo e tamanho.
- Arquivo invalido `application/x-msdownload` foi rejeitado com 415.
- Usuario sem permissao foi bloqueado no backend.
- MinIO nao foi acessado diretamente pelo frontend no fluxo testado.

## 10. Backend

- FastAPI registra routers de auth, portal, admin, notifications, files, kanban e users.
- Prefixo `/api` consistente nos endpoints HTTP.
- `/api/health` retorna dependencias database/redis/storage como `true`.
- `/api/docs` abre.
- OpenAPI tem 47 paths.
- WebSocket `/ws` nao aparece na OpenAPI, o que e esperado.
- WebSocket reconecta apos reinicio do backend local.

## 11. Frontend

- Vite roda em `5174`.
- Login Admin validado no navegador.
- Sidebar dinamica mostra 10 modulos para Admin.
- Admin abre e mostra Usuarios, Modulos e Permissoes.
- Kanban abre, lista board e cards.
- Criacao de card pela UI foi validada.
- Drawer do card abre com Checklist, Comentarios, Anexos e Atividade.
- `WS online` aparece na topbar.
- Sem erro de console; apenas warning conhecido do React Router.

## 12. Infra

- `npm run infra:up` passou.
- PostgreSQL, Redis e MinIO estao saudaveis.
- pgAdmin esta ativo.
- Volumes persistentes existem no compose.
- Backend/worker permanecem no profile `app`, sem conflito com dev local.

## 13. Banco

Tabelas globais validadas:

- `users`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `user_permissions`
- `portal_modules`
- `module_permissions`
- `user_module_access`
- `audit_logs`
- `notifications`
- `refresh_tokens`
- `files`

Tabelas Kanban validadas:

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

## 14. Redis

- `PING` OK.
- `stream:module_events` possui eventos apos operacoes Kanban.
- `stream:files` possui eventos apos upload.
- WebSocket usa Pub/Sub para broadcast rapido.
- Pub/Sub nao foi tratado como historico confiavel.

## 15. MinIO

- MinIO respondeu pelo health do backend.
- Upload via backend funcionou.
- Presigned URL foi gerada.
- Arquivo foi vinculado como anexo Kanban.
- Arquivo invalido foi rejeitado.

## 16. WebSocket

- `/ws` autenticado via subprotocolo `portal-vesper`, `token.<jwt>`.
- `ping`/`pong` validado por script.
- Presenca online aparece antes do `pong`.
- Frontend mostrou `WS online`.
- Logs recentes mostram `WebSocket /ws`, sem query string com token.

## 17. Kanban

Validado por API, testes e UI:

- Criar board.
- Criar colunas.
- Criar card.
- Editar card.
- Mover card entre colunas.
- Reordenar card na mesma coluna.
- Bloquear movimento sem permissao.
- Checklist.
- Comentarios.
- Upload/anexo.
- Activity log.
- Arquivar/restaurar.

Observacao: mover/reordenar foram comprovados por API e testes automatizados. O gesto visual de drag-and-drop deve ser marcado no checklist manual antes de release da UI do Kanban.

Nao foi implementado Kanban Producao especifico nesta auditoria.

## 18. Teste Manual

Checklist manual criado em:

`TESTE_MANUAL_PORTAL_VESPER_ATUAL.md`

Itens visualmente executados nesta auditoria:

- Abrir frontend.
- Login Admin.
- Ver sidebar.
- Abrir Administracao.
- Ver usuarios/modulos/permissoes.
- Abrir Kanban.
- Criar card pela UI.
- Abrir drawer.
- Ver `WS online`.

Itens validados por API automatizada:

- Editar card.
- Mover card.
- Reordenar card.
- Checklist.
- Comentario.
- Upload/anexo.
- Activity.
- Permissoes.

## 19. Comandos Executados

- `git status --short`
- `npm run infra:up`
- `npm run backend:migrate`
- `npm run backend:seed`
- `npm run backend:seed`
- `npm run backend:test`
- `npm run build --workspace=apps/web`
- `npm run lint`
- `npm run typecheck`
- `backend/.venv/Scripts/python -m ruff check backend/app backend/seeds backend/tests`
- `cargo --version`

## 20. Resultado Dos Testes

- `backend:test`: 20 passed, 14 warnings.
- `build --workspace=apps/web`: passed.
- `lint`: passed.
- `typecheck`: passed.
- `ruff check`: passed.
- Smoke API: 31 checks passed, 0 failed.
- WebSocket script: connected, received `user.presence.updated` and `pong`.
- Visual browser: passed para login/sidebar/admin/kanban/criar card/drawer/WS online.
- Visual reconnect: passed; apos restart do backend, a aba voltou para `WS online`.
- Cargo: nao encontrado no PATH.

## 21. Arquivos Alterados Nesta Auditoria

- `apps/web/src/modules/kanban/KanbanEnginePage.tsx`
- `backend/app/core/permissions.py`
- `backend/app/modules/kanban/events.py`
- `backend/app/modules/kanban/repository.py`
- `backend/app/modules/kanban/service.py`
- `backend/tests/test_kanban_engine.py`
- `apps/web/src/shared/hooks/PortalWebSocketProvider.tsx`
- `AUDITORIA_GERAL_PORTAL_VESPER_ATUAL.md`
- `TESTE_MANUAL_PORTAL_VESPER_ATUAL.md`

Observacao: o worktree ja possuia alteracoes pendentes de etapas anteriores antes desta auditoria. Elas foram preservadas.

## 22. Pendencias

- Instalar Rust/Cargo e rodar validacao Tauri (`cargo check` ou build desktop).
- Decidir se seed `Producao` permanece no Engine generico ou migra para o futuro Kanban Producao.
- Migrar schemas Pydantic para `ConfigDict`.
- Avaliar renomeacao do campo `schema` em Card Type para remover warning.
- Decidir tratamento de `apps/web/tsconfig.tsbuildinfo` no versionamento.
- Criar testes frontend E2E automatizados se o projeto passar a exigir regressao visual/drag-and-drop em CI.
- Executar confirmacao manual do drag-and-drop visual no navegador antes de fechar release da UI do Kanban.

## 23. Go/No-Go Para Comecar Kanban Producao

**GO tecnico com pendencias medias/baixas.**

Todos os criterios essenciais exigidos foram validados:

- login funciona;
- sidebar funciona;
- backend funciona;
- migrations/seeds passam;
- WebSocket funciona;
- Kanban carrega;
- criar card funciona;
- editar card funciona;
- mover card funciona;
- reordenar card funciona;
- checklist funciona;
- comentarios funcionam;
- anexos/upload funcionam;
- build/lint/typecheck/backend:test passam.

Restricao do GO: a proxima etapa pode iniciar Kanban Producao, mas a UI generica do Kanban ainda precisa de confirmacao manual do drag-and-drop visual antes de ser tratada como pronta para release operacional.

## 24. Proximo Prompt Recomendado

```text
Agora vamos iniciar o Kanban Producao especifico do Portal Vesper. Antes de implementar, audite o Kanban Engine atual e proponha o modelo de dominio de Producao separado do Engine generico, incluindo entidades, permissoes, eventos, telas e migracoes, sem quebrar o Kanban Engine existente.
```
