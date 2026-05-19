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

## Hub Kanban

A sidebar mostra apenas `Kanban`. Dentro de `/kanban`, o Portal centraliza:

- Quadros genericos;
- Producao;
- Projetos;
- TI / Operacional;
- Personalizados.

Projetos, TI e Operacional usam o Kanban Engine generico nesta fase. Eles nao possuem item proprio na sidebar e nao sao modulos separados.

Rotas principais:

- `/kanban`
- `/kanban/boards/:boardId`
- `/kanban/producao`
- `/kanban/tv`

## Padrao visual e TV/Foco global do Kanban

O Kanban usa componentes escuros padronizados do Portal para botoes, selects, dialogs, cards, estados vazios e estados de erro. Select/dropdown nativo branco nao deve ser usado nas telas do Kanban.

A rota interna `/kanban/tv` e a TV/Foco global. Ela permite escolher qualquer quadro permitido e alternar entre lista e kanban. Para quadros genericos, consome cards/colunas do Kanban Engine. Para Producao, usa o endpoint especializado de OPs e adapta os dados para o mesmo formato visual.

O frontend deve receber a API por `VITE_API_BASE_URL`. Em desenvolvimento, se o backend atual estiver em `8002`, suba o Vite com:

```bash
set VITE_API_BASE_URL=http://localhost:8002
npm run dev:web
```

## Diagnostico de backend antigo / HTTP 404

Se aparecer erro como `Not Found (HTTP 404)` em rotas esperadas do Kanban, confira primeiro o backend ativo:

```bash
npm run backend:dev
```

Em outra janela:

```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/openapi.json
```

O OpenAPI deve listar `/api/kanban/boards` e `/api/kanban/producao/*`. Se nao listar, o backend rodando esta antigo ou a porta esta presa. No Windows, use:

```bash
netstat -ano | findstr :8000
```

Se a porta 8000 estiver presa e nao puder ser liberada, suba o backend em outra porta e ajuste o frontend temporariamente:

```bash
cd backend
.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --no-access-log

set VITE_API_BASE_URL=http://localhost:8002
npm run dev:web
```
