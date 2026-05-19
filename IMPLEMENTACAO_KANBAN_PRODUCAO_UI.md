# Implementacao Kanban Producao UI

## Resumo executivo

Foi aplicado o polimento final da UI do Kanban Producao simples, mantendo o escopo restrito ao modulo ja existente. Nao foram implementados risco, alertas, OCR, Telegram, status automatico complexo ou outros modulos.

A etapa focou em responsividade, legibilidade, drawer, checklist, preview TV/Foco e invalidacao correta de queries apos mutacoes e eventos WebSocket.

## O que foi polido

- Pagina `/kanban/producao` com layout responsivo e sem overflow horizontal intencional.
- KPIs reorganizados para 2 colunas em telas pequenas, 3 em medias e 6 em desktop.
- Lista de OPs com truncamento, quebras controladas e area clicavel estavel.
- Formulario de Nova OP responsivo, com mensagens inline de erro e botoes adaptados para mobile.
- Painel de Checklist rapido com botoes por icone, estados disabled e confirmacao antes de remover.
- Preview TV/Foco com modo lista e kanban mais legiveis para telas grandes.
- Hub `/kanban` ajustado para mostrar Producao como contexto interno, mantendo Kanban Producao fora da sidebar.

## ProductionOrderDrawer

- Drawer passou a usar overlay, largura responsiva e rolagem interna.
- Tabs `Resumo`, `Checklist` e `Atividade` ficaram mais claras e estaveis.
- Botoes `Editar`, `Salvar`, `Cancelar`, `Arquivar`, `Restaurar` e `Fechar` foram revisados.
- Erros de salvar OP e checklist aparecem inline.
- O drawer nao fecha quando salvar falha.
- Arquivar/restaurar nao fecha automaticamente; a tela reflete o estado atualizado apos invalidacao.
- Campos de edicao receberam labels acessiveis para facilitar testes com Playwright.

## Checklist

- Botoes de subir/descer ficam desabilitados no primeiro e ultimo item.
- Edicao inline foi isolada dentro do card do item para nao quebrar o layout.
- Remover item exige confirmacao do usuario.
- Reordenacao agora envia `order_index` normalizado por posicao, preservando a ordem apos refresh.
- Apos adicionar, editar, marcar, remover ou reordenar, a UI invalida checklist, OPs, dashboard, detalhe, atividade e TV.

## TV/Foco

- Modo lista ganhou hierarquia visual melhor para numero da OP, cliente/projeto/modelo, status, prioridade, entrega e percentual.
- Modo kanban ganhou contadores por coluna e cards compactos.
- Nao foi implementado fullscreen avancado nesta etapa.

## WebSocket e TanStack Query

- Foi mantida uma unica inscricao via `PortalWebSocketProvider`.
- Eventos `kanban_producao.*` continuam com invalidacao debounced.
- A invalidacao agora cobre:
  - dashboard;
  - OPs;
  - templates;
  - TV/Foco;
  - detalhe da OP;
  - checklist;
  - atividade.
- Mutacoes tambem chamam `invalidateQueries` apos sucesso, garantindo que a UI reflita o estado do servidor.

## Playwright

O spec `e2e/playwright/tests/kanban_producao.spec.ts` foi atualizado com locators mais resilientes:

- `getByRole`;
- `getByLabel`;
- `getByText`;
- credenciais via variaveis `E2E_ADMIN_USERNAME` e `E2E_ADMIN_PASSWORD`, com fallback dev.

O teste E2E nao foi executado porque `@playwright/test` nao esta instalado no monorepo e nao existe script E2E no `package.json`.

Evidencia:

```text
npm ls @playwright/test --depth=0
portal-vesper@0.1.0
`-- (empty)
```

## Validacao visual no navegador

Foi aberta a rota `http://127.0.0.1:5174/kanban/producao` via Playwright MCP.

Resultado:

- A tela renderizou o novo layout.
- O frontend nao apresentou erro de build.
- As chamadas para `/api/kanban/producao/*` retornaram 404 no backend local ativo.
- Diagnostico: a instancia backend rodando em `localhost:8000` esta desatualizada, pois o OpenAPI ativo nao lista rotas `producao`.
- Correcao operacional: reiniciar o backend local com o codigo atual antes de executar o teste visual completo.

Esse ponto nao altera o codigo da UI, mas impede declarar o E2E visual como aprovado nesta execucao.

## Comandos executados

```bash
npm run backend:test
npm run build --workspace=apps/web
npm run lint
npm run typecheck
npm ls @playwright/test --depth=0
```

## Resultado dos testes

| Comando | Resultado |
| --- | --- |
| `npm run backend:test` | Passou: 25 testes |
| `npm run build --workspace=apps/web` | Passou |
| `npm run lint` | Passou |
| `npm run typecheck` | Passou |
| Playwright E2E | Pendente: dependencia/script nao configurados |

## Arquivos alterados

- `apps/web/src/modules/kanban/KanbanHubPage.tsx`
- `apps/web/src/modules/production/KanbanProducaoPage.tsx`
- `apps/web/src/modules/production/ProductionOrderDrawer.tsx`
- `apps/web/src/modules/production/api.ts`
- `apps/web/src/modules/production/queryKeys.ts`
- `e2e/playwright/tests/kanban_producao.spec.ts`
- `IMPLEMENTACAO_KANBAN_PRODUCAO_UI.md`
- `TESTE_MANUAL_KANBAN_PRODUCAO_UI.md`

## Riscos restantes

- Medio: E2E visual completo ainda depende de instalar/configurar `@playwright/test` ou adicionar um script oficial.
- Medio: o backend local ativo em `localhost:8000` estava desatualizado durante a validacao visual; reiniciar o backend antes do teste manual.
- Baixo: ainda nao houve revisao visual humana em telas muito pequenas reais, apenas ajustes responsivos e build/typecheck.

## Proximo passo recomendado

1. Reiniciar backend e frontend locais.
2. Executar o checklist manual em `TESTE_MANUAL_KANBAN_PRODUCAO_UI.md`.
3. Se desejar E2E automatizado oficial, adicionar `@playwright/test`, `playwright.config.ts` e script `npm run e2e`.
4. Depois disso, seguir para UI operacional completa do Kanban Producao, ainda sem risco/alertas/OCR/Telegram.
