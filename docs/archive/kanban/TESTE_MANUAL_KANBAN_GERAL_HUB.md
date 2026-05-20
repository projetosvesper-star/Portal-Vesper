# Teste Manual Kanban Geral Hub

## Pre-condicoes

- Infra local ativa.
- Banco migrado e seed executado.
- Backend atual reiniciado.
- Frontend apontando para o backend atual.
- Usuario Admin disponivel.

## Anti-404 antes de abrir a UI

| Passo | Resultado esperado | Status |
| --- | --- | --- |
| `GET /api/health` | Responde `status=ok` e dependencias saudaveis | Validado em 8002 |
| Abrir `/api/docs` ou `/openapi.json` | OpenAPI abre | Validado em 8002 |
| OpenAPI lista `/api/kanban/boards` | Rota presente | Validado em 8002 |
| OpenAPI lista `/api/kanban/boards/{board_id}` | Rota presente | Validado em 8002 |
| OpenAPI lista `/api/kanban/boards/{board_id}/columns` | Rota presente | Validado em 8002 |
| OpenAPI lista `/api/kanban/boards/{board_id}/cards` | Rota presente | Validado em 8002 |
| OpenAPI lista `/api/kanban/cards` | Rota presente | Validado em 8002 |
| OpenAPI lista `/api/kanban/cards/{card_id}` | Rota presente | Validado em 8002 |
| OpenAPI lista `/api/kanban/producao/ops` | Rota presente | Validado em 8002 |
| OpenAPI lista `/api/kanban/producao/dashboard` | Rota presente | Validado em 8002 |
| OpenAPI lista `/api/kanban/producao/tv` | Rota presente | Validado em 8002 |

Observacao: a porta 8000 estava presa com backend antigo e nao listava as rotas de Producao. Para esta validacao foi usado backend atual em 8002.

## Smoke de API

| Chamada | Esperado | Status |
| --- | --- | --- |
| `GET /api/kanban/boards` | 200 | Validado |
| `GET /api/kanban/producao/ops` | 200 | Validado |
| `GET /api/kanban/producao/dashboard` | 200 | Validado |
| `GET /api/kanban/producao/tv?mode=list` | 200 | Validado |
| `GET /api/kanban/producao/tv?mode=kanban` | 200 | Validado |
| Criar quadro Projetos | 201 | Validado |
| Criar coluna | 201 | Validado |
| Criar card generico | 201 | Validado |
| Abrir quadro por id | 200 | Validado |
| Listar colunas do quadro | 200 | Validado |
| Listar cards do quadro | 200 | Validado |
| Criar quadro TI | 201 | Validado |

## UI

| Passo | Resultado esperado | Status |
| --- | --- | --- |
| Login Admin | Entra no Portal | Validado em 5175 |
| Sidebar | Mostra apenas `Kanban`, nao mostra `Kanban Producao` | Validado em 5175 |
| Abrir `/kanban` | Hub Kanban abre | Validado em 5175 |
| Ver contextos | Quadros, Producao, Projetos, TI / Operacional e Personalizados aparecem | Validado em 5175 |
| Contexto Quadros | Lista boards disponiveis | Validado em 5175 |
| Contexto Producao | Navega para `/kanban/producao` | Pendente de clique manual, rota validada |
| Contexto Projetos | Filtra quadros de projetos | Pendente manual |
| Contexto TI / Operacional | Filtra quadros de TI/operacional | Pendente manual |
| Contexto Personalizados | Filtra quadros custom | Pendente manual |
| Botao Novo quadro | Abre modal | Pendente manual |
| Criar quadro Projetos pela UI | Cria quadro, colunas e navega para `/kanban/boards/:boardId` | Pendente manual |
| Criar quadro TI pela UI | Cria quadro, colunas e navega para `/kanban/boards/:boardId` | Pendente manual |
| Abrir card de quadro existente | `/kanban/boards/:boardId` abre | Validado em 5175 |
| Criar card generico | Card aparece no quadro | Validado por API; pendente manual na UI |
| Mover card | Card muda de coluna | Pendente manual |
| Voltar para Producao | Producao continua funcionando | Validado em 5175 |
| Preview TV/Foco | Nao mostra `Falha ao carregar preview: Not Found (HTTP 404)` | Validado em 5175 |

## Responsividade

| Largura | Resultado esperado | Status |
| --- | --- | --- |
| Desktop 1440px | Hub e quadro generico utilizaveis | Validado |
| Mobile estreito | PortalShell global ainda precisa melhoria; sidebar fixa reduz area util | Pendencia baixa/media |

## Comandos finais

| Comando | Resultado |
| --- | --- |
| `npm run backend:test` | Passou |
| `npm run build --workspace=apps/web` | Passou |
| `npm run lint` | Passou |
| `npm run typecheck` | Passou |

## Como repetir workaround da porta 8000

Se `localhost:8000` continuar preso com backend antigo:

```powershell
$env:CORS_ORIGINS='http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175'
cd backend
.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --no-access-log
```

Em outro terminal:

```powershell
$env:VITE_API_BASE_URL='http://localhost:8002'
npm run dev --workspace=apps/web -- --port 5175 --strictPort
```

Depois valide:

```powershell
Invoke-RestMethod http://localhost:8002/openapi.json
```
