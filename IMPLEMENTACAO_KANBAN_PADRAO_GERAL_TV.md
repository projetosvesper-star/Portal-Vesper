# Implementacao Kanban Padrao Geral TV

## 1. Resumo executivo

Esta etapa padronizou a experiencia do Kanban como modulo unico do Portal Vesper. O Hub, o quadro generico, o Kanban Producao e a TV/Foco agora usam o mesmo conjunto visual escuro e o mesmo tratamento contextual de erro.

Nao foram implementados risco, alertas, OCR, Telegram, status automatico complexo nem novo modulo.

## 2. O que foi padronizado visualmente

- Selects/dropdowns nativos foram substituidos por `PortalSelect`.
- Estados de erro usam `ErrorState` com mensagem contextual para 404/API ausente.
- Estados vazios usam `EmptyState`.
- Cards, metricas e secoes usam `SectionCard`, `MetricCard` e `PortalBadge`.
- Dialogs usam `PortalDialog`.
- Confirmacao de remocao de checklist da OP usa `ConfirmDialog`.

## 3. Componentes criados/reutilizados

Criados em `apps/web/src/shared/ui`:

- `PageHeader`
- `SectionCard`
- `MetricCard`
- `PortalButton`
- `PortalInput`
- `PortalSelect`
- `PortalTabs`
- `PortalDialog`
- `PortalDrawer`
- `PortalBadge`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`
- `ConfirmDialog`

## 4. Hub Kanban

O Hub continua em `/kanban` e a sidebar continua exibindo apenas `Kanban`.

Contextos internos:

- Quadros
- Producao
- Projetos
- TI / Operacional
- Personalizados
- TV/Foco via botao interno

## 5. CRUD geral

Mantido o CRUD ja existente do Kanban Engine:

- Criar quadro pelo Hub.
- Criar colunas iniciais por preset.
- Abrir quadro generico em `/kanban/boards/:boardId`.
- Criar card.
- Editar card.
- Mover/reordenar card.
- Checklist, comentarios, anexos e atividade pelo drawer generico existente.

Adicionado tratamento visual para quadros sem colunas:

- Empty state: "Este quadro ainda nao possui colunas."
- Botao "Criar colunas padrao".
- Campo para criar coluna manualmente.

## 6. Producao

Kanban Producao continua em `/kanban/producao` como contexto interno especializado. A pagina manteve OPs, checklist editavel, drawer, atividade e preview TV/Foco, agora sem select nativo branco nos formularios.

## 7. TV/Foco global

Criada rota interna:

- `/kanban/tv`

Criados:

- `KanbanTvPage`
- `KanbanTvPreview`
- `KanbanTvAdapter`

A TV/Foco global permite escolher qualquer quadro permitido e alternar:

- Lista
- Kanban

Para quadro generico, usa cards/colunas do Kanban Engine. Para Producao, usa `/api/kanban/producao/tv` e adapta OPs para o mesmo formato visual.

## 8. Tratamento de 404

`formatApiError` agora retorna mensagem contextual. Para 404:

> Nao foi possivel carregar este recurso. A rota da API nao foi encontrada. Verifique se o backend ativo esta atualizado e se /api/docs lista esta rota.

Em desenvolvimento, tambem mostra endpoint, status, base configurada e sugestoes para reiniciar backend, conferir `VITE_API_BASE_URL`, conferir `/api/docs` e verificar porta antiga presa.

## 9. VITE_API_BASE_URL

O frontend nao usa mais fallback fixo para `localhost:8000`. O client le `VITE_API_BASE_URL`; se nao estiver configurado, usa caminho relativo.

Na validacao desta etapa, o backend atual foi validado em `http://localhost:8002` porque a porta `8000` permanecia presa com backend antigo.

## 10. Endpoints validados

OpenAPI ativo em `8002` listou:

- `/api/kanban/boards`
- `/api/kanban/boards/{board_id}`
- `/api/kanban/boards/{board_id}/columns`
- `/api/kanban/boards/{board_id}/cards`
- `/api/kanban/cards`
- `/api/kanban/cards/{card_id}`
- `/api/kanban/producao/ops`
- `/api/kanban/producao/dashboard`
- `/api/kanban/producao/tv`

## 11. Testes executados

Executados:

- `npm run backend:test` - OK, 25 passed.
- `npm run build --workspace=apps/web` - OK.
- `npm run lint` - OK.
- `npm run typecheck` - OK.

Validacao visual com navegador local em `http://127.0.0.1:5175` e backend atual em `http://localhost:8002`:

- Login Admin OK.
- `/kanban` abriu o Hub.
- `/kanban/tv` abriu a TV/Foco global.
- `/kanban/producao` abriu sem erro 404.
- `document.querySelectorAll("select").length` retornou `0` no Hub, Producao e TV/Foco.
- Nenhum `HTTP 404`, `Failed to fetch` ou erro de console foi observado nas telas validadas.

## 12. Arquivos alterados

- `README.md`
- `apps/web/src/app/router.tsx`
- `apps/web/src/modules/kanban/KanbanEnginePage.tsx`
- `apps/web/src/modules/kanban/KanbanHubPage.tsx`
- `apps/web/src/modules/kanban/KanbanBoardCreateDialog.tsx`
- `apps/web/src/modules/kanban/KanbanBoardPage.tsx`
- `apps/web/src/modules/kanban/KanbanBoardsOverview.tsx`
- `apps/web/src/modules/kanban/KanbanContextSelector.tsx`
- `apps/web/src/modules/kanban/KanbanTvAdapter.ts`
- `apps/web/src/modules/kanban/KanbanTvPage.tsx`
- `apps/web/src/modules/kanban/KanbanTvPreview.tsx`
- `apps/web/src/modules/kanban/api.ts`
- `apps/web/src/modules/kanban/hooks.ts`
- `apps/web/src/modules/kanban/queryKeys.ts`
- `apps/web/src/modules/kanban/components/BoardSelector.tsx`
- `apps/web/src/modules/kanban/components/BoardToolbar.tsx`
- `apps/web/src/modules/kanban/components/CardFormDialog.tsx`
- `apps/web/src/modules/kanban/components/EmptyKanbanState.tsx`
- `apps/web/src/modules/production/KanbanProducaoPage.tsx`
- `apps/web/src/modules/production/ProductionOrderDrawer.tsx`
- `apps/web/src/shared/api/client.ts`
- `apps/web/src/shared/api/errors.ts`
- `apps/web/src/shared/ui/*`
- `docs/arquitetura.md`
- `docs/kanban-engine.md`
- `docs/modulos.md`
- `IMPLEMENTACAO_KANBAN_PADRAO_GERAL_TV.md`
- `TESTE_MANUAL_KANBAN_PADRAO_GERAL.md`

## 13. Riscos pendentes

- A porta `8000` ainda pode estar ocupada por backend antigo no ambiente local; usar `8002` com `VITE_API_BASE_URL` ate liberar a porta.
- Playwright E2E ainda nao esta instalado/configurado no projeto.
- Edicao/arquivamento/exclusao de board como fluxo administrativo completo segue como proxima melhoria, apesar do backend ja possuir rotas de update/delete.

## 14. Proximo passo recomendado

Configurar Playwright E2E para validar login, Hub, TV/Foco, criacao de quadro, criacao de card, fluxo Producao e ausencia de 404/Failed to fetch em navegador real.
