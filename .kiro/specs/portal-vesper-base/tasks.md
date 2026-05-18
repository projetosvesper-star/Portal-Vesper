# Implementation Plan: Portal Vesper Base

## Overview

Implementação incremental da base arquitetural do Portal Vesper: monorepo, infraestrutura Docker, backend FastAPI com autenticação JWT + RBAC, módulos dinâmicos, auditoria, notificações, WebSocket, storage MinIO, frontend React com layout dark premium e shell Tauri 2.0.

A stack é TypeScript + Python. Toda lógica de negócio e validação de segurança reside no backend. O frontend é camada de apresentação pura.

---

## Tasks

- [x] 1. Estrutura do monorepo e arquivos raiz
  - [x] 1.1 Criar estrutura de diretórios do monorepo
    - Criar pastas: `apps/desktop`, `apps/web`, `backend/app/core`, `backend/app/modules`, `backend/app/shared`, `backend/alembic/versions`, `backend/seeds`, `backend/tests`, `packages/ui/src`, `packages/types/src`, `packages/config/src`, `infra`, `docs`
    - _Requirements: 1.1_

  - [x] 1.2 Criar arquivos de configuração raiz
    - Criar `package.json` raiz com workspaces (`apps/*`, `packages/*`) e scripts: `dev`, `build`, `lint`, `typecheck`
    - Criar `.gitignore` cobrindo `.env`, `node_modules/`, `dist/`, `build/`, `__pycache__/`, `*.pyc`, `*.db`, `*.sqlite`, `coverage/`, `.kiro/backups/`
    - Criar `.env.example` com todas as variáveis documentadas (sem valores reais): `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `MINIO_*`, `VITE_API_URL`, `VITE_WS_URL`, etc.
    - Criar `README.md` com pré-requisitos, instalação, configuração e execução; avisar que a senha `Vesper@890` do seed deve ser trocada em produção
    - _Requirements: 1.2, 1.3, 1.4, 1.5_


- [x] 2. Infraestrutura Docker Compose
  - [x] 2.1 Criar `infra/docker-compose.yml`
    - Definir serviços: `postgres:16-alpine`, `redis:7-alpine`, `minio/minio:latest`, `dpage/pgadmin4:latest`
    - Configurar healthchecks em todos os serviços (`pg_isready`, `redis-cli ping`, `curl minio/health/live`)
    - Configurar volumes nomeados: `portal_vesper_postgres`, `portal_vesper_redis`, `portal_vesper_minio`, `portal_vesper_pgadmin`
    - Expor portas: 5432, 6379, 9000, 9001, 5050; política `restart: unless-stopped`
    - Ler todas as credenciais exclusivamente de variáveis de ambiente (sem valores hardcoded)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 2.2 Criar script SQL de inicialização do PostgreSQL
    - Criar `infra/postgres/init.sql` com extensão `uuid-ossp` habilitada
    - _Requirements: 2.1_


- [x] 3. Backend — Configuração e dependências
  - [x] 3.1 Criar `backend/pyproject.toml`
    - Definir dependências pinadas: `fastapi`, `uvicorn[standard]`, `sqlalchemy[asyncio]`, `alembic`, `asyncpg`, `pydantic-settings`, `bcrypt`, `python-jose[cryptography]`, `redis[hiredis]`, `minio`, `python-multipart`
    - Definir dependências de dev/test: `pytest`, `pytest-asyncio`, `httpx`, `pytest-cov`, `factory-boy`
    - Configurar `[tool.pytest.ini_options]` com `asyncio_mode = "auto"` e `testpaths = ["tests"]`
    - _Requirements: 3.1_

  - [x] 3.2 Criar `backend/app/core/config.py`
    - Implementar classe `Settings` com `pydantic_settings.BaseSettings`
    - Campos: `ENVIRONMENT`, `LOG_LEVEL`, `VERSION`, `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `ALLOWED_ORIGINS`, `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_SECURE`
    - Implementar `get_settings()` com `@lru_cache`
    - _Requirements: 3.2_

  - [x] 3.3 Criar `backend/app/core/database.py`
    - Criar engine assíncrono SQLAlchemy com `create_async_engine` usando `DATABASE_URL`
    - Criar `AsyncSessionLocal` com `async_sessionmaker`
    - Implementar dependency `get_session()` para injeção via FastAPI `Depends`
    - _Requirements: 3.1, 4.1_


- [ ] 4. Backend — Camada core de segurança e infraestrutura
  - [-] 4.1 Criar `backend/app/core/security.py`
    - Implementar `create_access_token(user_id, secret_key)` → JWT HS256 com `sub`, `iat`, `exp`, `type: "access"`
    - Implementar `create_refresh_token()` → `(token_raw, token_hash)` usando `secrets.token_urlsafe(64)` + `bcrypt.hashpw`
    - Implementar `verify_password(plain, hashed)` e `hash_password(plain)` com bcrypt fator 12
    - Implementar `decode_access_token(token)` com tratamento de `ExpiredSignatureError` e `InvalidTokenError`
    - _Requirements: 5.3, 5.4, 5.8_

  - [-] 4.2 Criar `backend/app/core/redis.py`
    - Criar cliente Redis assíncrono com `redis.asyncio.from_url(REDIS_URL)`
    - Implementar `get_redis()` como dependency FastAPI
    - Implementar helpers: `publish(channel, data)`, `xadd(stream, data)`, `xread(stream, last_id)`
    - _Requirements: 3.1, 9.4, 11.7_

  - [-] 4.3 Criar `backend/app/core/websocket.py`
    - Implementar classe `WebSocketManager` com `_connections: Dict[str, List[WebSocket]]`
    - Métodos: `connect(ws, user_id)`, `disconnect(ws, user_id)`, `send_to_user(user_id, event)`, `broadcast(event)`, `publish_to_redis(channel, event)`, `start_redis_listener(redis_url)`
    - Instanciar `ws_manager = WebSocketManager()` como singleton
    - _Requirements: 11.3, 11.4, 11.5, 11.6, 11.7_

  - [-] 4.4 Criar `backend/app/core/permissions.py`
    - Implementar `get_current_user(credentials, session)` — decodifica JWT, busca usuário, valida `is_active` e `deleted_at`
    - Implementar `require_permission(permission_key)` — factory de dependency com superuser bypass
    - Implementar `get_user_permissions(session, user_id)` — carrega permissões via roles
    - _Requirements: 7.5, 7.6, 7.7_

  - [-] 4.5 Criar `backend/app/core/storage.py`
    - Implementar `StorageService` com cliente MinIO
    - Métodos: `ensure_buckets()`, `upload(data, original_name, mime_type, bucket)`, `get_presigned_url(bucket, stored_name, expires_hours)`, `delete(bucket, stored_name)`
    - Definir lista `BUCKETS` com os 7 buckets do portal
    - _Requirements: 12.1, 12.2_

  - [ ] 4.6 Criar `backend/app/core/audit.py`
    - Implementar `AuditService` com método `publish(action, resource_type, resource_id, user_id, ip_address, details)` assíncrono via `XADD stream:audit`
    - Garantir que falha no publish não propague exceção para o chamador (try/except com log)
    - _Requirements: 9.4, 9.6_


- [ ] 5. Backend — Camada shared e app factory
  - [~] 5.1 Criar `backend/app/shared/`
    - `base_model.py`: `Base(DeclarativeBase)`, `TimestampMixin` (`created_at`, `updated_at`), `UUIDMixin` (`id` UUID PK)
    - `exceptions.py`: `AppError`, `AuthError(401)`, `ForbiddenError(403)`, `NotFoundError(404)`, `ConflictError(409)`, `StorageError(503)`
    - `pagination.py`: schema `PaginatedResponse[T]` com `items`, `total`, `page`, `limit`, `pages`
    - `middleware.py`: `RequestLoggingMiddleware` que loga método, path, status, duração e `request_id`
    - _Requirements: 3.4, 3.6_

  - [~] 5.2 Criar `backend/app/main.py`
    - Implementar factory `create_app()` retornando instância FastAPI
    - Registrar middleware: CORS (via `ALLOWED_ORIGINS`), `RequestLoggingMiddleware`
    - Registrar todos os routers sob prefixo `/api/v1`
    - Implementar `GET /health` retornando `{"status": "ok", "version": settings.VERSION}`
    - No startup: verificar conectividade com PostgreSQL e Redis; inicializar `StorageService.ensure_buckets()`; iniciar `ws_manager.start_redis_listener()`
    - Expor `/docs` e `/redoc` apenas quando `ENVIRONMENT != "production"`
    - _Requirements: 3.1, 3.3, 3.5, 3.7, 3.8, 12.2_


- [ ] 6. Backend — Modelos ORM e migration inicial
  - [~] 6.1 Criar modelos ORM de todos os módulos
    - `modules/auth/models.py`: `RefreshToken` (id, user_id FK, token_hash, expires_at, is_revoked, created_at)
    - `modules/users/models.py`: `User` (id, username UK, name, password_hash, is_active, is_superuser, created_at, updated_at, deleted_at)
    - `modules/roles/models.py`: `Role` (id, name UK, description, soft delete), `Permission` (id, key UK, description), `UserRole` (user_id FK, role_id FK), `RolePermission` (role_id FK, permission_id FK)
    - `modules/portal_modules/models.py`: `PortalModule` (id, key UK, name, route, icon, order_index, is_active, required_permission, soft delete)
    - `modules/notifications/models.py`: `Notification` (id, user_id FK, title, message, type, is_read, read_at, created_at)
    - `modules/audit_logs/models.py`: `AuditLog` (id, user_id FK nullable, action, resource_type, resource_id, details JSONB, ip_address, created_at)
    - `modules/files/models.py`: `File` (id, uploaded_by FK, original_name, stored_name, bucket, path, mime_type, size_bytes, created_at, updated_at)
    - _Requirements: 4.2, 4.4, 4.5, 4.6_

  - [~] 6.2 Configurar Alembic e criar migration inicial
    - Criar `backend/alembic.ini` e `backend/alembic/env.py` com suporte a async engine e import automático de todos os modelos
    - Criar `backend/alembic/versions/001_initial_schema.py` com todas as tabelas, constraints e índices:
      - Índices em FKs: `user_roles.user_id`, `user_roles.role_id`, `role_permissions.role_id`, `role_permissions.permission_id`, `refresh_tokens.user_id`, `refresh_tokens.expires_at`, `audit_logs.user_id`, `audit_logs.action`, `audit_logs.resource_type`, `audit_logs.created_at`, `notifications.user_id`, `notifications.is_read`, `notifications.created_at`, `files.uploaded_by`
      - Índices em colunas de filtro: `users.username`, `permissions.key`, `portal_modules.key`, `portal_modules.order_index`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_


- [ ] 7. Backend — Seed inicial
  - [~] 7.1 Criar `backend/seeds/initial_seed.py`
    - Criar as 35 permissões iniciais (lista completa do design: `admin.*`, `chat.*`, `kanban.*`, `propostas.*`, `compras.*`, `helpdesk.*`, `controle_ti.*`, `atalhos.*`, `ia.*`, `automacoes_n8n.*`, `system.*`)
    - Criar os 7 perfis iniciais com suas permissões: Administrador (todas), Gestor, Usuário, TI, Comercial, Compras, Produção
    - Criar usuário Admin: `username="Admin"`, `name="Administrador"`, `is_superuser=true`, senha `Vesper@890` hasheada com bcrypt fator 12
    - Registrar os 10 módulos iniciais com `key`, `name`, `route`, `icon`, `order_index`, `required_permission` conforme tabela do design
    - Verificar existência antes de inserir (idempotente — seguro para re-execução)
    - _Requirements: 6.6, 6.7, 7.8, 7.9, 8.4_


- [~] 8. Checkpoint — Backend core funcional
  - Garantir que `alembic upgrade head` aplica a migration sem erros
  - Garantir que o seed executa sem erros em banco limpo e em banco já populado
  - Garantir que `GET /health` retorna 200
  - Perguntar ao usuário se há dúvidas antes de continuar.

- [ ] 9. Backend — Módulo Auth
  - [~] 9.1 Criar schemas, service e router do módulo auth
    - `modules/auth/schemas.py`: `LoginRequest(username, password)`, `TokenResponse(access_token, refresh_token, token_type, expires_in)`, `RefreshRequest(refresh_token)`
    - `modules/auth/service.py`: `AuthService` com métodos `authenticate(username, password, ip)`, `refresh(refresh_token)`, `logout(user_id, refresh_token)`
      - `authenticate`: busca usuário, verifica bcrypt, cria JWT + refresh token, publica audit log
      - `refresh`: valida token no banco com bcrypt, revoga antigo, emite novo par
      - `logout`: revoga refresh token no banco
    - `modules/auth/router.py`: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
    - Retornar HTTP 401 genérico para credenciais inválidas (não revelar qual campo está errado)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9_

  - [ ]* 9.2 Escrever testes de integração para auth
    - Testar login com credenciais válidas → 200 com JWT e refresh token
    - Testar login com credenciais inválidas → 401
    - Testar refresh com token válido → 200 com novos tokens
    - Testar refresh com token inválido/expirado → 401
    - Testar logout → 200 e token revogado
    - _Requirements: 18.2, 18.3_


- [ ] 10. Backend — Módulos Users, Roles e Permissions
  - [~] 10.1 Criar módulo users
    - `modules/users/schemas.py`: `UserCreate(username, name, password)`, `UserUpdate(name?, is_active?)`, `UserResponse(id, username, name, is_active, is_superuser, roles, created_at, updated_at)`
    - `modules/users/service.py`: `UserService` com CRUD + validação de username único (409 em conflito) + soft delete via `is_active=false`
    - `modules/users/router.py`: `GET /users`, `POST /users`, `GET /users/{id}`, `PATCH /users/{id}` — todos protegidos por `require_permission("admin.users.view")` ou `admin.users.create/edit`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [~] 10.2 Criar módulo roles e permissions
    - `modules/roles/schemas.py`: `RoleCreate(name, description, permission_ids[])`, `RoleResponse(id, name, permissions[])`
    - `modules/roles/service.py`: `RoleService` com CRUD + associação de permissões
    - `modules/roles/router.py`: `GET /roles`, `POST /roles`, `GET /roles/{id}`, `PATCH /roles/{id}`, `DELETE /roles/{id}` — protegidos por `admin.roles.*`
    - `modules/permissions/router.py`: `GET /permissions` — protegido por `admin.permissions.view`
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ]* 10.3 Escrever testes de integração para RBAC
    - Testar endpoint protegido sem JWT → 401
    - Testar endpoint protegido com JWT mas sem permissão → 403
    - Testar endpoint protegido com superuser → 200
    - _Requirements: 18.5, 18.6_


- [ ] 11. Backend — Módulo Portal Modules
  - [~] 11.1 Criar módulo portal_modules
    - `modules/portal_modules/schemas.py`: `ModuleCreate(key, name, route, icon, order_index, required_permission)`, `ModuleResponse(id, key, name, route, icon, order_index, is_active, required_permission)`
    - `modules/portal_modules/service.py`: `ModuleService` com CRUD + query de módulos filtrados por RBAC do usuário (JOIN com `user_roles`, `role_permissions`, `permissions`)
      - Superuser recebe todos os módulos ativos
      - Módulos com `is_active=false` excluídos independentemente de permissão
    - `modules/portal_modules/router.py`:
      - `GET /modules/my-modules` — retorna módulos do usuário autenticado ordenados por `order_index`
      - `GET /modules`, `POST /modules`, `PATCH /modules/{id}`, `DELETE /modules/{id}` — protegidos por `admin.modules.manage`
    - _Requirements: 8.1, 8.2, 8.3, 8.6_

  - [ ]* 11.2 Escrever testes de integração para módulos
    - Testar `GET /modules/my-modules` retorna apenas módulos com permissão do usuário
    - Testar que módulo `is_active=false` não aparece na resposta
    - _Requirements: 18.4_


- [ ] 12. Backend — Módulos Notifications, Audit Logs e Files
  - [~] 12.1 Criar módulo notifications
    - `modules/notifications/schemas.py`: `NotificationResponse(id, title, message, type, is_read, created_at, read_at)`
    - `modules/notifications/service.py`: `NotificationService` com `list_for_user(user_id, page, limit)`, `mark_read(notification_id, user_id)`, `unread_count(user_id)`, `create(user_id, title, message, type)` + envio via WebSocket
    - `modules/notifications/router.py`: `GET /notifications`, `PATCH /notifications/{id}/read`, `GET /notifications/unread-count`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [~] 12.2 Criar módulo audit_logs
    - `modules/audit_logs/schemas.py`: `AuditLogResponse(id, user_id, action, resource_type, resource_id, details, ip_address, created_at)`
    - `modules/audit_logs/service.py`: `AuditLogService` com `list(page, limit, filters)` e worker que consome `stream:audit` e persiste no banco
    - `modules/audit_logs/router.py`: `GET /audit-logs` com paginação via `page` e `limit` — protegido por `admin.audit.view`
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

  - [~] 12.3 Criar módulo files
    - `modules/files/schemas.py`: `FileUploadResponse(id, original_name, url, mime_type, size_bytes)`, `FileMetadata`
    - `modules/files/service.py`: `FileService` com `upload(file, user_id, bucket)`, `get_metadata(file_id)`, `delete(file_id, user_id)` — trata `StorageError` retornando 503
    - `modules/files/router.py`: `POST /files/upload`, `GET /files/{file_id}`, `DELETE /files/{file_id}`
    - _Requirements: 12.3, 12.4, 12.5, 12.6_


- [ ] 13. Backend — Módulo WebSocket e placeholders
  - [~] 13.1 Criar endpoint WebSocket autenticado
    - `modules/websocket/router.py`: endpoint `WS /ws?token=<JWT>`
    - Rejeitar conexão com código 4001 se JWT inválido ou ausente
    - Ao conectar: chamar `ws_manager.connect(ws, user_id)` e enviar evento `connected`
    - Manter loop `receive_text()` para keepalive; ao desconectar: chamar `ws_manager.disconnect`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6_

  - [~] 13.2 Criar módulos placeholder no backend
    - Criar routers vazios (retornando 501 Not Implemented) para: `chat`, `kanban`, `propostas`, `compras`, `helpdesk`, `controle_ti`, `atalhos`, `ia`, `automacoes_n8n`
    - Registrar todos no `main.py` sob `/api/v1`
    - _Requirements: 8.4_

- [ ] 14. Backend — Fixtures de teste e testes mínimos
  - [~] 14.1 Criar `backend/tests/conftest.py`
    - Fixture `test_db`: banco PostgreSQL de teste com `alembic upgrade head` + rollback após cada teste
    - Fixture `client`: `AsyncClient` do httpx apontando para a app de teste
    - Fixture `auth_headers`: executa login com usuário Admin e retorna `{"Authorization": "Bearer <token>"}`
    - Fixture `user_headers`: cria usuário sem permissão admin e retorna headers
    - _Requirements: 18.7_

  - [~] 14.2 Criar testes mínimos obrigatórios
    - `tests/test_health.py`: `GET /health` → 200 com `{"status": "ok"}`
    - `tests/test_auth.py`: login válido → 200; login inválido → 401; refresh válido → 200; refresh inválido → 401; logout → 200
    - `tests/test_modules.py`: `GET /modules/my-modules` com usuário sem permissão → lista vazia ou filtrada; com admin → todos os módulos ativos
    - `tests/test_permissions.py`: endpoint protegido sem JWT → 401; com JWT sem permissão → 403
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_


- [~] 15. Checkpoint — Backend completo e testes passando
  - Executar `pytest backend/tests/` e garantir que todos os testes passam
  - Verificar que `GET /health`, auth, módulos e RBAC funcionam corretamente
  - Perguntar ao usuário se há ajustes antes de iniciar o frontend.

- [ ] 16. Frontend — Configuração base
  - [~] 16.1 Criar `apps/web/` com Vite + React + TypeScript
    - Inicializar projeto com `vite` template `react-ts`
    - Configurar `tsconfig.json` com `strict: true`, `paths` para `@/` apontando para `src/`
    - Instalar e configurar TailwindCSS v4 com tema dark como padrão
    - Instalar shadcn/ui e inicializar com tema `slate` dark
    - Instalar dependências: `react-router-dom`, `@tanstack/react-query`, `zustand`, `axios`, `lucide-react`
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [~] 16.2 Criar `packages/types/src/index.ts`
    - Exportar interfaces TypeScript: `User`, `Role`, `Permission`, `PortalModule`, `Notification`, `TokenResponse`, `WebSocketEvent`, `AuditLog`, `FileMetadata`, `PaginatedResponse<T>`
    - _Requirements: 13.1_

  - [~] 16.3 Criar `apps/web/src/store/auth.store.ts`
    - Implementar Zustand store com `persist` middleware (persiste apenas tokens)
    - Estado: `user`, `accessToken`, `refreshToken`, `permissions`, `isAuthenticated`
    - Actions: `setTokens`, `setUser`, `setPermissions`, `logout`
    - _Requirements: 13.3_


- [ ] 17. Frontend — API client e camada de API
  - [~] 17.1 Criar `apps/web/src/api/client.ts`
    - Criar instância Axios com `baseURL: import.meta.env.VITE_API_URL`
    - Interceptor de request: injeta `Authorization: Bearer <token>` de `useAuthStore`
    - Interceptor de response: captura 401, tenta refresh automático com fila de requisições pendentes, redireciona para `/login` se refresh falhar
    - _Requirements: 13.7, 13.8_

  - [~] 17.2 Criar módulos de API
    - `api/auth.api.ts`: `login(username, password)`, `refresh(refreshToken)`, `logout()`, `me()`
    - `api/modules.api.ts`: `getMyModules()`, `getModules()`, `createModule()`, `updateModule()`, `deleteModule()`
    - `api/users.api.ts`: `getUsers(page, limit)`, `createUser()`, `updateUser()`, `getUser(id)`
    - `api/roles.api.ts`: `getRoles()`, `createRole()`, `updateRole()`, `deleteRole()`
    - `api/notifications.api.ts`: `getNotifications()`, `markRead(id)`, `getUnreadCount()`
    - `api/audit.api.ts`: `getAuditLogs(page, limit)`
    - `api/files.api.ts`: `uploadFile(file, bucket?)`, `getFile(id)`, `deleteFile(id)`
    - _Requirements: 13.1, 13.2_


- [ ] 18. Frontend — Hooks e roteamento
  - [~] 18.1 Criar hooks customizados
    - `hooks/usePermission.ts`: `usePermission(permission: string): boolean` — verifica `is_superuser` ou `permissions.includes(permission)`
    - `hooks/useModules.ts`: TanStack Query para `getMyModules()` com `staleTime: 5min`
    - `hooks/useNotifications.ts`: TanStack Query para `getNotifications()` e `getUnreadCount()`
    - `hooks/useWebSocket.ts`: conecta ao WS com token, trata eventos (`system.notification.created`, `admin.module.updated`, `module.status.updated`, `admin.permission.updated`), reconecta após 3s em desconexão não-auth
    - _Requirements: 13.5, 11.1_

  - [~] 18.2 Criar roteamento com rotas protegidas
    - `router/index.tsx`: definir rotas — `/login` (público), `/` (AppLayout protegido), `/admin` (requer `admin.view`), `/chat`, `/kanban`, `/propostas`, `/compras`, `/helpdesk`, `/controle-ti`, `/atalhos`, `/ia`, `/automacoes`
    - `router/ProtectedRoute.tsx`: verifica `isAuthenticated` → redireciona para `/login`; verifica `requiredPermission` → redireciona para `/`
    - `App.tsx`: configurar `QueryClientProvider`, `RouterProvider`, `ThemeProvider`
    - _Requirements: 13.1, 13.6_


- [ ] 19. Frontend — Tela de Login
  - [~] 19.1 Criar `pages/LoginPage.tsx`
    - Formulário com campos `username` e `password`, botão de submit e logo "Portal Vesper"
    - Validação inline sem chamada à API para campos vazios
    - Ao submeter: chamar `login()`, armazenar tokens no Zustand, redirecionar para `/`
    - Exibir "Usuário ou senha inválidos" em erro 401 (sem revelar qual campo)
    - Desabilitar botão e exibir spinner durante requisição
    - Aplicar tema dark premium: fundo `#0a0f1e`, acentos cyan, card centralizado
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [ ] 20. Frontend — Layout base e componentes
  - [~] 20.1 Criar `layouts/Sidebar.tsx`
    - Renderizar módulos retornados por `useModules()` com ícone Lucide dinâmico, nome e rota
    - Aplicar estilo ativo/inativo via `NavLink` com classes dark premium (navy `#0d1526`, cyan ativo)
    - Logo "Portal Vesper" no topo com cor cyan
    - _Requirements: 14.1, 14.2, 14.3, 8.5_

  - [~] 20.2 Criar `layouts/TopBar.tsx` e componentes de notificação/usuário
    - `components/NotificationBell.tsx`: badge com `unread-count` atualizado via WebSocket; dropdown com lista de notificações
    - `components/UserMenu.tsx`: exibe nome do usuário; dropdown com botão logout
    - `layouts/TopBar.tsx`: título da página + `NotificationBell` + `UserMenu`
    - Ao clicar logout: chamar `POST /auth/logout`, limpar Zustand, redirecionar para `/login`
    - _Requirements: 14.4, 14.5, 14.6_

  - [~] 20.3 Criar `layouts/AppLayout.tsx`
    - Layout flex row com `Sidebar` (w-64) + área principal (flex col: `TopBar` + `<Outlet />`)
    - Inicializar `useWebSocket()` no mount do layout
    - Responsivo a partir de 1024px
    - _Requirements: 14.1, 14.7_


- [ ] 21. Frontend — Telas Dashboard, Admin e placeholders
  - [~] 21.1 Criar `pages/DashboardPage.tsx`
    - Cards de resumo: módulos disponíveis, notificações não lidas
    - Grid de `ModuleCard` com os módulos do usuário (ícone, nome, rota)
    - `components/ModuleCard.tsx`: card clicável com ícone Lucide, nome e rota
    - _Requirements: 14.1_

  - [~] 21.2 Criar `pages/AdminPage.tsx` com tabelas de administração
    - Seção Usuários: `components/admin/UsersTable.tsx` — tabela paginada com `username`, `name`, `is_active`, `roles`, ações editar/desativar
    - Seção Perfis: `components/admin/RolesTable.tsx` — tabela com nome e permissões
    - Seção Módulos: `components/admin/ModulesTable.tsx` — tabela com toggle ativar/desativar
    - Seção Logs de Auditoria: `components/admin/AuditLogsTable.tsx` — tabela paginada com `user`, `action`, `resource_type`, `resource_id`, `created_at`
    - Rota `/admin` protegida por `requiredPermission="admin.view"`; redirecionar para `/` se sem permissão
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [~] 21.3 Criar páginas placeholder para todos os módulos
    - Criar em `pages/modules/`: `ChatPage`, `KanbanPage`, `PropostasPage`, `ComprasPage`, `HelpdeskPage`, `ControleTiPage`, `AtalhosPage`, `IaPage`, `AutomacoesPage`
    - Cada página exibe ícone Lucide correspondente + título do módulo + texto "Este módulo será implementado na próxima etapa."
    - _Requirements: 8.4_


- [~] 22. Checkpoint — Frontend funcional
  - Verificar que login, sidebar dinâmica, notificações e WebSocket funcionam end-to-end
  - Verificar que `/admin` redireciona usuário sem permissão
  - Perguntar ao usuário se há ajustes visuais antes de continuar.

- [ ] 23. Desktop Shell — Tauri 2.0
  - [~] 23.1 Configurar `apps/desktop/` com Tauri 2.0
    - Inicializar projeto Tauri 2.0 com `cargo tauri init` apontando para `apps/web`
    - Criar `apps/desktop/tauri.conf.json` com:
      - `productName: "Portal Vesper"`, `version: "0.1.0"`, `identifier: "com.portalvesper.app"`
      - Janela: `title: "Portal Vesper"`, `width: 1280`, `height: 800`, `minWidth: 1280`, `minHeight: 720`, `center: true`
      - `build.frontendDist`: `../web/dist`; `build.devUrl`: `http://localhost:5173`
      - CSP: `default-src 'self'; connect-src 'self' http://localhost:8000 ws://localhost:8000`
      - Bundle targets: `["nsis", "msi"]` com `installMode: "perMachine"`, `languages: ["BrazilianPortuguese"]`
    - Configurar capabilities básicas (sem comandos Tauri expostos ao frontend na base)
    - Desabilitar DevTools e menu de contexto padrão em builds de produção
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_


- [ ] 24. Documentação técnica
  - [~] 24.1 Criar documentação em `docs/`
    - `docs/arquitetura.md`: visão geral da arquitetura, stack, diagrama de componentes, fluxo de dados, decisões técnicas (UUID PKs, soft delete, auditoria assíncrona, WebSocket + Redis Pub/Sub)
    - `docs/permissoes.md`: tabela completa das 35 permissões, escopos, perfis que as possuem e como adicionar novas permissões
    - `docs/modulos.md`: sistema de módulos dinâmicos, como registrar novos módulos, tabela dos 10 módulos iniciais com `key`, `route`, `icon`, `required_permission`
    - `docs/websocket-events.md`: tabela de todos os eventos WebSocket (tipo, canal Redis, payload, descrição), como consumir no frontend com `useWebSocket`
    - `docs/storage.md`: como usar `StorageService` para upload/download, lista de buckets, fluxo de upload com MinIO
    - `docs/setup-dev.md`: pré-requisitos (Docker, Node.js, Python, Rust), passo a passo para subir ambiente local, executar migrations, seed e iniciar backend/frontend
    - `docs/deploy-servidor.md`: instruções para deploy do backend (uvicorn + nginx), infraestrutura Docker em produção, variáveis de ambiente obrigatórias, checklist de segurança
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

- [~] 25. Checkpoint final — Verificação completa
  - Executar `pytest backend/tests/` — todos os testes devem passar
  - Verificar que `docker compose up -d` sobe todos os serviços com healthchecks OK
  - Verificar que `alembic upgrade head` + seed executam sem erros
  - Verificar que o frontend compila sem erros TypeScript (`tsc --noEmit`)
  - Perguntar ao usuário se há ajustes finais antes de considerar a base completa.


---

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia os requisitos correspondentes para rastreabilidade
- Checkpoints garantem validação incremental antes de avançar para a próxima fase
- O design não possui seção "Correctness Properties", portanto não há property-based tests — apenas testes unitários e de integração
- Senhas nunca hardcoded fora do seed; o seed usa `Vesper@890` apenas para o usuário Admin inicial — **trocar em produção**
- Nenhuma regra de negócio no frontend ou Tauri; o backend valida permissões em todos os endpoints
- Módulos de negócio (chat, kanban, etc.) são placeholders nesta etapa

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2"] },
    { "id": 6, "tasks": ["6.1"] },
    { "id": 7, "tasks": ["6.2"] },
    { "id": 8, "tasks": ["7.1"] },
    { "id": 9, "tasks": ["9.1", "10.1", "10.2", "11.1", "12.1", "12.2", "12.3", "13.1", "13.2"] },
    { "id": 10, "tasks": ["9.2", "10.3", "11.2", "14.1"] },
    { "id": 11, "tasks": ["14.2"] },
    { "id": 12, "tasks": ["16.1", "16.2", "16.3"] },
    { "id": 13, "tasks": ["17.1", "17.2"] },
    { "id": 14, "tasks": ["18.1", "18.2"] },
    { "id": 15, "tasks": ["19.1", "20.1"] },
    { "id": 16, "tasks": ["20.2"] },
    { "id": 17, "tasks": ["20.3"] },
    { "id": 18, "tasks": ["21.1", "21.2", "21.3"] },
    { "id": 19, "tasks": ["23.1"] },
    { "id": 20, "tasks": ["24.1"] }
  ]
}
```
