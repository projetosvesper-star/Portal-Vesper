# Modulos

Os modulos sao registrados no banco em `portal_modules` e exibidos por permissao.

Campos principais:

- `key`
- `name`
- `description`
- `route`
- `icon`
- `enabled`
- `order_index`
- `version`

## Como adicionar modulo

1. Criar permissao `novo_modulo.view`.
2. Criar registro em `portal_modules`.
3. Associar permissao em `module_permissions`.
4. Adicionar permissao aos perfis necessarios.
5. Criar router no backend protegido por permissao.
6. Criar tela no frontend e rota correspondente.
7. Adicionar testes de permissao e acesso.

Modulos finais nao foram implementados nesta etapa de proposito.

Antes de implementar o Kanban Engine, mantenha o primeiro modulo dentro deste padrao: router proprio, permissoes `kanban.*`, migrations separadas, testes de acesso e tela isolada em `apps/web/src/modules/kanban`.

## Kanban Engine (primeiro modulo real)

O **Kanban Engine** e o primeiro modulo com implementacao real no backend, projetado para ser **generico** e reutilizado no futuro por:

- Kanban Producao;
- Kanban Projetos;
- Kanban Operacional;
- HelpDesk (opcional);
- Quadros personalizados.

Documentacao completa: `docs/kanban-engine.md`.

### Kanban configuravel

A Fase 1 do Kanban configuravel nao cria novos modulos. Ela adiciona configuracao por quadro dentro do proprio modulo Kanban:

- `metadata.config` no board para terminologia, visual, features, campos customizados e TV/Foco;
- `metadata.customFields` no card para valores dos campos dinamicos;
- permissao `kanban.board.configure` para alterar configuracao;
- validacao backend dos campos customizados.

Isso permite que Projetos, TI, Compras, Comercial, Manutencao, Operacional e Personalizados tenham terminologia e campos proprios sem item separado na sidebar e sem tabelas novas nesta primeira fase.

### Hub Kanban

A sidebar deve continuar exibindo apenas um item: `Kanban`.

Dentro de `/kanban`, o usuario acessa os contextos:

- Quadros;
- Producao;
- Projetos;
- TI / Operacional;
- Personalizados.
- TV/Foco.

Projetos, TI e Operacional nao sao modulos separados nesta fase. Eles sao quadros genericos do Kanban Engine, filtrados por `board_type` e `module_context`.

A TV/Foco tambem e interna ao Kanban (`/kanban/tv`) e nao deve aparecer como item separado na sidebar. Ela usa o mesmo mecanismo de permissoes: quadros genericos dependem de `kanban.view`/`kanban.board.view`, e Producao depende de `kanban_producao.view`.

### Contextos e templates configuraveis

A Fase 2 do Kanban configuravel tambem nao cria modulos novos. O Hub Kanban passa a carregar contextos e templates pela API:

- `kanban.context.view`
- `kanban.context.manage`
- `kanban.template.view`
- `kanban.template.manage`

Contextos controlam o que aparece dentro de `/kanban`: Quadros, Producao, Projetos, TI / Operacional, Personalizados, TV/Foco e contextos customizados. Contextos de sistema podem ser ocultados, mas nao removidos fisicamente.

Templates controlam a criacao de quadros: tipo, contexto, colunas iniciais e `metadata.config`. Projetos, TI, Compras, Comercial, Manutencao e fluxos personalizados devem nascer como boards do Kanban Engine, nao como modulos separados.

## Kanban Producao

O **Kanban Producao** e um modulo especifico sobre o Kanban Engine. Ele registra o modulo `kanban_producao`, rota `/kanban/producao`, icone `Factory` e permissoes `kanban_producao.*`.

Ele nao adiciona campos industriais diretamente em `kanban_cards`; a entidade especifica e `production_orders`, ligada ao card por `production_orders.card_id`.

Documentacao completa: `docs/kanban-producao.md`.
