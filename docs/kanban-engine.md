# Kanban Engine (Backend)

O **Kanban Engine** e o primeiro modulo real do Portal Vesper. Ele e um motor **generico** de quadros Kanban para evitar duplicacao entre:

- Kanban Producao
- Kanban Projetos
- Kanban Operacional
- HelpDesk (se necessario)
- Quadros customizados

Nesta etapa foi implementado **somente backend** (dominio, banco, permissoes, eventos, auditoria e testes). A UI completa (incluindo drag-and-drop) fica para a proxima etapa.

## Objetivos desta etapa

- Criar tabelas e modelos do motor generico (boards/columns/cards/types, checklist, comentarios, anexos, activity log e permissoes por quadro).
- Expor endpoints basicos de CRUD e operacoes de dominio (ex.: mover card).
- Publicar eventos via Redis Streams e WebSocket.
- Registrar activity logs por card/quadro e auditoria global para acoes criticas.

## Modelo de dados (tabelas)

Tabelas criadas (PostgreSQL):

- `kanban_boards`
- `kanban_columns`
- `kanban_card_types`
- `kanban_cards`
- `kanban_card_assignees`
- `kanban_checklist_items`
- `kanban_comments`
- `kanban_attachments`
- `kanban_activity_logs`
- `kanban_board_permissions`

Migracao: `backend/alembic/versions/0002_kanban_engine.py`.

## Permissoes

As permissoes do modulo ficam em `backend/app/modules/kanban/permissions.py`.

Resumo:

- `kanban.view`
- `kanban.board.*`
- `kanban.column.*`
- `kanban.card.*`
- `kanban.activity.view`
- `kanban.audit.view`
- `kanban.admin`

Observacao: o seed inicial associa as permissoes conforme os perfis (Administrador, Gestor, Producao, Comercial, Compras, TI, Usuario).

## Endpoints (FastAPI)

Prefixo: `/api/kanban`

Boards:

- `GET /boards`
- `POST /boards`
- `GET /boards/{board_id}`
- `PATCH /boards/{board_id}`
- `DELETE /boards/{board_id}` (arquiva)
- `GET /boards/{board_id}/permissions`
- `POST /boards/{board_id}/permissions`
- `DELETE /boards/{board_id}/permissions/{permission_id}`

Columns:

- `GET /boards/{board_id}/columns`
- `POST /boards/{board_id}/columns`
- `PATCH /columns/{column_id}`
- `DELETE /columns/{column_id}?force=false`
- `POST /boards/{board_id}/columns/reorder`

Cards:

- `GET /boards/{board_id}/cards`
- `POST /cards`
- `GET /cards/{card_id}`
- `PATCH /cards/{card_id}`
- `DELETE /cards/{card_id}` (soft delete)
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

## Eventos (Redis / WebSocket)

Eventos sao publicados com payload padrao:

```json
{
  "type": "kanban.card.moved",
  "payload": { "board_id": "...", "card_id": "...", "from_column_id": "...", "to_column_id": "...", "old_order_index": 1, "new_order_index": 2, "actor_user_id": "..." },
  "timestamp": "..."
}
```

Destino:

- Redis Stream: `stream:module_events` (campo `module_key=kanban`)
- Redis Pub/Sub (WebSocket): `ws:module:kanban`

Lista completa em `docs/websocket-events.md`.

Evento adicional da Fase 1 configuravel:

- `kanban.board.config.updated`: publicado ao alterar `metadata.config`, com activity log do Kanban e audit log global.

## Regras de dominio (minimo)

- Card nao pode ser criado em coluna de outro quadro.
- Mover card valida coluna de destino e atualiza `column_id` e `order_index`.
- Comentario: editar/excluir apenas autor ou admin.
- Checklist: ao marcar como feito registra `done_by` e `done_at`.
- Anexos: exige `file_id` existente em `files` e impede duplicacao por card.
- Soft delete de card via `deleted_at`.

## Diferenca entre Kanban Engine e Kanban Producao especifico

O **Kanban Engine** possui apenas campos genericos e metadados (`metadata` JSONB).

Campos industriais, regras de OP, integracao com ordens, estoques, etc. devem ficar em tabelas futuras (ex.: `production_orders`) e se relacionar ao Kanban via `card_id`/`code`/relacionamentos, sem poluir `kanban_cards`.

## UI do Kanban Engine

Nesta etapa a UI do **Kanban Engine** foi implementada no Portal Vesper consumindo os endpoints reais do backend.

### Telas / rotas

- `/kanban`: Hub Kanban. Lista quadros, permite criar quadros genericos e alternar contextos.
- `/kanban/boards/:boardId`: quadro generico usando o Kanban Engine.
- `/kanban/producao`: contexto especializado de Producao, sem item proprio na sidebar.

Regra de abertura:
- a sidebar mostra apenas `Kanban`;
- Producao, Projetos, TI/Operacional e Personalizados ficam dentro do Hub `/kanban`;
- Projetos, TI e Operacional usam quadros genericos inicialmente;
- especializacoes futuras devem continuar usando o Engine como base e adicionar tabelas especificas fora de `kanban_cards`.

### Componentes principais

- `KanbanEnginePage`: pagina principal (header, KPIs, toolbar, board, drawer e dialog).
- `BoardSelector`: seletor de board.
- `BoardToolbar`: filtro de busca + toggle de arquivados + refresh.
- `KanbanBoard` / `KanbanColumn` / `KanbanCard`: renderizacao do board com colunas horizontais e cards por coluna.
- `CardDetailDrawer`: drawer a direita com detalhes e abas (checklist, comentarios, atividade).
- `CardFormDialog`: modal para criar/editar card.
- `ChecklistPanel`, `CommentsPanel`, `ActivityPanel`.
- `KanbanHubPage`: central de quadros e contextos.
- `KanbanBoardsOverview`: lista de quadros com filtro por tipo e contagem de cards.
- `KanbanBoardCreateDialog`: cria quadro e colunas iniciais pelo API do Kanban Engine.
- `KanbanTvPage`: TV/Foco global para qualquer quadro permitido.
- `KanbanTvAdapter`: adapta cards genericos e OPs de Producao para um formato visual comum.

### Padrao visual do Kanban

As telas Kanban usam componentes escuros compartilhados em `apps/web/src/shared/ui`:

- `PortalSelect` no lugar de select nativo;
- `PageHeader`, `SectionCard`, `MetricCard` e `PortalBadge`;
- `ErrorState`, `EmptyState`, `LoadingSkeleton`;
- `PortalDialog`, `PortalDrawer` e `ConfirmDialog`.

O objetivo e manter Hub, quadro generico, Producao e TV/Foco com o mesmo padrao visual do Portal Vesper.

## Kanban configuravel - Fase 1

A primeira camada configuravel usa os campos JSONB ja existentes:

- configuracao do quadro: `kanban_boards.metadata.config`;
- valores customizados do card: `kanban_cards.metadata.customFields`.

Nao foram criadas tabelas novas nesta fase. A configuracao e versionada por `configVersion=1`, validada no backend por schemas Pydantic v2 e atualizada por merge controlado para preservar outras chaves de `metadata`.

### Contrato de configuracao

O endpoint `GET /api/kanban/boards/{board_id}/config` retorna uma configuracao normalizada com:

- `terminology`: singular, plural, texto do botao principal, labels de titulo/descricao e texto de vazio;
- `visual`: cor, icone e densidade visual;
- `features`: checklist, comentarios, anexos e atividade;
- `card.fields`: campos customizados simples;
- `tv`: modo padrao, campos exibidos e densidade de texto.

O endpoint `PATCH /api/kanban/boards/{board_id}/config` salva a configuracao validada em `metadata.config`. O endpoint `POST /api/kanban/boards/{board_id}/config/validate` valida sem persistir.

Permissao exigida para alterar/validar configuracao: `kanban.board.configure`.

### Campos customizados

Tipos suportados na Fase 1:

- `text`;
- `textarea`;
- `number`;
- `date`;
- `select`;
- `checkbox`;
- `user`;
- `currency`.

Regras principais:

- keys precisam usar letras minusculas, numeros e underline;
- keys duplicadas sao bloqueadas;
- `select` exige `options`;
- `currency` e salvo em centavos como inteiro;
- `user` salva `user_id`;
- campos desconhecidos em `metadata.customFields` sao rejeitados;
- campos obrigatorios sao validados no backend e no frontend.

### UI dinamica

Em `/kanban/boards/:boardId`, o botao `Configuracoes do quadro` abre um drawer com abas:

- Geral;
- Terminologia;
- Campos;
- TV/Foco.

O `CardFormDialog` renderiza campos dinamicos conforme `board.config.card.fields`. O `CardDetailDrawer` mostra a secao de campos do card. O card compacto exibe os primeiros campos com `showInCard=true`. A TV/Foco global le `showInTv` e as preferencias de `board.config.tv`.

Producao continua usando `production_orders`, mas pode ler a terminologia visual do board de producao para labels e botoes sem mover dados para `kanban_cards.metadata`.

## Kanban configuravel - Fase 2

A Fase 2 adiciona configuracao persistente do Hub Kanban usando um board interno de sistema:

- key: `__kanban_hub_config__`
- metadata: `hubConfig.contexts` e `hubConfig.templates`

Endpoints de contexto:

- `GET /api/kanban/contexts`
- `POST /api/kanban/contexts`
- `PATCH /api/kanban/contexts/{context_key}`
- `DELETE /api/kanban/contexts/{context_key}`
- `POST /api/kanban/contexts/restore-defaults`
- `POST /api/kanban/contexts/reorder`

Endpoints de template:

- `GET /api/kanban/templates`
- `POST /api/kanban/templates`
- `GET /api/kanban/templates/{template_key}`
- `PATCH /api/kanban/templates/{template_key}`
- `DELETE /api/kanban/templates/{template_key}`
- `POST /api/kanban/templates/{template_key}/duplicate`
- `POST /api/kanban/templates/{template_key}/restore`

Criacao por template:

- `POST /api/kanban/boards/from-template`

O board criado por template recebe `board_type`, `module_context`, `metadata.config` e colunas iniciais. A UI invalida boards, contextos, templates e dados de TV/Foco apos mutacoes.

### TV/Foco global

Rota interna: `/kanban/tv`.

A TV/Foco global permite escolher qualquer quadro visivel ao usuario e alternar entre:

- Lista;
- Kanban.

Para quadros genericos, a tela consulta `/api/kanban/boards`, `/api/kanban/boards/{board_id}/columns` e `/api/kanban/boards/{board_id}/cards`.

Para Producao, quando o board selecionado tem `board_type=production` ou `module_context=producao`, a tela usa `/api/kanban/producao/tv` e adapta os dados de OP para o mesmo modelo de exibicao.

### Drag-and-drop

- Implementado com **dnd kit**.
- Arrastar cards entre colunas chama `POST /api/kanban/cards/{card_id}/move` com:
  - `to_column_id`
  - `new_order_index`
- Respeita permissao `kanban.card.move` (arraste desabilitado sem permissao).
- UI faz update otimista simples e refetch em seguida para consistencia.

### WebSocket (eventos)

- Reutiliza o WebSocket autenticado do Portal.
- Ao receber eventos `kanban.*`, a UI invalida/refaz queries relacionadas (boards/columns/cards e, quando aplicavel, card/checklist/comments/activity).

### Permissoes na UI

A UI oculta/desabilita acoes conforme as permissoes do usuario (ex.: `kanban.card.create`, `kanban.card.edit`, `kanban.card.archive`, `kanban.card.restore`, `kanban.card.checklist`, `kanban.card.comment`, `kanban.activity.view`).

## Polimento da UI do Kanban Engine

Esta etapa fortalece o Kanban Engine **generico** (sem regras de Producao/Projetos), com foco em UX, ordenacao e integracoes:

- **Reordenacao precisa dentro da mesma coluna**: drag-and-drop agora permite reorganizar cards na coluna atual, chamando o mesmo endpoint `POST /api/kanban/cards/{card_id}/move` com `to_column_id` + `new_order_index`.
- **Normalizacao de order_index no backend**: ao mover/reordenar cards, a ordem da coluna (ou colunas afetadas) e normalizada para evitar buracos/duplicados.
- **UserPicker (responsavel)**: seleção de responsavel com usuarios reais via endpoints seguros de lookup/search (`/api/users/search` e `/api/users/lookup`).
- **AttachmentsPanel**: upload via `/api/files/upload` (MinIO/StorageService) e vinculacao ao card via `/api/kanban/cards/{card_id}/attachments`.
- **Feedback visual**: skeleton de carregamento do board e toasts (sucesso/erro) nas principais acoes.
- **WebSocket**: eventos `kanban.*` continuam invalidando queries, com debounce para evitar refetch excessivo.

## Proximos passos

- Refinar reordenacao dentro da mesma coluna (melhor indicador de drop e comportamento em listas longas).
- Regras mais fortes de ordenacao/reorder (shifts e consistencia de order_index).
- Enforcar permissoes por quadro (`kanban_board_permissions`) e sharing.
- Especializacoes (Producao, Projetos, Operacional) com tabelas dedicadas.

## Diagnostico anti-404

Antes de validar UI Kanban, confirme que o backend ativo e o codigo atual:

```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/openapi.json
```

O OpenAPI ativo deve listar:

- `/api/kanban/boards`
- `/api/kanban/boards/from-template`
- `/api/kanban/contexts`
- `/api/kanban/templates`
- `/api/kanban/boards/{board_id}`
- `/api/kanban/boards/{board_id}/columns`
- `/api/kanban/boards/{board_id}/cards`
- `/api/kanban/cards`
- `/api/kanban/producao/ops`
- `/api/kanban/producao/dashboard`
- `/api/kanban/producao/tv`

Se alguma rota existir no codigo, mas nao aparecer no OpenAPI ativo, o backend rodando esta antigo ou na porta errada. Reinicie `npm run backend:dev`. Se a porta 8000 estiver presa, suba temporariamente em outra porta e ajuste `VITE_API_BASE_URL` no frontend de desenvolvimento.

O frontend nao deve depender de `localhost:8000` hardcoded. Use `VITE_API_BASE_URL` para apontar para o backend ativo validado no OpenAPI.
