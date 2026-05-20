# Teste Manual - Kanban Configuravel Fase 1

Use este checklist para validar a Fase 1 no navegador.

## 1. Ambiente

- [ ] Rodar `npm run infra:up`, se a infraestrutura ainda nao estiver ativa.
- [ ] Rodar `npm run backend:migrate`, se houver banco novo.
- [ ] Rodar `npm run backend:seed`, para garantir permissao `kanban.board.configure` e metadata de producao.
- [ ] Rodar `npm run dev:portal`.
- [ ] Confirmar no terminal qual backend e frontend foram escolhidos.
- [ ] Abrir `/api/health` no backend ativo.
- [ ] Abrir `/openapi.json` e confirmar:
  - [ ] `/api/kanban/boards/{board_id}/config`;
  - [ ] `/api/kanban/boards/{board_id}/config/validate`;
  - [ ] `/api/kanban/boards`;
  - [ ] `/api/kanban/producao/ops`;
  - [ ] `/api/kanban/producao/tv`.

## 2. Login e Hub

- [ ] Abrir o frontend informado pelo `dev:portal`.
- [ ] Login com `Admin` / `Vesper@890` em ambiente de desenvolvimento.
- [ ] Confirmar que a sidebar mostra apenas `Kanban`, nao `Kanban Producao`.
- [ ] Abrir `/kanban`.
- [ ] Confirmar que o Hub Kanban abre sem `Failed to fetch`.

## 3. Criar quadro de teste

- [ ] Clicar em `Novo quadro`.
- [ ] Informar nome, por exemplo `Kanban Config Manual`.
- [ ] Escolher contexto `Projetos` ou `Personalizados`.
- [ ] Criar quadro.
- [ ] Confirmar redirecionamento para `/kanban/boards/:boardId`.
- [ ] Confirmar que colunas do preset foram criadas.

## 4. Configuracao do quadro

- [ ] Clicar em `Configuracoes do quadro`.
- [ ] Abrir aba `Terminologia`.
- [ ] Alterar:
  - [ ] Singular: `Tarefa`;
  - [ ] Plural: `Tarefas`;
  - [ ] Botao principal: `Nova tarefa`;
  - [ ] Botao de edicao: `Editar tarefa`;
  - [ ] Label do titulo: `Titulo da tarefa`;
  - [ ] Label da descricao: `Descricao da tarefa`.
- [ ] Abrir aba `Campos`.
- [ ] Adicionar campo:
  - [ ] Key: `cliente`;
  - [ ] Label: `Cliente`;
  - [ ] Tipo: `Texto curto`;
  - [ ] Mostrar no card: ligado;
  - [ ] Mostrar no drawer: ligado;
  - [ ] Mostrar na TV: ligado.
- [ ] Salvar configuracao.
- [ ] Confirmar que o drawer fecha.
- [ ] Confirmar que o botao principal mudou para `Nova tarefa`.

## 5. Card dinamico

- [ ] Clicar em `Nova tarefa`.
- [ ] Preencher titulo.
- [ ] Preencher `Cliente`.
- [ ] Salvar.
- [ ] Confirmar que o card aparece.
- [ ] Confirmar que o card compacto mostra `Cliente`.
- [ ] Abrir o card.
- [ ] Confirmar que o drawer mostra a secao `Campos`.
- [ ] Confirmar que `Cliente` aparece no drawer.
- [ ] Clicar em `Editar tarefa`.
- [ ] Alterar `Cliente`.
- [ ] Salvar.
- [ ] Confirmar que o modal nao fecha se a API falhar.
- [ ] Recarregar a pagina.
- [ ] Confirmar que o valor editado persistiu.

## 6. TV/Foco global

- [ ] Abrir `/kanban/tv`.
- [ ] Selecionar o quadro criado, se necessario.
- [ ] Confirmar que o campo `Cliente` aparece.
- [ ] Alternar modo `Lista`.
- [ ] Alternar modo `Kanban`.
- [ ] Confirmar que nao aparece HTTP 404 nem `Failed to fetch`.

## 7. Producao

- [ ] Abrir `/kanban/producao`.
- [ ] Confirmar que o titulo `Kanban Producao` aparece.
- [ ] Confirmar que o botao mostra `Nova OP`, salvo se a terminologia de producao foi configurada intencionalmente.
- [ ] Confirmar que OPs, checklist e preview TV/Foco continuam funcionando.
- [ ] Confirmar que nao aparece HTTP 404 nem `Failed to fetch`.

## 8. Validacoes negativas

- [ ] Tentar salvar campo com key contendo espaco ou acento. Deve falhar.
- [ ] Tentar adicionar dois campos com a mesma key. Deve falhar.
- [ ] Tentar campo `select` sem options. Deve falhar.
- [ ] Tentar salvar card sem campo customizado obrigatorio, se configurado. Deve falhar.

## 9. Comandos automatizados

- [ ] `npm run backend:test`
- [ ] `npm run build --workspace=apps/web`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run smoke:api`
- [ ] `npm run e2e -- --project=chromium`

## 10. Resultado esperado

- [ ] Config em `metadata.config`.
- [ ] Valores em `metadata.customFields`.
- [ ] Nenhum select nativo branco nas telas Kanban.
- [ ] Nenhum HTTP 404 esperado.
- [ ] Nenhum `Failed to fetch`.
- [ ] Produção continua independente em `production_orders`.
