# Implementacao Kanban Geral Hub

## 1. Resumo executivo

O `/kanban` foi transformado em um Hub real do modulo Kanban unico. A sidebar continua exibindo apenas `Kanban`; Producao, Projetos, TI / Operacional e Personalizados ficam dentro do Hub.

Nao foram implementados risco, alertas, OCR, Telegram, status automatico complexo ou outro modulo.

## 2. O que foi implementado

- Hub Kanban com contextos:
  - Quadros;
  - Producao;
  - Projetos;
  - TI / Operacional;
  - Personalizados.
- Lista de quadros do Kanban Engine.
- Filtro por tipo de quadro.
- Cards de quadro com tipo, contexto, status, contagem de cards e ultima atualizacao.
- Modal `Novo quadro`.
- Criacao de quadro generico usando endpoints existentes do Kanban Engine.
- Criacao automatica de colunas iniciais pelo API de colunas.
- Rota canonica para quadro generico: `/kanban/boards/:boardId`.
- Compatibilidade com rota antiga `/kanban/:boardId`.
- Mensagem contextual para erro 404 de API esperada.
- Diagnostico anti-404 documentado.

## 3. Como funciona o Hub Kanban

O usuario acessa `/kanban` pela sidebar. A tela lista quadros e permite alternar contexto sem criar novos itens na sidebar.

O contexto `Producao` navega para `/kanban/producao`, mantendo a especializacao existente.

Os contextos `Projetos`, `TI / Operacional` e `Personalizados` filtram quadros genericos do Kanban Engine por `board_type` e `module_context`.

## 4. Como criar quadro

O botao `Novo quadro` abre um modal com:

- nome;
- descricao;
- tipo;
- contexto;
- cor;
- icone;
- preset de colunas.

Presets:

- Basico;
- Projetos;
- TI;
- Personalizado.

A UI cria o board via `POST /api/kanban/boards` e depois cria colunas via `POST /api/kanban/boards/{board_id}/columns`.

## 5. Como abrir quadro

Ao clicar em um card de quadro, a UI navega para:

```text
/kanban/boards/:boardId
```

Essa rota usa o Kanban Engine generico, com colunas, cards, criar/editar/mover card, drawer, checklist, comentarios, anexos e atividade conforme ja existente.

## 6. Como Producao fica dentro do Hub

Producao nao tem item proprio na sidebar. O contexto `Producao` aparece dentro do Hub somente se o usuario possuir `kanban_producao.view`.

A rota especializada continua:

```text
/kanban/producao
```

## 7. Como Projetos/TI usam Kanban generico

Projetos:

- `board_type=projects`;
- `module_context=projetos`.

TI / Operacional:

- `board_type=operational` ou `helpdesk`;
- ou `module_context=ti` / `operacional`.

Personalizados:

- `board_type=custom`.

Nenhum modulo novo foi criado.

## 8. Auditoria anti-404

Foi validado que o backend ativo na porta 8000 estava desatualizado:

```text
8000 production route present: False
```

O Windows reportou a porta 8000 presa em PIDs `13168` e `23672`, mas `taskkill` informou que os processos nao existiam. Por isso foi usado o workaround previsto:

- backend atual em `http://localhost:8002`;
- frontend temporario em `http://127.0.0.1:5175`;
- `VITE_API_BASE_URL=http://localhost:8002`;
- CORS do backend temporario incluindo `http://127.0.0.1:5175`.

## 9. OpenAPI ativo

OpenAPI validado em:

```text
http://localhost:8002/openapi.json
```

Rotas esperadas presentes:

- `/api/kanban/producao/ops`
- `/api/kanban/producao/dashboard`
- `/api/kanban/producao/tv`
- `/api/kanban/producao/checklist-templates`
- `/api/kanban/boards`
- `/api/kanban/boards/{board_id}`
- `/api/kanban/boards/{board_id}/columns`
- `/api/kanban/boards/{board_id}/cards`
- `/api/kanban/cards`
- `/api/kanban/cards/{card_id}`

## 10. Smoke anti-404

Resultado contra backend atual em 8002:

| Endpoint/acao | Resultado |
| --- | --- |
| `GET /api/kanban/boards` | 200 |
| `GET /api/kanban/producao/ops` | 200 |
| `GET /api/kanban/producao/dashboard` | 200 |
| `GET /api/kanban/producao/tv?mode=list` | 200 |
| `GET /api/kanban/producao/tv?mode=kanban` | 200 |
| `POST /api/kanban/boards` Projetos | 201 |
| `POST /api/kanban/boards/{id}/columns` | 201 |
| `POST /api/kanban/cards` | 201 |
| `GET /api/kanban/boards/{id}` | 200 |
| `GET /api/kanban/boards/{id}/columns` | 200 |
| `GET /api/kanban/boards/{id}/cards` | 200 |
| `POST /api/kanban/boards` TI | 201 |

Nenhum endpoint esperado retornou 404 no backend atual.

## 11. API_BASE_URL/proxy

Nao ha proxy Vite configurado para API. O frontend usa `VITE_API_BASE_URL` ou fallback `http://localhost:8000`.

Como a porta 8000 estava presa com backend antigo, a validacao visual foi feita com:

```text
VITE_API_BASE_URL=http://localhost:8002
```

## 12. Permissoes

Regras aplicadas:

- `kanban.view`: acesso ao Hub via modulo Kanban.
- `kanban.board.view`: listagem de quadros pelo backend.
- `kanban.board.create`: exibe botao `Novo quadro`.
- `kanban_producao.view`: exibe contexto Producao.
- `kanban.card.*`: continuam validadas pelo Kanban Engine.

## 13. WebSocket e TanStack Query

Eventos `kanban.*` no Hub invalidam, com debounce:

- boards;
- board detail;
- columns;
- cards;
- board activity.

Eventos `kanban_producao.*` continuam tratados pela tela de Producao.

Mutations de criar quadro/colunas invalidam queries apos sucesso.

## 14. Testes e validacao visual

Comandos:

| Comando | Resultado |
| --- | --- |
| `npm run backend:test` | Passou: 25 testes |
| `npm run build --workspace=apps/web` | Passou |
| `npm run lint` | Passou |
| `npm run typecheck` | Passou |

Validacao visual com Playwright MCP:

- login Admin em `http://127.0.0.1:5175`;
- `/kanban` abriu o Hub;
- sidebar mostrou apenas `Kanban`;
- contextos apareceram dentro do Hub;
- `/kanban/boards/:boardId` abriu quadro generico;
- `/kanban/producao` abriu sem `Not Found (HTTP 404)`;
- WebSocket ficou online.

## 15. Arquivos alterados

- `README.md`
- `apps/web/src/app/router.tsx`
- `apps/web/src/modules/kanban/KanbanEnginePage.tsx`
- `apps/web/src/modules/kanban/KanbanHubPage.tsx`
- `apps/web/src/modules/kanban/KanbanBoardCreateDialog.tsx`
- `apps/web/src/modules/kanban/KanbanBoardPage.tsx`
- `apps/web/src/modules/kanban/KanbanBoardsOverview.tsx`
- `apps/web/src/modules/kanban/KanbanContextSelector.tsx`
- `apps/web/src/modules/kanban/api.ts`
- `apps/web/src/modules/kanban/hooks.ts`
- `apps/web/src/modules/kanban/queryKeys.ts`
- `apps/web/src/modules/production/KanbanProducaoPage.tsx`
- `apps/web/src/shared/api/client.ts`
- `apps/web/src/shared/api/errors.ts`
- `docs/arquitetura.md`
- `docs/kanban-engine.md`
- `docs/modulos.md`
- `IMPLEMENTACAO_KANBAN_GERAL_HUB.md`
- `TESTE_MANUAL_KANBAN_GERAL_HUB.md`

## 16. Proximos passos

1. Liberar ou corrigir a porta 8000 no Windows para voltar ao fluxo padrao.
2. Configurar Playwright E2E oficial no monorepo.
3. Melhorar responsividade global do PortalShell para telas muito estreitas.
4. Evoluir UI operacional do Kanban generico sem criar novos itens na sidebar.
