# Design Document — Portal Vesper Base

## Overview

O Portal Vesper é um aplicativo desktop empresarial construído com Tauri 2.0 que unifica múltiplos sistemas legados em um único portal. Esta especificação de design cobre exclusivamente a **base arquitetural**: infraestrutura, autenticação JWT + RBAC, módulos dinâmicos, auditoria, notificações em tempo real via WebSocket, storage com MinIO e o layout visual base.

A arquitetura segue o princípio de **separação estrita de responsabilidades**: toda lógica de negócio e validação de segurança reside no Backend (FastAPI). O Frontend (React) e o Desktop Shell (Tauri) são puramente camadas de apresentação — o frontend esconde elementos sem permissão, mas o backend sempre valida.

### Decisões Técnicas Chave

- **UUID como PK** em todas as tabelas — evita enumeração e facilita sharding futuro
- **Soft delete** em `users`, `roles` e `portal_modules` — preserva histórico de auditoria
- **Auditoria assíncrona via Redis Streams** — não impacta latência das operações principais
- **WebSocket com Redis Pub/Sub** — permite escalar horizontalmente sem estado compartilhado em memória
- **Permissões granulares `modulo.acao`** — RBAC flexível sem explosão de roles
- **Superuser bypass** — `is_superuser=true` ignora verificação de permissões individuais
- **Refresh token com hash bcrypt** — tokens armazenados com segurança no banco


---

## Architecture

### Diagrama de Arquitetura de Alto Nível

```mermaid
graph TB
    subgraph Desktop["Desktop Shell — Tauri 2.0 (Rust)"]
        WebView["WebView (React App)"]
        TauriCore["Tauri Core\n(janela nativa, sem lógica de negócio)"]
    end

    subgraph Frontend["Frontend — React + Vite + TypeScript"]
        Router["React Router\n(rotas protegidas)"]
        Zustand["Zustand\n(auth state)"]
        TanStack["TanStack Query\n(server state + cache)"]
        Components["shadcn/ui Components\n(tema dark premium)"]
        WSClient["WebSocket Client\n(eventos em tempo real)"]
    end

    subgraph Backend["Backend — FastAPI + Python 3.12+"]
        AuthMod["Auth Module\n(JWT + Refresh Token)"]
        UserMod["Users Module\n(CRUD + RBAC)"]
        RoleMod["Roles Module\n(perfis + permissões)"]
        ModMod["Modules Module\n(registro dinâmico)"]
        AuditMod["Audit Module\n(logs assíncronos)"]
        NotifMod["Notifications Module\n(tempo real)"]
        StorageMod["Storage Module\n(MinIO abstraction)"]
        WSManager["WebSocket Manager\n(conexões ativas)"]
        Middleware["Middleware Stack\n(CORS, logging, auth)"]
    end

    subgraph Infra["Infraestrutura — Docker Compose"]
        PG["PostgreSQL 16\n:5432"]
        Redis["Redis 7\n:6379"]
        MinIO["MinIO\n:9000/:9001"]
        PgAdmin["pgAdmin\n:5050"]
    end

    WebView --> Frontend
    Frontend --> Backend
    WSClient <-->|"WS /api/v1/ws"| WSManager
    Backend --> PG
    Backend --> Redis
    Backend --> MinIO
    WSManager <-->|"Pub/Sub"| Redis
    AuditMod -->|"stream:audit"| Redis
    NotifMod -->|"stream:notifications"| Redis
```

### Fluxo de Dados Principal

```mermaid
sequenceDiagram
    participant U as Usuário
    participant T as Tauri Shell
    participant F as Frontend React
    participant B as Backend FastAPI
    participant DB as PostgreSQL
    participant R as Redis

    U->>T: Abre o aplicativo
    T->>F: Carrega WebView
    F->>F: Verifica token no Zustand
    F->>B: POST /api/v1/auth/login
    B->>DB: Valida credenciais (bcrypt)
    DB-->>B: Usuário encontrado
    B->>DB: Cria refresh token (hash bcrypt)
    B-->>F: JWT + refresh_token
    F->>F: Armazena no Zustand
    F->>B: GET /api/v1/me/modules
    B->>DB: Consulta módulos com permissão
    DB-->>B: Lista de módulos
    B-->>F: Módulos filtrados por RBAC
    F->>F: Renderiza sidebar dinâmica
    F->>B: WS /api/v1/ws?token=JWT
    B->>R: Subscribe ws:user:{user_id}
    B-->>F: {"type": "connected", "user_id": "..."}
```


---

## Components and Interfaces

### Backend — Estrutura de Módulos

```
backend/
├── app/
│   ├── main.py                    # FastAPI app factory, middleware, routers
│   ├── core/
│   │   ├── config.py              # Pydantic Settings (todas as env vars)
│   │   ├── database.py            # SQLAlchemy engine, session factory
│   │   ├── security.py            # JWT encode/decode, bcrypt helpers
│   │   ├── redis.py               # Redis client, pub/sub helpers
│   │   ├── websocket.py           # WebSocketManager class
│   │   ├── permissions.py         # Dependency: require_permission()
│   │   ├── storage.py             # MinIO client wrapper
│   │   └── audit.py               # Audit log publisher (async)
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── router.py          # /auth/login, /refresh, /logout, /me
│   │   │   ├── service.py         # AuthService
│   │   │   ├── schemas.py         # LoginRequest, TokenResponse
│   │   │   └── models.py          # RefreshToken ORM model
│   │   ├── users/
│   │   │   ├── router.py          # CRUD /users
│   │   │   ├── service.py         # UserService
│   │   │   ├── schemas.py         # UserCreate, UserUpdate, UserResponse
│   │   │   └── models.py          # User ORM model
│   │   ├── roles/
│   │   │   ├── router.py          # CRUD /roles
│   │   │   ├── service.py         # RoleService
│   │   │   ├── schemas.py         # RoleCreate, RoleResponse
│   │   │   └── models.py          # Role, Permission, RolePermission ORM
│   │   ├── portal_modules/
│   │   │   ├── router.py          # CRUD /modules + /me/modules
│   │   │   ├── service.py         # ModuleService
│   │   │   ├── schemas.py         # ModuleCreate, ModuleResponse
│   │   │   └── models.py          # PortalModule ORM model
│   │   ├── notifications/
│   │   │   ├── router.py          # GET /notifications, PATCH /{id}/read
│   │   │   ├── service.py         # NotificationService
│   │   │   ├── schemas.py         # NotificationResponse
│   │   │   └── models.py          # Notification ORM model
│   │   ├── audit_logs/
│   │   │   ├── router.py          # GET /audit-logs
│   │   │   ├── service.py         # AuditLogService
│   │   │   ├── schemas.py         # AuditLogResponse
│   │   │   └── models.py          # AuditLog ORM model
│   │   ├── files/
│   │   │   ├── router.py          # POST /upload, GET /{id}, DELETE /{id}
│   │   │   ├── service.py         # FileService
│   │   │   ├── schemas.py         # FileUploadResponse, FileMetadata
│   │   │   └── models.py          # File ORM model
│   │   └── websocket/
│   │       └── router.py          # WS /ws endpoint
│   └── shared/
│       ├── base_model.py          # BaseModel com id, created_at, updated_at
│       ├── exceptions.py          # AppError, AuthError, ForbiddenError, etc.
│       ├── pagination.py          # PaginatedResponse schema
│       └── middleware.py          # RequestLoggingMiddleware
├── alembic/
│   ├── env.py
│   └── versions/
│       └── 001_initial_schema.py  # Migration inicial com todas as tabelas
├── seeds/
│   ├── __init__.py
│   └── initial_seed.py            # Admin user, 10 módulos, 35 permissões, 7 roles
└── tests/
    ├── conftest.py                # Fixtures: test DB, test client, auth headers
    ├── test_health.py
    ├── test_auth.py
    ├── test_modules.py
    └── test_permissions.py
```

### Frontend — Estrutura de Componentes

```
apps/web/src/
├── main.tsx
├── App.tsx                        # Router + QueryClient + ThemeProvider
├── router/
│   ├── index.tsx                  # Definição de rotas
│   └── ProtectedRoute.tsx         # Verifica auth + permissão
├── store/
│   └── auth.store.ts              # Zustand: user, tokens, permissions
├── hooks/
│   ├── usePermission.ts           # usePermission(perm: string): boolean
│   ├── useModules.ts              # TanStack Query: /me/modules
│   ├── useNotifications.ts        # TanStack Query: /notifications
│   └── useWebSocket.ts            # WebSocket connection + event handlers
├── api/
│   ├── client.ts                  # Axios instance + interceptors (JWT refresh)
│   ├── auth.api.ts                # login, refresh, logout, me
│   ├── modules.api.ts             # getMyModules, getModules, CRUD
│   ├── users.api.ts               # CRUD users
│   ├── roles.api.ts               # CRUD roles
│   ├── notifications.api.ts       # getNotifications, markRead
│   ├── audit.api.ts               # getAuditLogs
│   └── files.api.ts               # upload, getFile, deleteFile
├── layouts/
│   ├── AppLayout.tsx              # Sidebar + TopBar + Outlet
│   ├── Sidebar.tsx                # Módulos dinâmicos + navegação
│   └── TopBar.tsx                 # User info + notificações + logout
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx          # Página inicial após login
│   ├── AdminPage.tsx              # /admin — gerenciamento
│   └── modules/                   # Placeholders para cada módulo
│       ├── ChatPage.tsx
│       ├── KanbanPage.tsx
│       ├── PropostasPage.tsx
│       ├── ComprasPage.tsx
│       ├── HelpdeskPage.tsx
│       ├── ControleTiPage.tsx
│       ├── AtalhosPage.tsx
│       ├── IaPage.tsx
│       └── AutomacoesPage.tsx
└── components/
    ├── ui/                        # shadcn/ui re-exports
    ├── NotificationBell.tsx       # Badge + dropdown de notificações
    ├── UserMenu.tsx               # Avatar + nome + logout
    ├── ModuleCard.tsx             # Card de módulo na sidebar
    └── admin/
        ├── UsersTable.tsx
        ├── RolesTable.tsx
        ├── ModulesTable.tsx
        └── AuditLogsTable.tsx
```

### Interfaces TypeScript Principais

```typescript
// packages/types/src/index.ts

export interface User {
  id: string
  username: string
  name: string
  is_active: boolean
  is_superuser: boolean
  roles: Role[]
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  name: string
  permissions: Permission[]
}

export interface Permission {
  id: string
  key: string  // formato: "modulo.acao" ou "modulo.submodulo.acao"
  description: string
}

export interface PortalModule {
  id: string
  key: string
  name: string
  route: string
  icon: string       // nome do ícone Lucide
  order_index: number
  is_active: boolean
  required_permission: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  created_at: string
  read_at: string | null
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
  expires_in: number
}

export interface WebSocketEvent {
  type: string
  payload: Record<string, unknown>
  timestamp: string
}
```


---

## Data Models

### Diagrama Entidade-Relacionamento

```mermaid
erDiagram
    users {
        uuid id PK
        string username UK
        string name
        string password_hash
        boolean is_active
        boolean is_superuser
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    roles {
        uuid id PK
        string name UK
        string description
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    permissions {
        uuid id PK
        string key UK
        string description
        timestamp created_at
        timestamp updated_at
    }

    user_roles {
        uuid user_id FK
        uuid role_id FK
        timestamp created_at
    }

    role_permissions {
        uuid role_id FK
        uuid permission_id FK
        timestamp created_at
    }

    portal_modules {
        uuid id PK
        string key UK
        string name
        string route
        string icon
        integer order_index
        boolean is_active
        string required_permission
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    module_permissions {
        uuid module_id FK
        uuid permission_id FK
    }

    refresh_tokens {
        uuid id PK
        uuid user_id FK
        string token_hash
        timestamp expires_at
        boolean is_revoked
        timestamp created_at
    }

    audit_logs {
        uuid id PK
        uuid user_id FK
        string action
        string resource_type
        string resource_id
        jsonb details
        string ip_address
        timestamp created_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        string title
        string message
        string type
        boolean is_read
        timestamp read_at
        timestamp created_at
    }

    files {
        uuid id PK
        uuid uploaded_by FK
        string original_name
        string stored_name
        string bucket
        string path
        string mime_type
        bigint size_bytes
        timestamp created_at
        timestamp updated_at
    }

    users ||--o{ user_roles : "tem"
    roles ||--o{ user_roles : "atribuído a"
    roles ||--o{ role_permissions : "tem"
    permissions ||--o{ role_permissions : "pertence a"
    portal_modules ||--o{ module_permissions : "requer"
    permissions ||--o{ module_permissions : "usada em"
    users ||--o{ refresh_tokens : "possui"
    users ||--o{ audit_logs : "gera"
    users ||--o{ notifications : "recebe"
    users ||--o{ files : "faz upload"
```

### Definições SQLAlchemy (Python)

```python
# backend/app/shared/base_model.py
import uuid
from datetime import datetime
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(), nullable=False
    )

class UUIDMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
```

### Tabela `users`

| Campo | Tipo | Constraints |
|-------|------|-------------|
| id | UUID | PK, default uuid4 |
| username | VARCHAR(50) | UNIQUE, NOT NULL, INDEX |
| name | VARCHAR(200) | NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| is_active | BOOLEAN | NOT NULL, default true |
| is_superuser | BOOLEAN | NOT NULL, default false |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now(), auto-update |
| deleted_at | TIMESTAMPTZ | NULL (soft delete) |

### Tabela `roles`

| Campo | Tipo | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | UNIQUE, NOT NULL |
| description | TEXT | NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |
| deleted_at | TIMESTAMPTZ | NULL |

### Tabela `permissions`

| Campo | Tipo | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| key | VARCHAR(100) | UNIQUE, NOT NULL, INDEX |
| description | TEXT | NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### Tabela `portal_modules`

| Campo | Tipo | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| key | VARCHAR(50) | UNIQUE, NOT NULL, INDEX |
| name | VARCHAR(100) | NOT NULL |
| route | VARCHAR(200) | NOT NULL |
| icon | VARCHAR(100) | NOT NULL |
| order_index | INTEGER | NOT NULL, INDEX |
| is_active | BOOLEAN | NOT NULL, default true |
| required_permission | VARCHAR(100) | NOT NULL, FK → permissions.key |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |
| deleted_at | TIMESTAMPTZ | NULL |

### Tabela `refresh_tokens`

| Campo | Tipo | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id, INDEX |
| token_hash | VARCHAR(255) | NOT NULL |
| expires_at | TIMESTAMPTZ | NOT NULL, INDEX |
| is_revoked | BOOLEAN | NOT NULL, default false |
| created_at | TIMESTAMPTZ | NOT NULL |

### Tabela `audit_logs`

| Campo | Tipo | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id, INDEX, NULL (sistema) |
| action | VARCHAR(100) | NOT NULL, INDEX |
| resource_type | VARCHAR(100) | NOT NULL, INDEX |
| resource_id | VARCHAR(255) | NULL |
| details | JSONB | NULL |
| ip_address | VARCHAR(45) | NULL |
| created_at | TIMESTAMPTZ | NOT NULL, INDEX |

### Tabela `notifications`

| Campo | Tipo | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id, INDEX |
| title | VARCHAR(200) | NOT NULL |
| message | TEXT | NOT NULL |
| type | VARCHAR(20) | NOT NULL (info/success/warning/error) |
| is_read | BOOLEAN | NOT NULL, default false, INDEX |
| read_at | TIMESTAMPTZ | NULL |
| created_at | TIMESTAMPTZ | NOT NULL, INDEX |

### Tabela `files`

| Campo | Tipo | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| uploaded_by | UUID | FK → users.id, INDEX |
| original_name | VARCHAR(500) | NOT NULL |
| stored_name | VARCHAR(500) | NOT NULL |
| bucket | VARCHAR(100) | NOT NULL |
| path | VARCHAR(1000) | NOT NULL |
| mime_type | VARCHAR(200) | NOT NULL |
| size_bytes | BIGINT | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |


---

## Authentication Flow

### Fluxo de Login

```mermaid
sequenceDiagram
    participant C as Cliente (Frontend)
    participant A as Auth Router
    participant S as AuthService
    participant DB as PostgreSQL
    participant AU as AuditService

    C->>A: POST /api/v1/auth/login\n{username, password}
    A->>S: authenticate(username, password)
    S->>DB: SELECT user WHERE username=? AND deleted_at IS NULL
    alt Usuário não encontrado
        DB-->>S: None
        S->>AU: publish(LOGIN_FAILED, ip)
        S-->>A: raise AuthError(401)
        A-->>C: 401 {"error": {"code": "INVALID_CREDENTIALS"}}
    end
    DB-->>S: User record
    S->>S: bcrypt.verify(password, user.password_hash)
    alt Senha incorreta ou is_active=false
        S->>AU: publish(LOGIN_FAILED, user_id, ip)
        S-->>A: raise AuthError(401)
        A-->>C: 401 {"error": {"code": "INVALID_CREDENTIALS"}}
    end
    S->>S: jwt.encode({sub: user_id, exp: now+ACCESS_TTL})
    S->>S: generate refresh_token (random 64 bytes)
    S->>S: bcrypt.hash(refresh_token)
    S->>DB: INSERT refresh_tokens (user_id, token_hash, expires_at)
    S->>AU: publish(LOGIN_SUCCESS, user_id, ip)
    S-->>A: TokenResponse
    A-->>C: 200 {access_token, refresh_token, expires_in}
```

### Fluxo de Refresh Token

```mermaid
sequenceDiagram
    participant C as Cliente
    participant A as Auth Router
    participant S as AuthService
    participant DB as PostgreSQL

    C->>A: POST /api/v1/auth/refresh\n{refresh_token}
    A->>S: refresh(refresh_token)
    S->>DB: SELECT refresh_tokens WHERE is_revoked=false AND expires_at > now()
    S->>S: bcrypt.verify(refresh_token, stored_hash)
    alt Token inválido ou expirado
        S-->>A: raise AuthError(401)
        A-->>C: 401 {"error": {"code": "INVALID_TOKEN"}}
    end
    S->>DB: UPDATE refresh_tokens SET is_revoked=true (token antigo)
    S->>S: Gera novo JWT + novo refresh_token
    S->>DB: INSERT novo refresh_token
    S-->>A: TokenResponse
    A-->>C: 200 {access_token, refresh_token, expires_in}
```

### Fluxo de Logout

```mermaid
sequenceDiagram
    participant C as Cliente
    participant A as Auth Router
    participant S as AuthService
    participant DB as PostgreSQL

    C->>A: POST /api/v1/auth/logout\n(Authorization: Bearer JWT)
    A->>S: logout(user_id, refresh_token)
    S->>DB: UPDATE refresh_tokens SET is_revoked=true\nWHERE user_id=? AND token_hash matches
    S-->>A: OK
    A-->>C: 200 {"message": "Logged out successfully"}
    C->>C: Limpa Zustand store\nRedireciona para /login
```

### Configuração JWT

```python
# backend/app/core/security.py
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt
import secrets

ACCESS_TOKEN_EXPIRE_MINUTES = 30   # configurável via env
REFRESH_TOKEN_EXPIRE_DAYS = 7      # configurável via env
ALGORITHM = "HS256"

def create_access_token(user_id: str, secret_key: str) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access"
    }
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)

def create_refresh_token() -> tuple[str, str]:
    """Retorna (token_raw, token_hash)"""
    token = secrets.token_urlsafe(64)
    token_hash = bcrypt.hashpw(token.encode(), bcrypt.gensalt(rounds=12)).decode()
    return token, token_hash

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=12)).decode()
```

### Renovação Automática no Frontend

```typescript
// apps/web/src/api/client.ts
import axios from 'axios'
import { useAuthStore } from '../store/auth.store'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Injeta JWT em toda requisição
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Intercepta 401 e tenta refresh automático
let isRefreshing = false
let failedQueue: Array<{ resolve: Function; reject: Function }> = []

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        const { refreshToken } = useAuthStore.getState()
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        useAuthStore.getState().setTokens(data.access_token, data.refresh_token)
        failedQueue.forEach(({ resolve }) => resolve(data.access_token))
        failedQueue = []
        return apiClient(originalRequest)
      } catch {
        failedQueue.forEach(({ reject }) => reject(error))
        failedQueue = []
        useAuthStore.getState().logout()
        window.location.href = '/login'
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
```


---

## RBAC Authorization Flow

### Fluxo de Verificação de Permissão

```mermaid
flowchart TD
    REQ[Requisição HTTP] --> AUTH{JWT válido?}
    AUTH -->|Não| R401[HTTP 401 UNAUTHORIZED]
    AUTH -->|Sim| SUPER{is_superuser?}
    SUPER -->|Sim| ALLOW[Acesso Permitido]
    SUPER -->|Não| ACTIVE{is_active?}
    ACTIVE -->|Não| R401
    ACTIVE -->|Sim| PERM{Tem permissão\nrequerida?}
    PERM -->|Sim| ALLOW
    PERM -->|Não| R403[HTTP 403 FORBIDDEN]
```

### Dependency FastAPI para Permissões

```python
# backend/app/core/permissions.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from app.core.config import settings
from app.core.database import get_session
from app.modules.users.models import User

bearer_scheme = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await session.get(User, user_id)
    if not user or not user.is_active or user.deleted_at:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user

def require_permission(permission_key: str):
    """Factory de dependency que verifica permissão específica."""
    async def _check(
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session),
    ) -> User:
        if current_user.is_superuser:
            return current_user  # superuser bypass

        # Carrega permissões via roles do usuário
        user_permissions = await get_user_permissions(session, current_user.id)
        if permission_key not in user_permissions:
            raise HTTPException(
                status_code=403,
                detail={"code": "FORBIDDEN", "message": f"Permission '{permission_key}' required"}
            )
        return current_user
    return _check

# Uso nos routers:
# @router.get("/users", dependencies=[Depends(require_permission("admin.users.view"))])
```

### Estrutura de Permissões Iniciais (35 permissões)

```python
# backend/seeds/initial_seed.py — permissões
INITIAL_PERMISSIONS = [
    # Admin geral
    ("admin.view", "Acessar painel administrativo"),
    ("admin.view_as_user", "Visualizar portal como outro usuário"),
    # Usuários
    ("admin.users.view", "Listar e visualizar usuários"),
    ("admin.users.create", "Criar novos usuários"),
    ("admin.users.edit", "Editar usuários existentes"),
    ("admin.users.delete", "Desativar usuários"),
    # Roles
    ("admin.roles.view", "Listar e visualizar perfis"),
    ("admin.roles.create", "Criar novos perfis"),
    ("admin.roles.edit", "Editar perfis existentes"),
    ("admin.roles.delete", "Remover perfis"),
    # Permissões
    ("admin.permissions.view", "Listar permissões disponíveis"),
    ("admin.permissions.manage", "Gerenciar permissões de perfis"),
    # Módulos
    ("admin.modules.view", "Listar módulos do portal"),
    ("admin.modules.manage", "Ativar/desativar e configurar módulos"),
    # Auditoria
    ("admin.audit.view", "Visualizar logs de auditoria"),
    # Módulos de negócio
    ("chat.view", "Acessar módulo de chat"),
    ("chat.send", "Enviar mensagens no chat"),
    ("kanban.view", "Acessar módulo kanban"),
    ("kanban.card.view", "Visualizar cards do kanban"),
    ("propostas.view", "Acessar módulo de propostas"),
    ("propostas.create", "Criar novas propostas"),
    ("compras.view", "Acessar módulo de compras"),
    ("compras.cotacoes.view", "Visualizar cotações"),
    ("helpdesk.view", "Acessar módulo helpdesk"),
    ("helpdesk.ticket.create", "Criar tickets de suporte"),
    ("helpdesk.ticket.view", "Visualizar tickets"),
    ("controle_ti.view", "Acessar módulo controle TI"),
    ("atalhos.view", "Acessar módulo de atalhos"),
    ("ia.view", "Acessar módulo de IA"),
    ("ia.chat", "Usar chat com IA"),
    ("automacoes_n8n.view", "Acessar módulo de automações"),
    ("automacoes_n8n.status.view", "Visualizar status de automações"),
    ("system.notifications.view", "Receber notificações do sistema"),
]

# 7 Perfis iniciais
INITIAL_ROLES = {
    "Administrador": ["*"],  # todas as permissões
    "Gestor": [
        "admin.view", "admin.users.view", "admin.roles.view",
        "admin.modules.view", "admin.audit.view",
        "chat.view", "chat.send", "kanban.view", "kanban.card.view",
        "propostas.view", "propostas.create", "compras.view",
        "helpdesk.view", "helpdesk.ticket.view",
        "ia.view", "ia.chat", "system.notifications.view",
    ],
    "Usuário": [
        "chat.view", "chat.send", "kanban.view",
        "helpdesk.view", "helpdesk.ticket.create", "helpdesk.ticket.view",
        "atalhos.view", "system.notifications.view",
    ],
    "TI": [
        "chat.view", "chat.send", "controle_ti.view",
        "helpdesk.view", "helpdesk.ticket.view", "helpdesk.ticket.create",
        "atalhos.view", "automacoes_n8n.view", "automacoes_n8n.status.view",
        "system.notifications.view",
    ],
    "Comercial": [
        "chat.view", "chat.send", "propostas.view", "propostas.create",
        "compras.view", "helpdesk.view", "helpdesk.ticket.create",
        "ia.view", "ia.chat", "atalhos.view", "system.notifications.view",
    ],
    "Compras": [
        "chat.view", "compras.view", "compras.cotacoes.view",
        "helpdesk.view", "helpdesk.ticket.create",
        "atalhos.view", "system.notifications.view",
    ],
    "Produção": [
        "kanban.view", "kanban.card.view",
        "helpdesk.view", "helpdesk.ticket.create",
        "atalhos.view", "system.notifications.view",
    ],
}
```


---

## WebSocket Architecture

### Diagrama de Arquitetura WebSocket

```mermaid
graph LR
    subgraph Clients["Clientes Conectados"]
        C1["User A\n(Frontend)"]
        C2["User B\n(Frontend)"]
        C3["User C\n(Frontend)"]
    end

    subgraph Instance1["Backend Instance 1"]
        WS1["WebSocket\nManager"]
        Conn1["Conexões Ativas\n{user_id: [ws1, ws2]}"]
    end

    subgraph Instance2["Backend Instance 2"]
        WS2["WebSocket\nManager"]
        Conn2["Conexões Ativas\n{user_id: [ws3]}"]
    end

    subgraph RedisPS["Redis Pub/Sub"]
        CH1["ws:broadcast"]
        CH2["ws:user:{user_id}"]
        CH3["ws:module:{module_key}"]
    end

    C1 <-->|"WS"| WS1
    C2 <-->|"WS"| WS1
    C3 <-->|"WS"| WS2

    WS1 <-->|"Subscribe/Publish"| CH1
    WS1 <-->|"Subscribe/Publish"| CH2
    WS2 <-->|"Subscribe/Publish"| CH1
    WS2 <-->|"Subscribe/Publish"| CH2
    WS1 <-->|"Subscribe/Publish"| CH3
    WS2 <-->|"Subscribe/Publish"| CH3
```

### WebSocketManager

```python
# backend/app/core/websocket.py
import asyncio
import json
from typing import Dict, List
from fastapi import WebSocket
import redis.asyncio as aioredis

class WebSocketManager:
    def __init__(self):
        # {user_id: [WebSocket, ...]}
        self._connections: Dict[str, List[WebSocket]] = {}
        self._redis: aioredis.Redis | None = None

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self._connections:
            self._connections[user_id] = []
        self._connections[user_id].append(websocket)

        # Notifica conexão estabelecida
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        })

    async def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self._connections:
            self._connections[user_id].remove(websocket)
            if not self._connections[user_id]:
                del self._connections[user_id]

    async def send_to_user(self, user_id: str, event: dict):
        """Envia para todas as conexões de um usuário específico."""
        if user_id in self._connections:
            dead = []
            for ws in self._connections[user_id]:
                try:
                    await ws.send_json(event)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self._connections[user_id].remove(ws)

    async def broadcast(self, event: dict):
        """Envia para todos os usuários conectados."""
        for user_id in list(self._connections.keys()):
            await self.send_to_user(user_id, event)

    async def publish_to_redis(self, channel: str, event: dict):
        """Publica evento no Redis para outras instâncias."""
        if self._redis:
            await self._redis.publish(channel, json.dumps(event))

    async def start_redis_listener(self, redis_url: str):
        """Escuta canais Redis e repassa para conexões locais."""
        self._redis = aioredis.from_url(redis_url)
        pubsub = self._redis.pubsub()
        await pubsub.psubscribe("ws:*")  # Subscribe em todos os canais ws:*

        async for message in pubsub.listen():
            if message["type"] == "pmessage":
                channel = message["channel"].decode()
                data = json.loads(message["data"])

                if channel == "ws:broadcast":
                    await self.broadcast(data)
                elif channel.startswith("ws:user:"):
                    user_id = channel.split("ws:user:")[1]
                    await self.send_to_user(user_id, data)

ws_manager = WebSocketManager()
```

### Endpoint WebSocket

```python
# backend/app/modules/websocket/router.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.websocket import ws_manager
from app.core.security import decode_access_token

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    # Autenticação via query param (WebSocket não suporta headers padrão)
    try:
        payload = decode_access_token(token)
        user_id = payload["sub"]
    except Exception:
        await websocket.close(code=4001)  # 4001 = Unauthorized
        return

    await ws_manager.connect(websocket, user_id)
    try:
        while True:
            # Mantém conexão viva; mensagens do cliente são ignoradas na base
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket, user_id)
```

### Eventos WebSocket Base

| Evento | Canal Redis | Payload | Descrição |
|--------|-------------|---------|-----------|
| `connected` | — | `{type, user_id, timestamp}` | Confirmação de conexão |
| `system.notification.created` | `ws:user:{id}` | `{type, notification}` | Nova notificação |
| `user.presence.updated` | `ws:broadcast` | `{type, user_id, status}` | Status online/offline |
| `module.status.updated` | `ws:broadcast` | `{type, module_key, is_active}` | Módulo ativado/desativado |
| `admin.permission.updated` | `ws:user:{id}` | `{type, user_id}` | Permissões alteradas |
| `admin.module.updated` | `ws:broadcast` | `{type, module}` | Módulo atualizado |
| `file.uploaded` | `ws:user:{id}` | `{type, file_id, file_name}` | Upload concluído |

### Hook WebSocket no Frontend

```typescript
// apps/web/src/hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../store/auth.store'
import { useQueryClient } from '@tanstack/react-query'

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()

  const connect = useCallback(() => {
    if (!accessToken) return
    const wsUrl = `${import.meta.env.VITE_WS_URL}/ws?token=${accessToken}`
    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      switch (data.type) {
        case 'system.notification.created':
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
          break
        case 'admin.module.updated':
        case 'module.status.updated':
          queryClient.invalidateQueries({ queryKey: ['my-modules'] })
          break
        case 'admin.permission.updated':
          // Força re-login para recarregar permissões
          queryClient.invalidateQueries({ queryKey: ['me'] })
          break
      }
    }

    wsRef.current.onclose = (event) => {
      if (event.code !== 4001) {
        // Reconecta após 3s se não foi erro de auth
        setTimeout(connect, 3000)
      }
    }
  }, [accessToken, queryClient])

  useEffect(() => {
    connect()
    return () => wsRef.current?.close()
  }, [connect])
}
```


---

## Storage Architecture

### Fluxo de Upload de Arquivo

```mermaid
sequenceDiagram
    participant C as Cliente
    participant F as Files Router
    participant S as FileService
    participant M as MinIO
    participant DB as PostgreSQL
    participant R as Redis

    C->>F: POST /api/v1/files/upload\n(multipart/form-data)
    F->>F: Valida JWT + permissão
    F->>S: upload(file, user_id, bucket?)
    S->>S: Gera stored_name = uuid4 + ext
    S->>M: put_object(bucket, stored_name, data)
    alt MinIO indisponível
        M-->>S: ConnectionError
        S-->>F: raise StorageError(503)
        F-->>C: 503 {"error": {"code": "STORAGE_UNAVAILABLE"}}
    end
    M-->>S: OK
    S->>DB: INSERT files (metadata)
    S->>R: XADD stream:files {event: "uploaded", file_id}
    S-->>F: FileMetadata
    F-->>C: 201 {id, original_name, url, mime_type, size_bytes}
```

### StorageService

```python
# backend/app/core/storage.py
from minio import Minio
from minio.error import S3Error
import uuid
import io
from pathlib import Path

BUCKETS = [
    "portal-files",
    "portal-avatars",
    "portal-chat",
    "portal-propostas",
    "portal-compras",
    "portal-helpdesk",
    "portal-templates",
]

class StorageService:
    def __init__(self, endpoint: str, access_key: str, secret_key: str, secure: bool = False):
        self.client = Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=secure)

    async def ensure_buckets(self):
        """Cria buckets que não existem na inicialização."""
        for bucket in BUCKETS:
            if not self.client.bucket_exists(bucket):
                self.client.make_bucket(bucket)

    async def upload(
        self,
        data: bytes,
        original_name: str,
        mime_type: str,
        bucket: str = "portal-files",
    ) -> dict:
        ext = Path(original_name).suffix
        stored_name = f"{uuid.uuid4()}{ext}"
        self.client.put_object(
            bucket, stored_name,
            io.BytesIO(data), len(data),
            content_type=mime_type
        )
        return {
            "stored_name": stored_name,
            "bucket": bucket,
            "path": f"{bucket}/{stored_name}",
        }

    def get_presigned_url(self, bucket: str, stored_name: str, expires_hours: int = 1) -> str:
        from datetime import timedelta
        return self.client.presigned_get_object(
            bucket, stored_name,
            expires=timedelta(hours=expires_hours)
        )

    async def delete(self, bucket: str, stored_name: str):
        self.client.remove_object(bucket, stored_name)
```

### Buckets MinIO e Seus Usos

| Bucket | Uso |
|--------|-----|
| `portal-files` | Arquivos genéricos do portal |
| `portal-avatars` | Fotos de perfil dos usuários |
| `portal-chat` | Arquivos enviados no chat |
| `portal-propostas` | Documentos de propostas comerciais |
| `portal-compras` | Documentos de compras e cotações |
| `portal-helpdesk` | Anexos de tickets de suporte |
| `portal-templates` | Templates de documentos |

### Redis Streams para Eventos Assíncronos

| Stream | Produtor | Consumidor | Uso |
|--------|----------|------------|-----|
| `stream:audit` | Qualquer módulo | AuditWorker | Logs de auditoria assíncronos |
| `stream:notifications` | Qualquer módulo | NotificationWorker | Criação de notificações |
| `stream:module_events` | ModuleService | WebSocketManager | Eventos de módulos |
| `stream:files` | FileService | FileWorker | Pós-processamento de uploads |
| `stream:email` | Qualquer módulo | EmailWorker | Envio de emails (futuro) |
| `stream:pdf` | Qualquer módulo | PDFWorker | Geração de PDFs (futuro) |


---

## Frontend Component Architecture

### Layout Visual Base

```mermaid
graph TD
    AppLayout["AppLayout\n(flex row, h-screen)"]
    Sidebar["Sidebar\n(w-64, dark navy)"]
    MainArea["Main Area\n(flex-1, flex col)"]
    TopBar["TopBar\n(h-14, dark charcoal)"]
    Content["Content Area\n(flex-1, overflow-auto)"]
    Outlet["<Outlet />\n(página atual)"]

    AppLayout --> Sidebar
    AppLayout --> MainArea
    MainArea --> TopBar
    MainArea --> Content
    Content --> Outlet

    Sidebar --> Logo["Logo Portal Vesper"]
    Sidebar --> NavItems["Nav Items\n(módulos dinâmicos)"]
    Sidebar --> UserSection["User Section\n(avatar + nome)"]

    TopBar --> PageTitle["Título da Página"]
    TopBar --> NotifBell["NotificationBell\n(badge unread count)"]
    TopBar --> UserMenu["UserMenu\n(dropdown logout)"]
```

### Tema Dark Premium

```typescript
// apps/web/src/styles/theme.ts
// Paleta de cores navy/charcoal com acentos cyan/blue/teal

export const theme = {
  colors: {
    // Fundos
    background: {
      primary: '#0a0f1e',    // navy profundo — fundo principal
      secondary: '#0d1526',  // navy médio — sidebar
      tertiary: '#111827',   // charcoal — cards e painéis
      elevated: '#1a2235',   // charcoal claro — hover states
    },
    // Acentos interativos
    accent: {
      cyan: '#06b6d4',       // cyan-500 — links e ícones ativos
      blue: '#3b82f6',       // blue-500 — botões primários
      teal: '#14b8a6',       // teal-500 — badges e indicadores
    },
    // Texto
    text: {
      primary: '#f1f5f9',    // slate-100
      secondary: '#94a3b8',  // slate-400
      muted: '#475569',      // slate-600
    },
    // Status
    status: {
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    // Bordas
    border: {
      default: '#1e293b',    // slate-800
      subtle: '#0f172a',     // slate-900
    }
  }
}
```

### Sidebar com Módulos Dinâmicos

```typescript
// apps/web/src/layouts/Sidebar.tsx
import { useQuery } from '@tanstack/react-query'
import { NavLink } from 'react-router-dom'
import * as LucideIcons from 'lucide-react'
import { getMyModules } from '../api/modules.api'
import type { PortalModule } from '@portal-vesper/types'

export function Sidebar() {
  const { data: modules = [] } = useQuery({
    queryKey: ['my-modules'],
    queryFn: getMyModules,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  return (
    <aside className="w-64 h-screen flex flex-col bg-[#0d1526] border-r border-[#1e293b]">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-[#1e293b]">
        <span className="text-cyan-400 font-bold text-lg tracking-wide">
          Portal Vesper
        </span>
      </div>

      {/* Navegação dinâmica */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {modules.map((module: PortalModule) => {
          const Icon = (LucideIcons as any)[module.icon] ?? LucideIcons.Box
          return (
            <NavLink
              key={module.key}
              to={module.route}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors
                 ${isActive
                   ? 'bg-cyan-500/10 text-cyan-400 font-medium'
                   : 'text-slate-400 hover:bg-[#1a2235] hover:text-slate-200'
                 }`
              }
            >
              <Icon size={18} />
              <span>{module.name}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
```

### Hook usePermission

```typescript
// apps/web/src/hooks/usePermission.ts
import { useAuthStore } from '../store/auth.store'

export function usePermission(permission: string): boolean {
  const { user, permissions } = useAuthStore()
  if (!user) return false
  if (user.is_superuser) return true
  return permissions.includes(permission)
}

// Uso:
// const canViewUsers = usePermission('admin.users.view')
// if (!canViewUsers) return null
```

### ProtectedRoute

```typescript
// apps/web/src/router/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { usePermission } from '../hooks/usePermission'

interface ProtectedRouteProps {
  requiredPermission?: string
  redirectTo?: string
}

export function ProtectedRoute({
  requiredPermission,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  if (requiredPermission) {
    const hasPermission = usePermission(requiredPermission)
    if (!hasPermission) {
      return <Navigate to="/" replace />
    }
  }

  return <Outlet />
}
```

### Zustand Auth Store

```typescript
// apps/web/src/store/auth.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@portal-vesper/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  permissions: string[]
  isAuthenticated: boolean
  setTokens: (access: string, refresh: string) => void
  setUser: (user: User) => void
  setPermissions: (permissions: string[]) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      permissions: [],
      isAuthenticated: false,
      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      setPermissions: (permissions) => set({ permissions }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          permissions: [],
          isAuthenticated: false,
        }),
    }),
    {
      name: 'portal-vesper-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)
```

### Módulos Placeholder

```typescript
// apps/web/src/pages/modules/ChatPage.tsx (exemplo de placeholder)
import { MessageCircle } from 'lucide-react'

export function ChatPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
      <MessageCircle size={48} className="text-slate-600" />
      <h2 className="text-xl font-medium text-slate-300">Chat Interno</h2>
      <p className="text-sm">Este módulo será implementado na próxima etapa.</p>
    </div>
  )
}
```


---

## Dynamic Modules Flow

### Fluxo de Módulos Dinâmicos na Sidebar

```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend
    participant DB as PostgreSQL
    participant WS as WebSocket

    F->>B: GET /api/v1/me/modules\n(Authorization: Bearer JWT)
    B->>B: Extrai user_id do JWT
    B->>DB: SELECT portal_modules pm\nJOIN user_roles ur ON ur.user_id = ?\nJOIN role_permissions rp ON rp.role_id = ur.role_id\nJOIN permissions p ON p.key = pm.required_permission\nWHERE pm.is_active = true AND pm.deleted_at IS NULL\nORDER BY pm.order_index
    DB-->>B: Lista de módulos filtrados
    B-->>F: [{key, name, route, icon, order_index}]
    F->>F: Renderiza sidebar com módulos retornados

    Note over WS,F: Quando admin altera módulo
    WS->>F: {"type": "admin.module.updated"}
    F->>B: GET /api/v1/me/modules (re-fetch)
    F->>F: Atualiza sidebar automaticamente
```

### Query SQL para Módulos do Usuário

```sql
-- Módulos que o usuário tem acesso (via roles)
SELECT DISTINCT pm.*
FROM portal_modules pm
JOIN permissions p ON p.key = pm.required_permission
JOIN role_permissions rp ON rp.permission_id = p.id
JOIN user_roles ur ON ur.role_id = rp.role_id
WHERE ur.user_id = :user_id
  AND pm.is_active = true
  AND pm.deleted_at IS NULL
ORDER BY pm.order_index ASC;

-- Para superuser: todos os módulos ativos
SELECT * FROM portal_modules
WHERE is_active = true AND deleted_at IS NULL
ORDER BY order_index ASC;
```

### Módulos Iniciais (Seed)

| key | name | route | icon | order_index | required_permission |
|-----|------|-------|------|-------------|---------------------|
| chat | Chat | /chat | MessageCircle | 10 | chat.view |
| kanban | Kanban | /kanban | KanbanSquare | 20 | kanban.view |
| propostas | Propostas | /propostas | FileText | 30 | propostas.view |
| compras | Compras | /compras | ShoppingCart | 40 | compras.view |
| helpdesk | HelpDesk | /helpdesk | Headphones | 50 | helpdesk.view |
| controle_ti | Controle TI | /controle-ti | MonitorCog | 60 | controle_ti.view |
| atalhos | Atalhos | /atalhos | Link | 70 | atalhos.view |
| ia | IA Interna | /ia | Sparkles | 80 | ia.view |
| automacoes_n8n | Automações | /automacoes | Network | 90 | automacoes_n8n.view |
| admin | Administração | /admin | Shield | 100 | admin.view |


---

## Docker Compose Configuration

### `infra/docker-compose.yml`

```yaml
# infra/docker-compose.yml
# Infraestrutura de desenvolvimento do Portal Vesper
# Uso: docker compose up -d (no diretório infra/)

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    ports:
      - "${MINIO_API_PORT:-9000}:9000"
      - "${MINIO_CONSOLE_PORT:-9001}:9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
      start_period: 30s

  pgadmin:
    image: dpage/pgadmin4:latest
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
    ports:
      - "${PGADMIN_PORT:-5050}:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
    name: portal_vesper_postgres
  redis_data:
    name: portal_vesper_redis
  minio_data:
    name: portal_vesper_minio
  pgadmin_data:
    name: portal_vesper_pgadmin
```

### `.env.example` (raiz do monorepo)

```bash
# .env.example — Portal Vesper
# Copie para .env e preencha os valores reais
# NUNCA commite o arquivo .env

# ============================================================
# PostgreSQL
# ============================================================
POSTGRES_USER=vesper_user
POSTGRES_PASSWORD=
POSTGRES_DB=portal_vesper_dev
POSTGRES_PORT=5432
DATABASE_URL=postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}

# ============================================================
# Redis
# ============================================================
REDIS_PASSWORD=
REDIS_PORT=6379
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:${REDIS_PORT}/0

# ============================================================
# MinIO
# ============================================================
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_API_PORT=9000
MINIO_CONSOLE_PORT=9001
MINIO_SECURE=false

# ============================================================
# pgAdmin
# ============================================================
PGADMIN_EMAIL=admin@portalvesper.local
PGADMIN_PASSWORD=
PGADMIN_PORT=5050

# ============================================================
# Backend FastAPI
# ============================================================
ENVIRONMENT=development
SECRET_KEY=
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ALLOWED_ORIGINS=http://localhost:1420,http://localhost:5173
LOG_LEVEL=info

# ============================================================
# Frontend / Tauri
# ============================================================
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/api/v1
```

### Configuração Pydantic Settings

```python
# backend/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    # App
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "info"
    VERSION: str = "0.1.0"

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str

    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: list[str] = ["http://localhost:1420"]

    # MinIO
    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_SECURE: bool = False

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```


---

## Tauri 2.0 Desktop Shell

### Configuração `tauri.conf.json`

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Portal Vesper",
  "version": "0.1.0",
  "identifier": "com.portalvesper.app",
  "build": {
    "frontendDist": "../apps/web/dist",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "npm run dev --workspace=apps/web",
    "beforeBuildCommand": "npm run build --workspace=apps/web"
  },
  "app": {
    "windows": [
      {
        "title": "Portal Vesper",
        "width": 1280,
        "height": 800,
        "minWidth": 1280,
        "minHeight": 720,
        "resizable": true,
        "fullscreen": false,
        "decorations": true,
        "center": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; connect-src 'self' http://localhost:8000 ws://localhost:8000"
    }
  },
  "bundle": {
    "active": true,
    "targets": ["nsis", "msi"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "windows": {
      "nsis": {
        "installMode": "perMachine",
        "languages": ["BrazilianPortuguese"]
      }
    }
  }
}
```

### Regras de Segurança Tauri

- DevTools desabilitado em produção via `app.security.devtools = false`
- Menu de contexto padrão desabilitado via `preventDefaultContextMenu`
- CSP configurado para permitir apenas conexões ao backend local
- Sem comandos Tauri expostos ao frontend na base (apenas o necessário por módulo)

