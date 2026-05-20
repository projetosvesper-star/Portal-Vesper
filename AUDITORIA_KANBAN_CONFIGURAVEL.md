# AUDITORIA KANBAN CONFIGURAVEL

Data: 2026-05-20  
Escopo: auditoria tecnica sem implementacao da camada configuravel completa  
Status: concluida

## 1. Resumo executivo

O Kanban Engine atual tem uma base solida para CRUD operacional de quadros, colunas, cards, checklist, comentarios, anexos, atividade, auditoria e eventos. Ele tambem ja possui os pontos tecnicos principais para iniciar configuracao dinamica: `KanbanBoard.metadata`, `KanbanColumn.metadata`, `KanbanCard.metadata` e o modelo `KanbanCardType` com `schema` JSONB.

Apesar disso, o Kanban ainda nao esta pronto para ser configuravel pelo administrador sem novas implementacoes. O backend aceita metadata livre, mas nao valida contrato, nao limita tamanho, nao tem endpoint dedicado para configuracao do board e nao expoe `KanbanCardType` por API. O frontend ainda usa contextos, presets, textos, formulario de card, drawer e TV/Foco com varias regras fixas no codigo.

Recomendacao final: para a primeira iteracao, usar metadata JSONB com schema versionado e validado no backend. Nao criar tabelas dedicadas agora, exceto se o escopo crescer para filtros analiticos, templates reutilizaveis complexos ou permissoes por campo. `KanbanCardType` deve ser aproveitado, mas precisa primeiro ser exposto por service/router, corrigir o campo Pydantic `schema` e validar que o tipo pertence ao board do card.

## 2. Estado atual do backend

Arquivos auditados:

- `backend/app/modules/kanban/models.py`
- `backend/app/modules/kanban/schemas.py`
- `backend/app/modules/kanban/repository.py`
- `backend/app/modules/kanban/service.py`
- `backend/app/modules/kanban/router.py`
- `backend/app/modules/kanban/permissions.py`
- `backend/app/modules/kanban/events.py`
- `backend/tests/test_kanban_engine.py`

Models existentes:

- `KanbanBoard`: possui `board_type`, `module_context`, `color`, `icon`, `is_active`, `is_archived` e `metadata_json` em JSONB.
- `KanbanColumn`: possui `key`, `name`, `wip_limit`, `is_done`, `order_index` e `metadata_json`.
- `KanbanCardType`: existe com `board_id`, `key`, `name`, `color`, `icon`, `is_active` e `schema_json` em JSONB.
- `KanbanCard`: possui campos genericos e `metadata_json`, alem de `card_type_id`.
- Existem tabelas de responsaveis, checklist, comentarios, anexos, activity logs e board permissions.

Schemas:

- Board, column e card ja aceitam `metadata`.
- Card type tem schemas Pydantic, mas o campo publico `schema` gera warning por sombrear atributo de `BaseModel`.
- Os schemas ainda usam `class Config`, que gera warning de depreciacao em Pydantic v2.
- Nao ha schema forte para configuracao dinamica de board ou campos customizados.

Repository:

- Ja possui metodos para board, column, card, checklist, comments, attachments, activity e board permissions.
- Ja possui `get_card_type`, `list_card_types`, `create_card_type` e `update_card_type`.
- Nao ha delete/desativacao exposta para `KanbanCardType` no service/router.

Service:

- Implementa CRUD de boards, columns e cards.
- Cria activity logs, audit logs e eventos.
- Valida regras importantes, como impedir card em coluna de outro board.
- Atualiza `metadata_json` de board/card quando `metadata` e enviado, mas substitui o objeto inteiro.
- Nao possui metodos de negocio para `KanbanCardType`.
- Nao valida `card_type_id` contra o board do card.
- Nao valida estrutura, tamanho ou chaves permitidas de metadata.
- Board permissions existem como dados, mas a aplicacao pratica por board ainda parece incompleta no fluxo principal.

Router:

- Expõe o Kanban Engine operacional.
- Nao expoe endpoints de card types.
- Nao expoe endpoint dedicado para configuracao de board.
- Nao expoe endpoints de contextos/templates configuraveis.

## 3. Estado atual do frontend

Arquivos auditados:

- `apps/web/src/modules/kanban/api.ts`
- `apps/web/src/modules/kanban/types.ts`
- `apps/web/src/modules/kanban/hooks.ts`
- `apps/web/src/modules/kanban/queryKeys.ts`
- `apps/web/src/modules/kanban/KanbanHubPage.tsx`
- `apps/web/src/modules/kanban/KanbanBoardPage.tsx`
- `apps/web/src/modules/kanban/KanbanBoardCreateDialog.tsx`
- `apps/web/src/modules/kanban/KanbanEnginePage.tsx`
- `apps/web/src/modules/kanban/KanbanTvPage.tsx`
- `apps/web/src/modules/kanban/KanbanTvAdapter.ts`
- `apps/web/src/modules/kanban/components/*`
- `apps/web/src/modules/production/KanbanProducaoPage.tsx`
- `apps/web/src/shared/api/client.ts`
- `apps/web/src/shared/api/errors.ts`
- `apps/web/src/shared/config/runtimeConfig.ts`
- `apps/web/src/shared/ui/*`

Pontos positivos:

- `types.ts` ja representa `metadata` em board, column e card.
- `KanbanCardType` existe no frontend, embora nao seja consumido pela API.
- API client ja suporta create/update board e card com metadata.
- Hub, quadro generico, TV/Foco global e Producao existem.
- `PortalSelect` evita select nativo branco e ja segue padrao escuro.
- `formatApiError` contextualiza 404 em desenvolvimento.
- Runtime config permite apontar frontend para backend em porta diferente.

Lacunas:

- Contextos do Hub sao hardcoded: Quadros, Producao, Projetos, TI / Operacional e Personalizados.
- Presets de colunas sao hardcoded no `KanbanBoardCreateDialog`.
- `CardFormDialog` tem campos fixos e nao renderiza campos dinamicos.
- `CardDetailDrawer` nao mostra `metadata.customFields`.
- `KanbanCard` visual nao adapta campos por board.
- TV/Foco global adapta dados, mas nao le uma configuracao de TV definida no board.
- Ha textos com problemas de encoding em varios arquivos, como `ProduÃ§Ã£o` e `TÃ­tulo`.
- Checklist generico nao tem reorder nem edicao inline na UI, embora o backend cubra parte do checklist.
- Comentarios genericos tem criar/listar, mas a UI nao cobre edicao/exclusao mesmo existindo backend.

## 4. Estado atual dos testes

Backend:

- `backend/tests/test_kanban_engine.py` cobre autenticacao, permissao, criar board, criar coluna, criar card, protecao contra coluna de outro board, mover/reordenar card, checklist, comentarios, anexos, soft delete e activity.
- Nao cobre configuracao dinamica, metadata schema, card types, contextos configuraveis ou templates de board.

E2E:

- Existem `e2e/playwright/tests/kanban_geral.spec.ts` e `e2e/playwright/tests/kanban_producao.spec.ts`.
- Eles dependem de frontend ativo em porta conhecida ou `runtime-config.json`.
- Nao cobrem configuracao dinamica.

Scripts:

- `scripts/dev-portal.mjs` escolhe portas de backend/frontend, valida health/OpenAPI/CORS e gera `runtime-config.json`.
- `scripts/smoke-kanban-api.mjs` valida health e OpenAPI nas rotas de Kanban.
- O smoke usa `SMOKE_API_BASE_URL`, depois `runtime-config.json`, depois fallback `http://localhost:8002`.

## 5. O que ja esta pronto

- Estrutura de dados generica com JSONB.
- CRUD operacional do Kanban Engine.
- Activity log, audit log e eventos.
- WebSocket/provider unico no frontend.
- Runtime config para evitar backend antigo preso em porta fixa.
- UI do Hub Kanban, quadro generico, TV/Foco global e Producao.
- Testes backend do fluxo operacional passam.

## 6. O que esta parcialmente pronto

- `KanbanCardType`: modelo, schemas e repository existem, mas falta service/router/API/UI.
- Metadata: persiste, mas sem contrato, sem validacao e sem merge seguro.
- Board permissions: tabela e rotas existem, mas precisam ser aplicadas de forma clara nos fluxos por board.
- TV/Foco: ja e global, mas nao configuravel por board.
- Drawer generico: funcional, mas abaixo da flexibilidade do drawer de Producao.
- Error handling: existe, mas precisa ser aplicado uniformemente em todos os pontos.

## 7. O que falta

- Contrato versionado de configuracao do board.
- Endpoint dedicado para ler/alterar configuracao.
- Validacao backend de `metadata.config` e `metadata.customFields`.
- Endpoints de card types.
- Permissoes especificas para configurar board, card types, templates e contextos.
- UI de configuracao por board.
- Formulario dinamico de card.
- Drawer dinamico.
- TV/Foco configuravel por board.
- E2E de configuracao dinamica.

## 8. Endpoints existentes

Prefixo: `/api/kanban`.

Boards:

- `GET /boards`
- `POST /boards`
- `GET /boards/{board_id}`
- `PATCH /boards/{board_id}`
- `DELETE /boards/{board_id}`
- `GET /boards/{board_id}/permissions`
- `POST /boards/{board_id}/permissions`
- `DELETE /boards/{board_id}/permissions/{permission_id}`

Columns:

- `GET /boards/{board_id}/columns`
- `POST /boards/{board_id}/columns`
- `PATCH /columns/{column_id}`
- `DELETE /columns/{column_id}`
- `POST /boards/{board_id}/columns/reorder`

Cards:

- `GET /boards/{board_id}/cards`
- `POST /cards`
- `GET /cards/{card_id}`
- `PATCH /cards/{card_id}`
- `DELETE /cards/{card_id}`
- `POST /cards/{card_id}/move`
- `POST /cards/{card_id}/archive`
- `POST /cards/{card_id}/restore`

Assignees:

- `POST /cards/{card_id}/assignees`
- `DELETE /cards/{card_id}/assignees/{user_id}`

Checklist:

- `GET /cards/{card_id}/checklist`
- `POST /cards/{card_id}/checklist`
- `PATCH /checklist/{item_id}`
- `DELETE /checklist/{item_id}`

Comments:

- `GET /cards/{card_id}/comments`
- `POST /cards/{card_id}/comments`
- `PATCH /comments/{comment_id}`
- `DELETE /comments/{comment_id}`

Attachments:

- `GET /cards/{card_id}/attachments`
- `POST /cards/{card_id}/attachments`
- `DELETE /cards/{card_id}/attachments/{attachment_id}`

Activity:

- `GET /cards/{card_id}/activity`
- `GET /boards/{board_id}/activity`

Total auditado: 36 endpoints no router Kanban.

## 9. Endpoints faltantes

Prioridade alta para primeira iteracao configuravel:

- `GET /api/kanban/boards/{board_id}/config`
- `PATCH /api/kanban/boards/{board_id}/config`
- `POST /api/kanban/boards/{board_id}/config/validate`
- `GET /api/kanban/boards/{board_id}/card-types`
- `POST /api/kanban/boards/{board_id}/card-types`
- `GET /api/kanban/card-types/{card_type_id}`
- `PATCH /api/kanban/card-types/{card_type_id}`
- `DELETE /api/kanban/card-types/{card_type_id}`

Prioridade media/fases seguintes:

- `GET /api/kanban/contexts`
- `POST /api/kanban/contexts`
- `PATCH /api/kanban/contexts/{context_id}`
- `DELETE /api/kanban/contexts/{context_id}`
- `GET /api/kanban/templates`
- `POST /api/kanban/templates`
- `PATCH /api/kanban/templates/{template_id}`
- `DELETE /api/kanban/templates/{template_id}`
- `PATCH /api/kanban/cards/{card_id}/custom-fields`
- `GET /api/kanban/boards/{board_id}/my-access`

## 10. UI existente

- `/kanban`: Hub Kanban.
- `/kanban/boards/:boardId`: quadro generico via `KanbanEnginePage`.
- `/kanban/producao`: especializacao de Producao.
- `/kanban/tv`: TV/Foco global.
- `KanbanBoardCreateDialog`: cria quadro e colunas iniciais.
- `CardFormDialog`: cria/edita card generico.
- `CardDetailDrawer`: mostra resumo, checklist, comentarios, anexos e atividade.
- Componentes compartilhados escuros: `PortalButton`, `PortalInput`, `PortalSelect`, `PortalDialog`, `PortalDrawer`, `PortalBadge`, `EmptyState`, `ErrorState`, etc.

## 11. UI faltante

- Tela de configuracao do board.
- Editor visual de terminologia.
- Editor visual de campos customizados.
- Gerenciador de card types.
- Gerenciador de templates de board/colunas.
- Gerenciador de contextos do Hub.
- Form renderer dinamico.
- Field renderer dinamico no card e drawer.
- Configurador de TV/Foco por board.
- Tela para board permissions por quadro, caso o escopo inclua permissoes granulares por board.

## 12. Permissoes existentes

Principais permissoes auditadas:

- `kanban.view`
- `kanban.board.view`
- `kanban.board.create`
- `kanban.board.edit`
- `kanban.board.delete`
- `kanban.board.manage_permissions`
- `kanban.column.view`
- `kanban.column.create`
- `kanban.column.edit`
- `kanban.column.delete`
- `kanban.column.reorder`
- `kanban.card.view`
- `kanban.card.create`
- `kanban.card.edit`
- `kanban.card.delete`
- `kanban.card.archive`
- `kanban.card.restore`
- `kanban.card.move`
- `kanban.card.reorder`
- `kanban.card.assign`
- `kanban.card.comment`
- `kanban.card.attach`
- `kanban.card.checklist`
- `kanban.activity.view`
- `kanban.audit.view`
- `kanban.admin`

## 13. Permissoes faltantes

Recomendadas:

- `kanban.board.configure`
- `kanban.card_type.view`
- `kanban.card_type.manage`
- `kanban.context.view`
- `kanban.context.manage`
- `kanban.template.view`
- `kanban.template.manage`
- `kanban.tv.configure`
- `kanban.field.manage`

Tambem vale revisar se `kanban.board.manage_permissions` deve permitir alterar permissao por board ou apenas preparar a tela.

## 14. Analise de metadata JSONB

Respostas diretas:

1. `KanbanBoard.metadata` suporta armazenar terminologia, campos, TV/Foco e visual? Sim, tecnicamente suporta.
2. `KanbanCard.metadata` suporta `customFields`? Sim, tecnicamente suporta.
3. O backend valida metadata? Nao. Aceita `dict[str, Any]`.
4. Existe limite de tamanho? Nao foi encontrado limite aplicacional.
5. Existe endpoint para editar metadata do board? Sim, indiretamente via `PATCH /api/kanban/boards/{board_id}`.
6. Existe endpoint para editar metadata do card? Sim, indiretamente via `PATCH /api/kanban/cards/{card_id}`.
7. Existe activity/audit para mudanca de configuracao? Parcialmente. Board/card update gera log generico, mas nao evento/audit especifico de config.

Estrutura sugerida para primeira fase:

```json
{
  "configVersion": 1,
  "terminology": {
    "itemSingular": "Tarefa",
    "itemPlural": "Tarefas",
    "newItemLabel": "Nova tarefa",
    "editItemLabel": "Editar tarefa",
    "boardTitle": "Projetos"
  },
  "visual": {
    "accentColor": "#38d3ee",
    "icon": "KanbanSquare"
  },
  "features": {
    "checklist": true,
    "comments": true,
    "attachments": true,
    "activity": true
  },
  "card": {
    "fields": [
      {
        "key": "cliente",
        "label": "Cliente",
        "type": "text",
        "required": false,
        "showInCard": true,
        "showInDrawer": true,
        "showInTv": true,
        "order": 10
      }
    ]
  },
  "tv": {
    "defaultMode": "kanban",
    "titleField": "title",
    "subtitleFields": ["cliente", "projeto"],
    "progressField": "progress"
  }
}
```

Card metadata sugerido:

```json
{
  "customFields": {
    "cliente": "Cliente A",
    "valor": 1200
  },
  "tags": ["urgente"]
}
```

Conclusao: JSONB e suficiente para a Fase 1, desde que a aplicacao valide schema, normalize defaults e nao trate metadata como um saco livre.

## 15. Analise de KanbanCardType

`KanbanCardType` esta subutilizado. Ele existe no banco, nos schemas e parcialmente no repository, mas nao ha endpoints nem UI. O `card_type_id` ja existe em `KanbanCard`, mas o service nao demonstrou validacao suficiente para garantir que o tipo pertence ao mesmo board.

Vale usar `KanbanCardType` como schema de card, mas com cuidado:

- Fase 1 pode usar `KanbanBoard.metadata.config.card.fields` como fonte principal simples.
- Fase 1.5/Fase 2 deve expor `KanbanCardType` para permitir multiplos tipos de card dentro do mesmo quadro.
- O campo Pydantic `schema` deve ser revisado porque gera warning. Preferir `schema_json` internamente e `field_schema` ou alias controlado na API.
- Tipos devem ser opcionais para nao quebrar cards existentes.

## 16. Analise de contextos hardcoded

Hoje os contextos estao fixos no frontend:

- Quadros
- Producao
- Projetos
- TI / Operacional
- Personalizados

Os filtros tambem estao fixos por `board_type` e `module_context`. Isso atende o Hub atual, mas nao permite que administrador crie Compras, Comercial, Manutencao ou outros contextos sem codigo.

Para primeira fase, nao e obrigatorio remover esse hardcode. Para a Fase 2, criar um modelo de contexto configuravel, inicialmente em metadata/template ou endpoint simples, mantendo os contextos atuais como fallback.

## 17. Analise de templates

Templates atuais:

- Presets de colunas hardcoded no frontend.
- Templates de checklist existem para Producao, mas sao dominio de Producao.
- Nao ha templates genericos de quadro/card/campo no Kanban Engine.

Sugestao:

- Fase 1: manter presets hardcoded como fallback.
- Fase 2: criar templates configuraveis de board com colunas, terminologia, campos e TV/Foco.
- Futuro: se templates forem reutilizados e versionados, criar tabelas dedicadas.

## 18. Analise de TV/Foco

TV/Foco global ja existe e adapta:

- cards genericos do Kanban Engine;
- OPs de Producao via endpoint especializado.

Ainda falta:

- ler `board.metadata.config.tv`;
- permitir quais campos aparecem;
- adaptar terminologia por board;
- definir progresso por campo configurado;
- preservar Producao usando dados de `production_orders`.

A TV/Foco pode ser generalizada sem quebrar Producao se houver um adapter comum e Producao continuar com adapter proprio por tras.

## 19. Analise de Producao vs generico

Producao deve continuar com dominio proprio. `production_orders` guarda dados de OP e se vincula ao card generico. Nao e recomendado migrar OP para `KanbanCard.metadata` nesta fase.

O caminho seguro:

- Produção continua especializada em `/kanban/producao`.
- O board generico de Producao pode ter metadata de labels/visual, mas a verdade dos dados especificos permanece em `production_orders`.
- O Kanban generico ganha configuracao para Projetos, TI, Compras, Comercial, Manutencao e Personalizados.

## 20. Proposta da primeira iteracao configuravel

Escopo recomendado:

- Adicionar schema Pydantic versionado para `KanbanBoardConfig`.
- Persistir em `KanbanBoard.metadata.config`.
- Criar `GET/PATCH /api/kanban/boards/{board_id}/config` com merge controlado.
- Adicionar permissao `kanban.board.configure`.
- Validar `KanbanCard.metadata.customFields` em create/update quando houver config.
- Adaptar `CardFormDialog` para campos customizados simples: text, textarea, number, date, select, boolean.
- Adaptar `CardDetailDrawer` e card visual para exibir campos configurados.
- Adaptar TV/Foco para ler config quando existir.
- Manter fallback generico quando config nao existir.

Fora da Fase 1:

- Contextos totalmente dinamicos.
- Templates editaveis completos.
- Permissoes por campo.
- Relatorios/filtros avancados por custom fields.
- Tabelas dedicadas para campos.

## 21. Proposta de fases seguintes

Resumo:

- Fase 1: metadata versionada por board, terminologia, campos customizados simples, form e drawer dinamicos.
- Fase 2: contextos do Hub e templates editaveis.
- Fase 3: CRUD avancado, permissoes por quadro, audit/activity de configuracao mais completa.
- Fase 4: TV/Foco configuravel, E2E completo e polimento visual.

O detalhamento operacional esta em `PLANO_IMPLEMENTACAO_KANBAN_CONFIGURAVEL.md`.

## 22. Riscos

Altos:

- Metadata livre pode corromper configuracao sem validacao.
- Atualizacao atual substitui metadata inteira e pode sobrescrever campos de outro fluxo.
- `card_type_id` sem validacao por board pode permitir inconsistencia.
- Mexer em form/drawer genericos pode quebrar todos os quadros.

Medios:

- Contextos hardcoded limitam expansao sem codigo.
- TV/Foco pode perder informacao se adapter nao respeitar Producao.
- Board permissions existem, mas se forem ativadas sem cuidado podem bloquear usuarios.
- Textos com encoding quebrado prejudicam UX e E2E por locators.
- Smoke/E2E dependem de frontend/backend ativos ou runtime config correto.

Baixos:

- Criar endpoints novos sem alterar fluxos existentes e baixo risco.
- Guardar config em metadata e backward compatible se houver defaults.

## 23. Recomendacao final

Implementar primeiro com metadata JSONB, mas de forma disciplinada:

- schema versionado;
- validação backend;
- defaults centralizados;
- merge controlado;
- evento `kanban.board.config.updated`;
- audit log especifico;
- testes de metadata e permissao;
- fallback visual para boards sem config.

Nao criar tabelas dedicadas na Fase 1. Criar tabelas depois somente para contextos/templates reutilizaveis, consultas avancadas, relatorios ou permissoes granulares que justifiquem modelagem relacional.

`KanbanCardType` deve ser usado, mas nao como primeiro bloqueio. A primeira fase pode funcionar com `KanbanBoard.metadata.config.card.fields`; depois `KanbanCardType` entra para multiplos tipos de card por quadro.

## 24. Comandos executados

- `npm run backend:test`: passou, 25 testes.
- `npm run build --workspace=apps/web`: passou.
- `npm run lint`: passou.
- `npm run typecheck`: passou.
- `npm run smoke:api`: falhou porque o runtime config atual apontou para `http://localhost:8003` e nao havia backend respondendo.
- `npm run e2e -- --project=chromium`: falhou porque nao havia frontend ativo em porta valida nem `E2E_BASE_URL` resolvido.

Observacoes de validacao:

- Os testes backend exibem warnings de Pydantic v2 por `class Config`.
- Os testes backend exibem warnings do campo `schema` em `CardTypeCreate`, `CardTypeUpdate` e `CardTypeRead`.
- As falhas de smoke/E2E sao de ambiente ativo, nao comprovam 404 funcional nas rotas.

