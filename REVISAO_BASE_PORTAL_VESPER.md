# Revisao Base Portal Vesper

Data: 2026-05-18

## 1. O Que Foi Revisado

- Estrutura do monorepo npm, workspaces e scripts principais.
- Docker Compose de desenvolvimento para PostgreSQL, Redis, MinIO, pgAdmin, backend e worker.
- Backend FastAPI, roteadores, prefixo `/api`, health check e OpenAPI em `/api/docs`.
- Configuracao por ambiente, `.env.example`, CORS, JWT, storage, Redis e upload.
- Modelos SQLAlchemy, Alembic, seed inicial, RBAC, usuarios, perfis, permissoes e modulos.
- Autenticacao por username/senha, access token, refresh token, logout e dependencias de permissao.
- Auditoria, notificacoes, arquivos, MinIO, Redis Pub/Sub, Redis Streams e WebSocket.
- Frontend React, API client, refresh automatico, estado de autenticacao, rotas protegidas, shell, sidebar dinamica e administracao.
- Tauri 2.0, configuracao de dev/build, capabilities e ausencia de regra de negocio no desktop.
- Testes minimos de backend e build/typecheck do frontend.

## 2. O Que Foi Corrigido

- Scripts do backend passaram a usar o Python da venv local (`backend/.venv`) para reduzir erro de PATH no Windows.
- `infra:up` agora sobe a infraestrutura base sem iniciar backend/worker por padrao; backend/worker ficam no profile `app`.
- Adicionado `infra:app` para subir backend/worker via Docker quando desejado.
- Corrigido seed idempotente para evitar `MissingGreenlet` ao reexecutar o seed com dados ja existentes.
- Adicionada validacao de configuracao em producao: CORS com `*` e JWT curto sao bloqueados.
- Adicionados limites e lista de tipos permitidos para upload.
- Upload agora valida bucket permitido, tamanho, tipo e permissao de modulo antes de gravar no StorageService.
- Notificacoes agora possuem service central que grava no banco, publica Redis Stream e envia evento WebSocket.
- WebSocket agora escuta canais Redis `ws:broadcast`, `ws:user:*` e `ws:module:*`.
- WebSocket ganhou heartbeat `ping`/`pong` e eventos de presenca online/offline.
- Frontend passou a abrir WebSocket autenticado e exibir status `WS online`.
- Frontend passou a carregar permissoes/modulos no auth store e proteger rotas por modulo.
- API client do frontend agora tenta refresh token automatico em 401 e limpa sessao se o refresh falhar.
- Rotas 403 e 404 foram adicionadas.
- Admin recebeu protecao por modulo/permissao e listagens funcionais para usuarios, modulos e permissoes.
- Adicionado endpoint `DELETE /api/admin/roles/{role_id}` protegido e auditado.
- Auditoria de criacao/edicao/exclusao de roles agora registra alteracoes de permissoes.
- Tauri teve permissao shell removida da base para manter capabilities minimas.
- Porta de desenvolvimento do web foi fixada em `5174` para evitar conflito com outro projeto local em `localhost:5173`.
- Tauri devUrl foi ajustado para `http://127.0.0.1:5174`.
- WebSocket do frontend passou a enviar JWT por subprotocolo, nao por query string, evitando vazamento em logs de URL.
- Uvicorn local/Docker passou a rodar com `--no-access-log`.
- Adicionado favicon SVG do Portal Vesper para remover erro 404 de favicon no console.
- `.gitignore` passou a ignorar saidas locais do Playwright MCP.
- Documentacao foi atualizada para setup Windows, porta 5174, Rust/Cargo, Docker profiles, RBAC, storage, WebSocket, Redis e deploy.

## 3. O Que Estava Correto

- Separacao geral entre backend, frontend, desktop, infra, packages e docs.
- Stack definida foi preservada: FastAPI, React, Tauri 2.0, PostgreSQL, Redis, MinIO.
- Login por username ja estava alinhado com a regra do projeto.
- Senha inicial do Admin estava concentrada no seed e documentada como temporaria.
- Tabelas principais da fundacao existem: users, roles, permissions, modules, audit_logs, notifications, refresh_tokens e files.
- Migrations Alembic estavam aplicaveis em PostgreSQL.
- Modulos iniciais estavam registrados e renderizados por permissao.
- OpenAPI estava configurado em `/api/docs`.
- Docker para PostgreSQL, Redis e MinIO estava funcional.

## 4. Problemas Encontrados

- O login no frontend falhava com `Failed to fetch` quando o backend nao estava rodando ou quando CORS/porta de frontend nao batiam.
- Havia outro Vite local em `localhost:5173`, apontando para outro projeto, criando risco de abrir a aplicacao errada.
- O seed falhava na segunda execucao por lazy loading assincrono em roles/usuarios.
- WebSocket por query string fazia o JWT aparecer em log de servidor.
- Upload aceitava pouca validacao estrutural antes da revisao.
- Rotas protegidas do frontend dependiam muito da UI e precisavam de bloqueio explicito por modulo.
- Console do frontend tinha erro 404 de favicon.
- Rust/Cargo nao esta instalado ou nao esta no PATH desta maquina, entao `cargo check`/build Tauri nao foi validado.

## 5. Problemas Que Ainda Precisam De Decisao Humana

- Definir dominios/hosts reais para `CORS_ORIGINS` em producao.
- Definir politica final de backup: PostgreSQL, MinIO e eventual espelho no NAS.
- Definir tamanho maximo e tipos finais de arquivo por modulo antes de liberar uploads reais.
- Definir se backend/worker vao rodar em Docker no servidor dedicado ou se o backend local sera usado apenas em desenvolvimento.
- Instalar Rust/Cargo para validar build real do Tauri no Windows.
- Definir politica de rotacao de logs e retencao de auditoria.
- Definir se o token em WebSocket por query deve ser removido totalmente apos a fase de testes.

## 6. Comandos Executados

- `npm install` - passou.
- `npm run infra:up` - passou; PostgreSQL, Redis, MinIO e pgAdmin ficaram ativos.
- `npm run backend:migrate` - passou.
- `npm run backend:seed` - falhou inicialmente por `MissingGreenlet`; corrigido e passou depois.
- `npm run backend:dev` - passou; backend ativo em `http://localhost:8000`.
- `npm run dev:web` - passou; frontend ativo em `http://127.0.0.1:5174`.
- `npm run build --workspace=apps/web` - passou.
- `npm run lint` - passou.
- `npm run typecheck` - passou.
- `npm run backend:test` - passou.
- `backend/.venv/Scripts/python -m ruff check backend/app backend/seeds backend/tests` - passou.
- `cargo --version` - Cargo nao encontrado no PATH.

## 7. Resultado Dos Testes

- Backend: 11 testes passaram.
- Cobertura funcional dos testes:
  - Health check.
  - Login Admin.
  - Token invalido.
  - Refresh token com rotacao.
  - Listagem de modulos do usuario.
  - Bloqueio de modulo sem permissao.
  - Permissao admin/superuser.
  - Criacao de notificacao com evento Redis/WebSocket mockado.
  - WebSocket autenticado com subprotocolo e `ping`/`pong`.
  - Upload com StorageService mockado.
- Aviso residual: dependencia `python-jose` usa `datetime.utcnow()` internamente e emite warning de depreciacao no Python 3.13.

## 8. Pontos De Atencao Antes Do Kanban Engine

- Criar o modelo do Kanban como modulo isolado, sem acoplar regra no frontend/Tauri.
- Definir eventos do Kanban antes de implementar realtime: cards, colunas, movimentacao, comentarios e auditoria.
- Definir permissoes granulares do Kanban alem das atuais `kanban.view` e `kanban.card.view`.
- Definir se anexos do Kanban usam bucket geral `portal-files` ou bucket proprio futuro.
- Manter Redis Streams para eventos importantes e Pub/Sub apenas para broadcast rapido.
- Garantir migrations pequenas e reversiveis por etapa.
- Adicionar testes de permissao por acao no Kanban desde o primeiro endpoint real.

## 9. Lista De Arquivos Alterados

- `.env.example`
- `.gitignore`
- `README.md`
- `package.json`
- `infra/docker-compose.yml`
- `backend/.dockerignore`
- `backend/pyproject.toml`
- `backend/app/core/config.py`
- `backend/app/core/websocket.py`
- `backend/app/modules/admin/router.py`
- `backend/app/modules/files/router.py`
- `backend/app/modules/notifications/router.py`
- `backend/app/modules/notifications/service.py`
- `backend/seeds/initial_seed.py`
- `backend/tests/conftest.py`
- `backend/tests/test_files.py`
- `backend/tests/test_login.py`
- `backend/tests/test_modules.py`
- `backend/tests/test_notifications.py`
- `backend/tests/test_permissions.py`
- `backend/tests/test_websocket.py`
- `apps/web/index.html`
- `apps/web/package.json`
- `apps/web/vite.config.ts`
- `apps/web/public/favicon.svg`
- `apps/web/src/app/router.tsx`
- `apps/web/src/shared/api/client.ts`
- `apps/web/src/shared/auth/store.ts`
- `apps/web/src/shared/auth/ProtectedModuleRoute.tsx`
- `apps/web/src/shared/hooks/usePortalWebSocket.ts`
- `apps/web/src/shared/layout/PortalShell.tsx`
- `apps/web/src/shared/layout/Topbar.tsx`
- `apps/web/src/modules/system/ForbiddenPage.tsx`
- `apps/web/src/modules/system/NotFoundPage.tsx`
- `apps/desktop/package.json`
- `apps/desktop/src-tauri/Cargo.toml`
- `apps/desktop/src-tauri/capabilities/default.json`
- `apps/desktop/src-tauri/src/lib.rs`
- `apps/desktop/src-tauri/tauri.conf.json`
- `docs/arquitetura.md`
- `docs/deploy-servidor.md`
- `docs/modulos.md`
- `docs/permissoes.md`
- `docs/setup-dev.md`
- `docs/storage.md`
- `docs/websocket-events.md`
- `REVISAO_BASE_PORTAL_VESPER.md`

## 10. Proximo Passo Recomendado

A base esta pronta para iniciar o Kanban Engine como primeiro modulo real, com uma etapa inicial focada apenas no backend do dominio Kanban:

- entidades e migrations;
- permissoes granulares;
- endpoints protegidos;
- auditoria de movimentacao;
- eventos Redis/WebSocket;
- testes de regras e permissoes;
- placeholders frontend conectados apenas ao minimo necessario.

Nao recomendo iniciar UI completa do Kanban antes de fechar o modelo de dominio e eventos.
