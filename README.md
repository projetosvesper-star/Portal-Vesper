# Portal Vesper

Portal Vesper e um aplicativo desktop empresarial para unificar sistemas internos em uma unica fundacao modular. A base usa Tauri 2.0 no desktop, React no frontend, FastAPI no backend, PostgreSQL como banco central, Redis para cache/eventos e MinIO para arquivos.

O Portal ja possui a base arquitetural, o Kanban Engine generico e uma fundacao simples do Kanban Producao. Chat, Propostas, Compras, HelpDesk, Controle TI, IA e n8n ainda existem apenas como registros e placeholders.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Desktop | Tauri 2.0 |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Lucide, TanStack Query, Zustand, React Router |
| Backend | FastAPI, Python 3.12+, SQLAlchemy 2.x, Alembic, Pydantic |
| Banco | PostgreSQL 16 |
| Cache/Eventos | Redis 7 Pub/Sub e Streams |
| Storage | MinIO S3-compativel |
| Tempo real | WebSocket nativo FastAPI |

## Como rodar em desenvolvimento

1. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

2. Edite `.env` e troque os valores marcados com `TROQUE_` ou `GERE_`.

3. Suba a infraestrutura:

```bash
npm run infra:up
```

Os scripts de infraestrutura usam `--env-file .env`. Se `.env` nao existir, o Docker Compose nao tera usuario/senha para PostgreSQL, MinIO e pgAdmin.

4. Instale dependencias do monorepo:

```bash
npm install
```

5. Configure o backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
```

6. Migre e popule o banco:

```bash
npm run backend:migrate
npm run backend:seed
```

7. Rode backend e frontend:

```bash
npm run backend:dev
npm run dev:web
```

8. Para abrir o app desktop:

```bash
npm run dev:desktop
```

## Comandos uteis

```bash
npm run infra:up
npm run infra:down
npm run infra:logs
npm run infra:app
npm run backend:dev
npm run backend:migrate
npm run backend:seed
npm run backend:test
npm run dev:web
npm run build:web
npm run dev:desktop
npm run build:desktop
npm run lint
npm run typecheck
```

Os comandos de backend do `package.json` usam `backend/.venv/Scripts/python`, entao crie o ambiente virtual antes de executar migration, seed, dev ou testes.

## Usuario administrador inicial

Depois do seed:

| Campo | Valor |
| --- | --- |
| Username | `Admin` |
| Senha | `Vesper@890` |
| Perfil | Administrador |

Atencao: a senha `Vesper@890` e apenas para desenvolvimento e primeiro acesso. Troque imediatamente antes de qualquer uso em producao.

## Portas locais

| Servico | Porta |
| --- | --- |
| Backend FastAPI | 8000 |
| Frontend Vite | 5174 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| MinIO API | 9000 |
| MinIO Console | 9001 |
| pgAdmin | 5050 |

`npm run infra:up` sobe a infraestrutura local. `npm run infra:app` tambem sobe backend e worker via Docker, usando o profile `app`.

## Seguranca e variaveis

- Nunca commite `.env`.
- `JWT_SECRET_KEY` deve ser forte e diferente por ambiente.
- `CORS_ORIGINS` nao deve usar `*` em producao.
- Refresh tokens sao armazenados com hash.
- O WebSocket do frontend envia o JWT por subprotocolo, nao por query string, para evitar vazamento em logs de URL.
- Uploads passam pelo backend, com limite de tamanho e tipos permitidos.
- A senha inicial `Vesper@890` existe somente no seed e deve ser trocada antes de producao.

## Rust e Tauri

Para `npm run dev:desktop` e `npm run build:desktop`, instale Rust stable via `rustup`. Se `cargo` nao estiver no PATH, o build Tauri nao funcionara.

## Estrutura principal

```text
PortalVesper/
  apps/
    desktop/
    web/
  backend/
    app/
    alembic/
    seeds/
    tests/
  packages/
    config/
    types/
    ui/
  infra/
  docs/
```

## Documentacao

- `docs/arquitetura.md`
- `docs/permissoes.md`
- `docs/modulos.md`
- `docs/websocket-events.md`
- `docs/storage.md`
- `docs/setup-dev.md`
- `docs/deploy-servidor.md`
- `docs/kanban-engine.md`
- `docs/kanban-producao.md`

## Kanban Producao simples

A rota `/kanban/producao` implementa uma primeira fundacao simples para OPs:

- OPs em `production_orders` vinculadas a cards genericos em `kanban_cards`.
- Templates editaveis de checklist.
- Checklist individual editavel por OP.
- Dashboard simples.
- TV/Foco simples por endpoint e preview visual.

Ainda nao foram implementados risco, alertas, status automatico complexo, OCR/Telegram, importacao real ou TV final full screen.
