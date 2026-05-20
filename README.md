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

O frontend deve receber a API por `VITE_API_BASE_URL` ou pelo runtime config gerado pelo fluxo adaptável de desenvolvimento.

## Kanban configuravel - Fase 1

O Kanban agora possui uma primeira camada configuravel por quadro, sem criar tabelas novas:

- configuracao versionada em `kanban_boards.metadata.config`;
- valores dinamicos dos cards em `kanban_cards.metadata.customFields`;
- terminologia configuravel (`Tarefa`, `Chamado`, `Solicitacao`, etc.);
- texto do botao principal configuravel;
- campos customizados simples por quadro;
- validacao backend dos campos customizados;
- formulario, drawer, card compacto e TV/Foco lendo a configuracao do board;
- evento `kanban.board.config.updated` ao alterar configuracao.

Tipos de campo suportados nesta fase: `text`, `textarea`, `number`, `date`, `select`, `checkbox`, `user` e `currency`. Valores de `currency` sao salvos em centavos. Valores de `user` salvam o `user_id`.

Permissao para configurar quadro: `kanban.board.configure`.

O Kanban Producao continua usando `production_orders`; ele apenas pode ler a terminologia visual do board de Producao para labels e botoes.

## Kanban configuravel - Fase 2

O Hub Kanban agora possui contextos e templates configuraveis pelo Portal:

- contextos carregados por `/api/kanban/contexts`;
- templates carregados por `/api/kanban/templates`;
- criacao de quadro por template em `/api/kanban/boards/from-template`;
- `Configurar Kanban` permite ocultar, reativar, reordenar e criar contextos;
- templates podem ser criados, editados, duplicados, arquivados/restaurados e usados na criacao de boards;
- fallback local continua ativo se a API de contexto/template falhar em desenvolvimento.

Permissoes novas: `kanban.context.view`, `kanban.context.manage`, `kanban.template.view` e `kanban.template.manage`.

Os dados da Fase 2 ficam em JSONB no board interno `__kanban_hub_config__`, sem criar modulo novo e sem adicionar itens extras na sidebar.

## Automation Core e n8n

O Portal Vesper possui integracao ponta a ponta com n8n:

- `POST /api/ia/gateway` envia solicitacoes do Portal para o Gateway Supervisor do n8n;
- `/api/automation/*` recebe auditoria, erros, aprovacoes e eventos;
- Approval Center funciona como barreira humana para acoes sensiveis;
- Error Audit registra falhas com redaction de segredos;
- War Room base acompanha a malha de automacoes.

Estado validado da malha n8n local:

- 24 workflows encontrados;
- 21 workflows ativos;
- 12/12 workflows AI ativos;
- 9 workflows core/legados preservados;
- 3 workflows extras/teste mantidos inativos.

Os workflows finais sanitizados ficam em:

```text
N8N/workflows/
```

A documentacao tecnica fica em:

```text
docs/automation_gateway.md
docs/n8n/
```

Credenciais devem ser configuradas no n8n, nunca nos JSONs:

- `OpenAI account`
- `Google Gemini(PaLM) Api account`
- `Ollama account`
- `Slack account`

Antes de usar em producao, mantenha a regra: compra final, proposta final, pagamento, reset de senha/acesso, exclusao, alteracao critica de OP/Kanban e temas INMETRO/CAPA exigem Approval Center ou revisao humana.

## Desenvolvimento adaptável

Use o script adaptável para evitar dependência de portas fixas:

```bash
npm run dev:portal
```

Ele tenta:

- backend em `8000`, `8002`, `8003`, `8004`
- frontend em `5174`, `5175`, `5176`, `5177`
- validar `/api/health`
- validar `/openapi.json`
- gerar `runtime-config.json`
- subir Vite com `VITE_API_BASE_URL` correto

Se a porta 8000 estiver presa por um listener/pid fantasma, o fluxo usa `8002` como workaround.

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
