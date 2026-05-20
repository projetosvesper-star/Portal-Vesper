# Teste Manual Kanban Configuravel Fase 2

Use este checklist depois de subir o ambiente com `npm run dev:portal`.

## Ambiente

- [ ] `npm run dev:portal` sobe backend e frontend.
- [ ] `runtime-config.json` aponta para o backend ativo.
- [ ] `http://localhost:8000/api/health` responde `status=ok`.
- [ ] `http://localhost:8000/openapi.json` lista `/api/kanban/contexts`.
- [ ] `http://localhost:8000/openapi.json` lista `/api/kanban/templates`.
- [ ] `http://localhost:8000/openapi.json` lista `/api/kanban/boards/from-template`.
- [ ] Nao aparece `Failed to fetch`.
- [ ] Nao aparece HTTP 404 em endpoints esperados.

## Login e sidebar

- [ ] Login Admin funciona.
- [ ] Sidebar mostra apenas `Kanban` para o modulo Kanban.
- [ ] Nao existe item separado `Kanban Producao`.
- [ ] `/kanban` abre o Hub.

## Contextos

- [ ] Hub carrega contextos pela API.
- [ ] Se a API falhar, fallback local continua mostrando contextos padrao.
- [ ] `Configurar Kanban` abre para Admin.
- [ ] Aba `Contextos` lista Quadros, Producao, Projetos, TI / Operacional, Personalizados e TV/Foco.
- [ ] Ocultar `Projetos` remove o contexto do Hub.
- [ ] Reativar `Projetos` recoloca o contexto no Hub.
- [ ] Criar contexto customizado funciona.
- [ ] Contexto customizado aparece no Hub.
- [ ] Subir/descer contexto altera a ordem.
- [ ] Restaurar padroes preserva customizados e restaura contextos de sistema.
- [ ] Excluir contexto customizado remove visualmente sem apagar contextos de sistema.

## Templates

- [ ] Aba `Templates` lista templates pela API.
- [ ] Criar template simples funciona.
- [ ] Editar nome de template funciona.
- [ ] Duplicar template funciona.
- [ ] Arquivar/desativar template funciona.
- [ ] Restaurar template funciona quando aplicavel.
- [ ] Template exige pelo menos uma coluna.
- [ ] Colunas do template aparecem no preview de criacao de quadro.

## Board from template

- [ ] `Novo quadro` permite escolher template.
- [ ] Criar quadro a partir do template redireciona para `/kanban/boards/:boardId`.
- [ ] Board criado recebe colunas do template.
- [ ] Board criado recebe `metadata.config`.
- [ ] Terminologia do template aparece no botao principal.
- [ ] Criar card no board criado funciona.

## Producao e TV/Foco

- [ ] `/kanban/producao` continua funcionando.
- [ ] Criar OP continua funcionando.
- [ ] Checklist da OP continua funcionando.
- [ ] Arquivar/restaurar OP continua funcionando.
- [ ] `/kanban/tv` continua funcionando.
- [ ] TV/Foco lista boards permitidos.
- [ ] TV/Foco respeita contextos ocultos quando houver correspondencia com o board.

## Qualidade visual

- [ ] Nenhum select nativo branco aparece nas telas Kanban.
- [ ] Dialogs e drawers seguem tema escuro.
- [ ] Mensagens de erro sao contextuais.
- [ ] Layout nao gera overflow horizontal.

## Comandos finais

- [ ] `npm run backend:test`
- [ ] `npm run build --workspace=apps/web`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run smoke:api`
- [ ] `npm run e2e -- --project=chromium`
