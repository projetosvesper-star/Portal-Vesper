# Implementacao Kanban Configuravel - Fase 1

## 1. Resumo executivo

A Fase 1 do Kanban Configuravel foi implementada usando os campos JSONB existentes:

- `kanban_boards.metadata.config` para configuracao versionada do quadro;
- `kanban_cards.metadata.customFields` para valores dinamicos dos cards.

Nao foram criadas novas tabelas. A configuracao agora tem schema Pydantic v2, defaults, validacao backend, merge controlado, permissao propria, endpoints dedicados, UI de configuracao, formulario dinamico, drawer dinamico, exibicao compacta no card e leitura pela TV/Foco global.

## 2. O que foi implementado

- Configuracao versionada com `configVersion=1`.
- Contrato de terminologia, visual, features, campos customizados e TV/Foco.
- Endpoints:
  - `GET /api/kanban/boards/{board_id}/config`;
  - `PATCH /api/kanban/boards/{board_id}/config`;
  - `POST /api/kanban/boards/{board_id}/config/validate`.
- Permissao `kanban.board.configure`.
- Merge controlado em `metadata.config`, preservando outras chaves de metadata.
- Validacao de `metadata.customFields` ao criar/editar card.
- Activity log, audit log e evento `kanban.board.config.updated`.
- Drawer `Configuracoes do quadro` em `/kanban/boards/:boardId`.
- `CardFormDialog` com campos dinamicos.
- `CardDetailDrawer` com secao de campos customizados.
- Card compacto com ate tres campos `showInCard=true`.
- TV/Foco global lendo `board.config.tv` e campos `showInTv=true`.
- Kanban Producao lendo terminologia visual do board sem mover dados de `production_orders`.

## 3. O que nao foi implementado de proposito

- Contextos do Hub 100% dinamicos.
- Templates editaveis completos.
- Permissoes por campo.
- Permissoes refinadas por board via UI avancada.
- Tabelas dedicadas para campos/templates/contextos.
- Relatorios e filtros avancados por custom fields.
- Automacoes.
- Risco, alertas, OCR, Telegram e status automatico complexo.
- Novo modulo fora do Kanban.

## 4. Arquitetura usada

A configuracao vive no board:

```json
{
  "metadata": {
    "config": {
      "configVersion": 1,
      "terminology": {},
      "visual": {},
      "features": {},
      "card": { "fields": [] },
      "tv": {}
    }
  }
}
```

Os valores por card vivem em:

```json
{
  "metadata": {
    "customFields": {
      "cliente": "Cliente A",
      "valor": 150000
    }
  }
}
```

## 5. Validacoes backend

O backend valida:

- `configVersion` obrigatorio;
- limite de campos por board;
- limite de tamanho da configuracao;
- keys unicas;
- formato seguro de key;
- tipos permitidos;
- `select` com options;
- campos obrigatorios;
- tipos de valores em `customFields`;
- `currency` como inteiro em centavos;
- `user` como UUID e, quando possivel, usuario existente;
- campos desconhecidos em `customFields`.

## 6. Tipos de campo suportados

- `text`;
- `textarea`;
- `number`;
- `date`;
- `select`;
- `checkbox`;
- `user`;
- `currency`.

`currency` e salvo em centavos. `user` salva `user_id`, nao nome.

## 7. Producao

O Kanban Producao continua com dominio proprio em `production_orders`. A tela apenas le a terminologia visual do board de producao quando houver configuracao explicita. Se o seed local ainda nao aplicou a config de OP, a UI usa fallback seguro com `OP`, `OPs` e `Nova OP`.

## 8. Eventos

Evento criado:

- `kanban.board.config.updated`.

Destino:

- activity log do Kanban;
- audit log global;
- Redis Stream `stream:module_events`;
- WebSocket `ws:module:kanban`.

## 9. Testes criados/ajustados

Backend:

- update de config preserva metadata existente e emite activity/evento;
- custom fields sao validados contra config do board;
- `kanban.board.configure` e exigida para configurar board.

E2E:

- login Admin;
- abertura do Hub Kanban;
- criacao de board;
- configuracao de terminologia;
- criacao de campo customizado;
- criacao de card com campo customizado;
- exibicao no card;
- exibicao no drawer;
- edicao e persistencia;
- TV/Foco global;
- Kanban Producao continua abrindo;
- ausencia de `Failed to fetch` e HTTP 404 esperado.

## 10. Comandos executados

- `npm run backend:test` - passou, 28 testes.
- `npm run build --workspace=apps/web` - passou, com aviso de chunk acima de 500 kB.
- `npm run lint` - passou.
- `npm run typecheck` - passou.
- `npm run dev:portal` - passou, subiu backend em `8000` e frontend em `5174`.
- `npm run smoke:api` - passou.
- `npm run e2e -- --project=chromium` - passou, 2 testes.

## 11. Avisos encontrados

- Backend ainda exibe warnings antigos de Pydantic:
  - alguns schemas ainda usam `class Config`;
  - `CardType*` ainda possui campo publico `schema`.
- Build web exibe aviso de chunk maior que 500 kB.
- Esses pontos nao bloquearam a Fase 1, mas devem ser tratados em etapa de limpeza tecnica.

## 12. Arquivos principais alterados

- `backend/app/modules/kanban/configuration.py`
- `backend/app/modules/kanban/schemas.py`
- `backend/app/modules/kanban/service.py`
- `backend/app/modules/kanban/router.py`
- `backend/app/modules/kanban/permissions.py`
- `backend/app/modules/kanban/events.py`
- `backend/seeds/initial_seed.py`
- `backend/tests/test_kanban_engine.py`
- `apps/web/src/modules/kanban/config.ts`
- `apps/web/src/modules/kanban/types.ts`
- `apps/web/src/modules/kanban/api.ts`
- `apps/web/src/modules/kanban/hooks.ts`
- `apps/web/src/modules/kanban/components/KanbanBoardConfigDrawer.tsx`
- `apps/web/src/modules/kanban/components/CardFormDialog.tsx`
- `apps/web/src/modules/kanban/components/CardDetailDrawer.tsx`
- `apps/web/src/modules/kanban/components/KanbanCard.tsx`
- `apps/web/src/modules/kanban/KanbanEnginePage.tsx`
- `apps/web/src/modules/kanban/KanbanTvPage.tsx`
- `apps/web/src/modules/kanban/KanbanTvAdapter.ts`
- `apps/web/src/modules/production/KanbanProducaoPage.tsx`
- `e2e/playwright/tests/kanban_geral.spec.ts`
- `README.md`
- `docs/kanban-engine.md`
- `docs/modulos.md`
- `docs/arquitetura.md`

## 13. Riscos pendentes

- JSONB e suficiente para Fase 1, mas filtros/relatorios avancados por custom fields podem exigir tabelas dedicadas no futuro.
- Remover campo customizado oculta a UI do campo, mas nao apaga valores existentes em cards nesta fase.
- `KanbanCardType` continua subutilizado e deve ser revisado antes de virar schema de card.
- E2E usa base real de desenvolvimento e cria boards/cards de teste; pode ser necessario fluxo de limpeza futura.

## 14. Proximo passo recomendado

Avancar para a Fase 2 somente depois de limpar os warnings de Pydantic e decidir como o administrador vai gerenciar contextos/templates:

- Hub com contextos configuraveis;
- presets/templates editaveis;
- UI de administracao de configuracao;
- politica de lifecycle para campos removidos.
