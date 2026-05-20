# Implementacao Kanban Configuravel Fase 2

## Resumo executivo

A Fase 2 foi implementada para tornar o Hub Kanban configuravel pelo Portal. O Kanban continua sendo o unico modulo da sidebar, mas agora os contextos internos e templates de quadro sao persistentes, validados pelo backend e consumidos pela UI.

Nao foram implementados risco, alertas, OCR, Telegram, status automatico complexo, permissoes por campo, relatorios analiticos ou novos modulos.

## Limpeza tecnica

- Schemas Kanban migrados para `model_config = ConfigDict(...)` nos pontos tocados.
- `CardType*` passou a usar `field_schema`, aceitando o alias antigo `schema` para compatibilidade.
- O aviso de chunk acima de 500 kB ainda aparece no build. A correcao segura e code-splitting por rotas grandes do Kanban, documentada como pendencia baixa.

## Decisao tecnica

Foi usada configuracao persistente simples em JSONB dentro de um board interno de sistema:

- board key: `__kanban_hub_config__`
- metadata key: `hubConfig`

Essa abordagem evita migration nesta fase, preserva a arquitetura atual e deixa o caminho aberto para tabelas dedicadas se os contextos/templates exigirem consultas complexas no futuro.

## Contextos configuraveis

Endpoints criados:

- `GET /api/kanban/contexts`
- `POST /api/kanban/contexts`
- `PATCH /api/kanban/contexts/{context_key}`
- `DELETE /api/kanban/contexts/{context_key}`
- `POST /api/kanban/contexts/restore-defaults`
- `POST /api/kanban/contexts/reorder`

Funcionalidades:

- listar contextos do Hub pela API;
- fallback local se a API falhar;
- ocultar e reativar contexto;
- criar contexto customizado;
- reordenar contextos;
- restaurar padroes;
- contextos de sistema nao sao removidos fisicamente;
- contextos customizados usam soft delete.

## Templates configuraveis

Endpoints criados:

- `GET /api/kanban/templates`
- `POST /api/kanban/templates`
- `GET /api/kanban/templates/{template_key}`
- `PATCH /api/kanban/templates/{template_key}`
- `DELETE /api/kanban/templates/{template_key}`
- `POST /api/kanban/templates/{template_key}/duplicate`
- `POST /api/kanban/templates/{template_key}/restore`

Templates padrao:

- Basico
- Projetos
- TI / Chamados
- Operacional
- Manutencao
- Compras internas
- Comercial
- Personalizado

## Criacao de quadro por template

Endpoint criado:

- `POST /api/kanban/boards/from-template`

O endpoint valida template e contexto, cria board, aplica `board_type`, `module_context`, `metadata.config`, cria colunas do template, registra auditoria/atividade e publica evento.

## Frontend

O Hub Kanban agora:

- carrega contextos pela API;
- respeita `visible`, `order` e `requiredPermission`;
- mostra contextos customizados;
- mantem Producao como rota especializada interna;
- usa fallback hardcoded se a API de contextos/templates falhar;
- abre `KanbanHubConfigDialog` para administracao de contextos e templates;
- cria boards por template e redireciona para `/kanban/boards/:boardId`.

A TV/Foco global passou a considerar contextos visiveis ao listar boards permitidos.

## Permissoes

Permissoes adicionadas:

- `kanban.context.view`
- `kanban.context.manage`
- `kanban.template.view`
- `kanban.template.manage`

Administrador recebe acesso total. Perfis com Kanban receberam permissoes de visualizacao quando adequado. A UI de configuracao aparece para usuarios com permissao de gerenciamento do Hub, `kanban.admin` ou permissao administrativa equivalente.

## Eventos

Eventos adicionados:

- `kanban.context.created`
- `kanban.context.updated`
- `kanban.context.deleted`
- `kanban.context.reordered`
- `kanban.context.defaults_restored`
- `kanban.template.created`
- `kanban.template.updated`
- `kanban.template.deleted`
- `kanban.template.duplicated`
- `kanban.template.restored`
- `kanban.board.created_from_template`

Eventos administrativos geram audit log e sao publicados para `ws:module:kanban` e `stream:module_events`.

## Bugs encontrados e corrigidos

- Condicao de corrida ao criar o board interno `__kanban_hub_config__` quando E2E rodava testes em paralelo. Corrigido com tratamento de `IntegrityError` e refetch do board existente.
- `dev:portal` guardava uma Promise como processo do backend. Corrigido com `await spawnBackend(...)` para cleanup correto.
- E2E de Producao clicava em um card/board de Producao em vez do contexto especializado. O seletor foi ajustado.
- E2E foi serializado (`workers: 1`) porque os testes alteram estado compartilhado do Hub.

## Comandos executados

- `npm run backend:test` - passou, 30 testes.
- `npm run build --workspace=apps/web` - passou, com aviso de chunk acima de 500 kB.
- `npm run lint` - passou.
- `npm run typecheck` - passou.
- `npm run dev:portal` - passou em `http://localhost:8000` e `http://127.0.0.1:5174`.
- `npm run smoke:api` - passou, OpenAPI validou rotas novas.
- `npm run e2e -- --project=chromium` - passou, 2 testes.

## Riscos pendentes

- Bundle JS principal esta acima de 500 kB. Recomendado aplicar lazy loading nas rotas maiores do Kanban em uma etapa dedicada.
- Contextos/templates estao em JSONB. E suficiente para esta fase, mas tabelas dedicadas podem ser melhores quando houver busca, historico detalhado e relatorios por template.
- Atividade detalhada do dialog do Hub ainda mostra pendencia visual; as alteracoes ja geram audit/eventos, mas nao ha tela dedicada para esse historico.

## Arquivos principais alterados

- `backend/app/modules/kanban/hub_config.py`
- `backend/app/modules/kanban/router.py`
- `backend/app/modules/kanban/service.py`
- `backend/app/modules/kanban/schemas.py`
- `backend/app/modules/kanban/events.py`
- `backend/app/modules/kanban/permissions.py`
- `backend/seeds/initial_seed.py`
- `backend/tests/test_kanban_engine.py`
- `apps/web/src/modules/kanban/KanbanHubPage.tsx`
- `apps/web/src/modules/kanban/KanbanHubConfigDialog.tsx`
- `apps/web/src/modules/kanban/KanbanBoardCreateDialog.tsx`
- `apps/web/src/modules/kanban/KanbanTvPage.tsx`
- `apps/web/src/modules/kanban/api.ts`
- `apps/web/src/modules/kanban/hooks.ts`
- `apps/web/src/modules/kanban/queryKeys.ts`
- `apps/web/src/modules/kanban/types.ts`
- `apps/web/src/modules/kanban/hubConfig.ts`
- `scripts/dev-portal.mjs`
- `scripts/smoke-kanban-api.mjs`
- `playwright.config.ts`
- `e2e/playwright/tests/kanban_geral.spec.ts`
- `e2e/playwright/tests/kanban_producao.spec.ts`

## Proximo passo recomendado

Avancar para a Fase 3: CRUD avancado e permissoes por quadro, mantendo contextos/templates configuraveis como base.
