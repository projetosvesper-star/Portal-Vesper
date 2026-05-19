# Kanban Producao Simples

## Visao Geral

O Kanban Producao simples e a primeira camada especifica de producao sobre o Kanban Engine generico. Ele cria Ordens de Producao (OPs) com checklist editavel, templates de checklist e uma visao TV/Foco simples.

Esta etapa nao implementa risco, alertas, OCR, Telegram, importacao real, status inteligente, dashboard avancado ou TV final.

## Kanban Engine vs Kanban Producao

O Kanban Engine continua generico:

- `kanban_boards`
- `kanban_columns`
- `kanban_cards`
- comentarios, anexos, checklist generico e activity log generico

O Kanban Producao guarda dados especificos fora do card:

- `production_orders.card_id -> kanban_cards.id`
- `production_checklist_templates`
- `production_checklist_template_items`
- `production_order_checklist_items`
- `production_order_activity_logs`

Campos de OP, cliente, projeto, modelo, setor e checklist de producao nao foram adicionados em `kanban_cards`.

## Implementado Agora

- Modulo backend `production`.
- Migration `0003_kanban_producao_simple`.
- Tabelas de OP, templates, checklist individual e historico.
- Permissoes `kanban_producao.*`.
- Seed idempotente com modulo, permissoes, board, colunas, templates e OPs ficticias.
- Endpoints protegidos em `/api/kanban/producao`.
- Eventos em Redis Stream e Pub/Sub por modulo.
- UI minima em `/kanban/producao`.
- Testes backend unitarios e de protecao de rota.

## Fora Desta Etapa

- Score de risco.
- Alertas.
- Status automatico complexo.
- OCR/Telegram.
- Importacao real de sistema antigo.
- Checklist fixo obrigatorio.
- TV/Foco final full screen.
- UI operacional final com drag-and-drop especifico de producao.

## Tabelas

### `production_orders`

OP especifica ligada a um card generico por `card_id`. Guarda `numero_op`, cliente, projeto, modelo, quantidade, setor, datas, prioridade, status, percentual de checklist e metadados.

### `production_checklist_templates`

Templates editaveis de checklist. O seed cria:

- Checklist Producao Basico
- Checklist Projeto Basico

### `production_checklist_template_items`

Itens dos templates, ordenados por `order_index`.

### `production_order_checklist_items`

Checklist real de cada OP, copiado do template na criacao. Depois da copia, editar a OP nao altera o template.

### `production_order_activity_logs`

Historico especifico da OP.

## Checklist Editavel

Ao criar uma OP:

1. Usa o template informado por `checklist_template_id`.
2. Se nao informado, usa o template default ativo de producao.
3. Copia os itens para `production_order_checklist_items`.
4. Calcula `percentual_checklist`.

Depois da criacao, a OP permite adicionar, editar, excluir, marcar/desmarcar e reordenar itens sem alterar o template original.

## Status Simples

Status suportados:

- `aberta`
- `em_andamento`
- `aguardando`
- `pronta`
- `arquivada`

O status e manual nesta fase. Arquivar muda para `arquivada`; restaurar volta para o status anterior quando disponivel ou `aberta`.

## TV/Foco Simples

Endpoint:

```text
GET /api/kanban/producao/tv
```

Parametros:

- `mode=list|kanban`
- `limit`
- `include_done`

Retorna OPs resumidas ordenadas por prioridade e data de entrega. A UI atual mostra apenas um preview simples.

## Endpoints

OPs:

- `GET /api/kanban/producao/ops`
- `POST /api/kanban/producao/ops`
- `GET /api/kanban/producao/ops/{op_id}`
- `PATCH /api/kanban/producao/ops/{op_id}`
- `POST /api/kanban/producao/ops/{op_id}/archive`
- `POST /api/kanban/producao/ops/{op_id}/restore`
- `DELETE /api/kanban/producao/ops/{op_id}`

Checklist:

- `GET /api/kanban/producao/ops/{op_id}/checklist`
- `POST /api/kanban/producao/ops/{op_id}/checklist`
- `PATCH /api/kanban/producao/checklist/{item_id}`
- `DELETE /api/kanban/producao/checklist/{item_id}`
- `POST /api/kanban/producao/ops/{op_id}/checklist/reorder`

Templates:

- `GET /api/kanban/producao/checklist-templates`
- `POST /api/kanban/producao/checklist-templates`
- `GET /api/kanban/producao/checklist-templates/{template_id}`
- `PATCH /api/kanban/producao/checklist-templates/{template_id}`
- `DELETE /api/kanban/producao/checklist-templates/{template_id}`
- `POST /api/kanban/producao/checklist-templates/{template_id}/items`
- `PATCH /api/kanban/producao/checklist-template-items/{item_id}`
- `DELETE /api/kanban/producao/checklist-template-items/{item_id}`

Outros:

- `GET /api/kanban/producao/dashboard`
- `GET /api/kanban/producao/tv`
- `GET /api/kanban/producao/ops/{op_id}/activity`

## Permissoes

Chaves:

- `kanban_producao.view`
- `kanban_producao.op.view`
- `kanban_producao.op.create`
- `kanban_producao.op.edit`
- `kanban_producao.op.archive`
- `kanban_producao.op.restore`
- `kanban_producao.op.delete`
- `kanban_producao.op.move`
- `kanban_producao.checklist.view`
- `kanban_producao.checklist.edit`
- `kanban_producao.templates.view`
- `kanban_producao.templates.manage`
- `kanban_producao.tv.view`
- `kanban_producao.history.view`
- `kanban_producao.admin`

Administrador recebe todas. Gestor, Producao e Usuario recebem subconjuntos definidos no seed.

## Eventos

Canal:

- `ws:module:kanban_producao`

Stream:

- `stream:module_events` com `module_key=kanban_producao`

Eventos:

- `kanban_producao.op.created`
- `kanban_producao.op.updated`
- `kanban_producao.op.archived`
- `kanban_producao.op.restored`
- `kanban_producao.op.deleted`
- `kanban_producao.checklist.item.created`
- `kanban_producao.checklist.item.updated`
- `kanban_producao.checklist.item.deleted`
- `kanban_producao.checklist.reordered`
- `kanban_producao.template.created`
- `kanban_producao.template.updated`
- `kanban_producao.template.deleted`
- `kanban_producao.tv.updated`

Quando a acao muda o card generico, tambem e publicado evento em `ws:module:kanban`.

## Relacao Com O Kanban Engine

Ao criar OP:

1. Garante board `kanban_producao`.
2. Garante colunas basicas.
3. Cria card generico em `kanban_cards`.
4. Cria `production_orders`.
5. Copia checklist do template.
6. Atualiza metadados do card.
7. Cria activity log especifico e audit log global.
8. Publica evento.

## Proximos Passos

- Validar UI no navegador apos seed.
- Evoluir UI operacional sem adicionar regras avancadas prematuramente.
- Definir modelo de risco e alertas em fase separada.
- Definir TV/Foco final full screen em fase separada.
- Planejar importacao real dos sistemas antigos em fase propria.
