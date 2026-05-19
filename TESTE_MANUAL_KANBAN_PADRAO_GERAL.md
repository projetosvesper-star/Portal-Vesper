# Teste Manual Kanban Padrao Geral

## Preparacao

- [ ] Garantir que `.env` existe e nao esta versionado.
- [ ] Subir infraestrutura.
- [ ] Rodar migrations.
- [ ] Rodar seed.
- [ ] Subir backend atual.
- [ ] Se a porta `8000` estiver presa, subir backend em `8002`.
- [ ] Subir frontend com `VITE_API_BASE_URL` apontando para o backend atual.

## Anti-404

- [ ] Abrir `/api/health`.
- [ ] Abrir `/api/docs`.
- [ ] Confirmar no OpenAPI `/api/kanban/boards`.
- [ ] Confirmar no OpenAPI `/api/kanban/boards/{board_id}/columns`.
- [ ] Confirmar no OpenAPI `/api/kanban/boards/{board_id}/cards`.
- [ ] Confirmar no OpenAPI `/api/kanban/producao/ops`.
- [ ] Confirmar no OpenAPI `/api/kanban/producao/dashboard`.
- [ ] Confirmar no OpenAPI `/api/kanban/producao/tv`.

## Hub Kanban

- [ ] Sidebar mostra apenas Kanban.
- [ ] `/kanban` abre.
- [ ] Contextos aparecem: Quadros, Producao, Projetos, TI / Operacional, Personalizados.
- [ ] Botao TV/Foco aparece dentro do Hub.
- [ ] Select/dropdown esta escuro e no padrao do Portal.
- [ ] Nao existe dropdown branco nativo.
- [ ] Filtro por tipo de quadro funciona.
- [ ] Empty state de contexto sem quadro fica legivel.

## Quadro generico

- [ ] Criar quadro funciona.
- [ ] Preset cria colunas iniciais.
- [ ] Abrir `/kanban/boards/:boardId` funciona.
- [ ] Se quadro nao tiver colunas, aparece "Este quadro ainda nao possui colunas."
- [ ] Botao "Criar colunas padrao" funciona.
- [ ] Botao/campo "Criar coluna manualmente" funciona.
- [ ] Criar card funciona.
- [ ] Editar card funciona.
- [ ] Mover/reordenar card funciona.
- [ ] Checklist generico funciona.
- [ ] Comentarios funcionam.
- [ ] Anexos funcionam.
- [ ] Atividade aparece.

## Producao

- [ ] `/kanban/producao` abre.
- [ ] OPs aparecem.
- [ ] Criar OP funciona.
- [ ] Drawer abre.
- [ ] Tabs Resumo, Checklist e Atividade estao claras.
- [ ] Selects do drawer estao escuros.
- [ ] Checklist permite marcar/desmarcar.
- [ ] Checklist permite editar item.
- [ ] Checklist pede confirmacao antes de remover item.
- [ ] Percentual atualiza.
- [ ] Preview TV/Foco da Producao nao mostra 404.

## TV/Foco global

- [ ] `/kanban/tv` abre.
- [ ] Permite escolher Producao quando usuario tem permissao.
- [ ] Permite escolher quadro Projetos.
- [ ] Permite escolher quadro TI / Operacional.
- [ ] Permite escolher quadro Personalizado.
- [ ] Modo Lista funciona.
- [ ] Modo Kanban funciona.
- [ ] Cards/OPs mostram prioridade, status/coluna, entrega e percentual quando existir.
- [ ] Tela fica legivel em telhao.

## Erros

- [ ] Nenhuma tela mostra `Not Found (HTTP 404)` cru.
- [ ] Nenhuma tela mostra `Failed to fetch` sem contexto.
- [ ] ErrorState mostra endpoint/status/sugestao em desenvolvimento.
- [ ] Preview TV/Foco falha isoladamente sem quebrar a pagina inteira.

## Responsividade

- [ ] Hub fica utilizavel em notebook.
- [ ] Hub nao cria overflow horizontal.
- [ ] Quadro generico fica utilizavel em tela menor.
- [ ] Producao fica utilizavel em tela menor.
- [ ] TV/Foco fica legivel em desktop e notebook.

## Comandos finais

- [ ] `npm run backend:test`
- [ ] `npm run build --workspace=apps/web`
- [ ] `npm run lint`
- [ ] `npm run typecheck`

## Pendencias conhecidas

- [ ] Playwright E2E ainda precisa ser instalado/configurado.
- [ ] Fluxo completo de editar/arquivar/excluir board pela UI pode ser aprofundado em etapa posterior.
