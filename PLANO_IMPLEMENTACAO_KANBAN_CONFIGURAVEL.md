# PLANO DE IMPLEMENTACAO KANBAN CONFIGURAVEL

Data: 2026-05-20  
Base: `AUDITORIA_KANBAN_CONFIGURAVEL.md`  
Objetivo: evoluir o Kanban Engine em fases pequenas, seguras e testaveis.

## Principio de implementacao

O Kanban Engine generico deve permanecer estavel. A configuracao deve entrar como camada adicional e com fallback para o comportamento atual.

Regras:

- Nao quebrar `/kanban`, `/kanban/boards/:boardId`, `/kanban/tv` e `/kanban/producao`.
- Nao mover dados de Producao para metadata.
- Nao criar tabelas dedicadas na primeira fase se metadata versionada resolver.
- Validar metadata no backend antes de confiar no frontend.
- Preservar boards/cards existentes sem configuracao.

## Fase 0 - Preparacao tecnica curta

Objetivo: reduzir risco antes de mexer na UI dinamica.

Tarefas:

- Definir contrato `KanbanBoardConfig` versionado.
- Definir contrato `KanbanCustomFieldDefinition`.
- Definir contrato `KanbanCardCustomFields`.
- Corrigir warnings Pydantic em schemas novos usando `ConfigDict`.
- Decidir nome publico para schema de card type sem conflitar com `BaseModel.schema`.
- Criar helpers backend para normalizar config ausente.
- Criar fixtures/testes base para boards com e sem config.

Criterio de aceite:

- Testes backend passam.
- Nenhum fluxo existente muda visualmente.
- Contrato de config documentado.

## Fase 1 - Configuracao por board via metadata

Objetivo: permitir primeira especializacao configuravel por quadro sem criar novas tabelas.

Backend:

- Adicionar permissao `kanban.board.configure`.
- Criar schemas:
  - `KanbanBoardConfigRead`
  - `KanbanBoardConfigUpdate`
  - `KanbanTerminologyConfig`
  - `KanbanCustomFieldDefinition`
  - `KanbanTvConfig`
  - `KanbanVisualConfig`
- Criar endpoints:
  - `GET /api/kanban/boards/{board_id}/config`
  - `PATCH /api/kanban/boards/{board_id}/config`
  - `POST /api/kanban/boards/{board_id}/config/validate`
- Salvar configuracao em `KanbanBoard.metadata.config`.
- Usar merge controlado em vez de substituir metadata inteira.
- Criar evento `kanban.board.config.updated`.
- Criar audit log especifico para alteracao de config.
- Validar `KanbanCard.metadata.customFields` em `createCard` e `updateCard`.
- Garantir limite aplicacional de tamanho para metadata/config.

Frontend:

- Criar tipos:
  - `KanbanBoardConfig`
  - `KanbanTerminologyConfig`
  - `KanbanCustomFieldDefinition`
  - `KanbanTvConfig`
- Criar API/hook para config do board.
- Criar normalizador de config com defaults.
- Adaptar `KanbanEnginePage` para labels dinamicos:
  - nome do item;
  - botao novo item;
  - labels de campos;
  - empty states.
- Adaptar `CardFormDialog`:
  - campos basicos preservados;
  - campos customizados simples;
  - salvar valores em `metadata.customFields`.
- Adaptar `CardDetailDrawer`:
  - exibir campos customizados;
  - respeitar `showInDrawer`;
  - manter abas atuais.
- Adaptar cards:
  - exibir campos com `showInCard`.
- Manter fallback quando `metadata.config` nao existir.

Tipos de campo permitidos na Fase 1:

- `text`
- `textarea`
- `number`
- `date`
- `select`
- `boolean`

Fora da Fase 1:

- Campos relacionais.
- Campos calculados.
- Permissoes por campo.
- Filtros avancados por custom field.
- Relatorios em cima de custom fields.

Testes:

- Board sem config continua funcionando.
- Board com terminologia altera labels.
- Criar card com custom fields salva metadata.
- Editar card com custom fields atualiza metadata.
- Campo obrigatorio e validado.
- Usuario sem `kanban.board.configure` recebe 403 no endpoint de config.
- Evento/audit de config e criado.

Criterio de aceite:

- `npm run backend:test` passa.
- `npm run build --workspace=apps/web` passa.
- `npm run lint` passa.
- `npm run typecheck` passa.
- Smoke API passa com backend ativo.
- E2E minimo passa com `dev:portal` ativo ou ambiente explicitamente configurado.

## Fase 2 - Contextos do Hub e templates editaveis

Objetivo: tirar contextos e presets principais do codigo, mantendo fallback.

Backend:

- Definir se contextos ficam em tabela nova ou metadata global. Recomendacao inicial: endpoint derivado dos boards + templates em metadata ate validar uso.
- Criar permissao `kanban.context.manage`.
- Criar permissao `kanban.template.manage`.
- Criar endpoints de contextos:
  - `GET /api/kanban/contexts`
  - `POST /api/kanban/contexts`
  - `PATCH /api/kanban/contexts/{context_id}`
  - `DELETE /api/kanban/contexts/{context_id}`
- Criar endpoints de templates:
  - `GET /api/kanban/templates`
  - `POST /api/kanban/templates`
  - `PATCH /api/kanban/templates/{template_id}`
  - `DELETE /api/kanban/templates/{template_id}`

Frontend:

- Substituir contextos hardcoded do Hub por dados da API.
- Manter contextos atuais como fallback se API nao existir/falhar.
- Criar editor simples de templates.
- Permitir criar board a partir de template.
- Permitir esconder/mostrar contextos.

Testes:

- Contexto novo aparece no Hub.
- Contexto desativado some.
- Template cria board com colunas e config.
- Fallback hardcoded continua se config ausente.

## Fase 3 - CRUD avancado, card types e permissoes por quadro

Objetivo: completar o controle operacional e administrativo.

Backend:

- Expor `KanbanCardType`:
  - `GET /api/kanban/boards/{board_id}/card-types`
  - `POST /api/kanban/boards/{board_id}/card-types`
  - `GET /api/kanban/card-types/{card_type_id}`
  - `PATCH /api/kanban/card-types/{card_type_id}`
  - `DELETE /api/kanban/card-types/{card_type_id}`
- Adicionar permissoes:
  - `kanban.card_type.view`
  - `kanban.card_type.manage`
- Validar `card_type_id`:
  - tipo existe;
  - tipo esta ativo;
  - tipo pertence ao mesmo board do card ou e global permitido.
- Melhorar endpoints de board permissions.
- Garantir enforcement por board nos fluxos principais, se essa politica for adotada.
- Criar activity/audit detalhada para configuracao, card types e permissions.

Frontend:

- Card type manager.
- Seletor de tipo de card no form.
- Form dinamico combinando board config + card type.
- UI de board permissions.
- CRUD visual mais completo de colunas e cards.

Testes:

- Card type CRUD.
- Card type de outro board e bloqueado.
- Board permissions bloqueiam/permitem conforme esperado.
- Activity/audit aparecem.

## Fase 4 - TV/Foco configuravel por quadro e E2E completo

Objetivo: padronizar a exibicao de telao para qualquer Kanban.

Backend:

- Se necessario, criar endpoint especifico de TV generico por board:
  - `GET /api/kanban/boards/{board_id}/tv`
- Ou manter composicao frontend via boards, columns e cards se performance for aceitavel.
- Garantir que Producao continue usando endpoint especializado quando necessario.

Frontend:

- Atualizar `KanbanTvAdapter` para ler `board.metadata.config.tv`.
- Permitir selecionar campos de titulo, subtitulo, tags, progresso e agrupamento.
- Usar terminologia configurada.
- Garantir que Producao continue adaptada sem perder OP, cliente, modelo e checklist.

E2E:

- Login Admin.
- Criar board configurado.
- Criar card com custom fields.
- Validar drawer dinamico.
- Validar TV/Foco com campos configurados.
- Validar Producao sem regressao.

## Tabelas futuras possiveis

Criar somente quando houver necessidade clara:

- `kanban_contexts`: se contextos precisarem ser entidades administrativas globais.
- `kanban_board_templates`: se templates forem reutilizaveis e versionados.
- `kanban_field_definitions`: se campos precisarem de vida propria, permissao e reuso.
- `kanban_card_field_values`: se custom fields precisarem de filtros, ordenacao e relatorios performaticos.
- `kanban_card_type_fields`: se `KanbanCardType` virar o schema principal.

## Riscos e mitigacoes

Risco: quebrar Producao.  
Mitigacao: nao alterar `production_orders`; Producao le config apenas para labels opcionais.

Risco: quebrar TV/Foco.  
Mitigacao: adapter com fallback; testes para generico e Producao.

Risco: quebrar E2E por runtime config.  
Mitigacao: rodar `npm run dev:portal` antes de E2E ou informar `E2E_BASE_URL` e `E2E_API_BASE_URL`.

Risco: metadata livre causar dados invalidos.  
Mitigacao: schema Pydantic, limite de tamanho e normalizador central.

Risco: atualizacao concorrente sobrescrever metadata.  
Mitigacao: endpoint de config com merge controlado e campo `configVersion`.

Risco: UI dinamica virar complexa demais.  
Mitigacao: Fase 1 aceita poucos tipos de campo e sem regras condicionais.

## Comandos de validacao por fase

Obrigatorios:

```bash
npm run backend:test
npm run build --workspace=apps/web
npm run lint
npm run typecheck
```

Com backend/frontend ativos:

```bash
npm run smoke:api
npm run e2e -- --project=chromium
```

Para ambiente local mais estavel:

```bash
npm run dev:portal
```

## Recomendacao final

Comecar pela Fase 1 usando `KanbanBoard.metadata.config` e `KanbanCard.metadata.customFields`. Essa abordagem entrega configuracao real com baixo risco, evita migration prematura e preserva Producao.

Nao iniciar com tabelas dedicadas. A promocao para tabelas deve acontecer somente quando houver necessidade concreta de consulta, relatorio, template versionado ou permissao granular.

