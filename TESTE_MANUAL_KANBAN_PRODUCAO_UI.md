# Teste Manual Kanban Producao UI

Use este checklist para validar manualmente a UI atual do Kanban Producao.

## Pre-condicoes

- Docker/infra local ativo.
- Banco migrado.
- Seed executado.
- Backend reiniciado com o codigo atual.
- Frontend reiniciado com o codigo atual.
- Usuario Admin disponivel.

Comandos sugeridos:

```bash
npm run infra:up
npm run backend:migrate
npm run backend:seed
npm run backend:dev
npm run dev:web
```

Observacao importante: durante a validacao desta etapa, havia uma instancia backend antiga ativa em `localhost:8000`, sem as rotas `/api/kanban/producao/*`. Se aparecer HTTP 404 na tela, reinicie o backend local antes de considerar erro da UI.

## Checklist principal

| Passo | Resultado esperado | Status |
| --- | --- | --- |
| Abrir `http://127.0.0.1:5174/login` | Tela de login carrega | Pendente de execucao manual |
| Entrar com `Admin` / `Vesper@890` | Login conclui e abre o Portal | Pendente de execucao manual |
| Ver sidebar | Sidebar mostra `Kanban`, mas nao mostra `Kanban Producao` como item proprio | Pendente de execucao manual |
| Abrir `Kanban` | Hub `/kanban` abre | Pendente de execucao manual |
| Selecionar contexto `Producao` | Navega para `/kanban/producao` | Pendente de execucao manual |
| Ver cabecalho | Titulo `Kanban Producao` e subtitulo aparecem sem quebra ruim | Pendente de execucao manual |
| Ver KPIs | Cards Total, Abertas, Em andamento, Aguardando, Prontas e Arquivadas aparecem responsivos | Pendente de execucao manual |
| Clicar `Nova OP` | Formulario abre sem overflow horizontal | Pendente de execucao manual |
| Criar OP valida | OP e criada e drawer abre | Pendente de execucao manual |
| Tentar criar OP sem numero | Erro inline aparece e formulario nao fecha | Pendente de execucao manual |
| Abrir uma OP existente | Drawer abre com overlay e rolagem interna | Pendente de execucao manual |
| Reduzir largura da tela | Drawer ocupa a largura disponivel sem cortar botoes | Pendente de execucao manual |
| Tab `Resumo` | Dados principais e percentual aparecem claros | Pendente de execucao manual |
| Clicar `Editar` | Formulario de edicao aparece com labels | Pendente de execucao manual |
| Salvar edicao valida | Drawer continua aberto e dados atualizam | Pendente de execucao manual |
| Forcar erro de salvar, se possivel | Erro inline aparece e drawer nao fecha | Pendente de execucao manual |
| Clicar `Cancelar` | Sai da edicao sem quebrar layout | Pendente de execucao manual |
| Tab `Checklist` | Itens aparecem ordenados e legiveis | Pendente de execucao manual |
| Primeiro item | Botao subir esta desabilitado | Pendente de execucao manual |
| Ultimo item | Botao descer esta desabilitado | Pendente de execucao manual |
| Editar item inline | Formulario nao quebra o card nem cria overflow | Pendente de execucao manual |
| Marcar/desmarcar item | Percentual atualiza apos resposta do servidor | Pendente de execucao manual |
| Adicionar item | Item entra no final e percentual permanece coerente | Pendente de execucao manual |
| Remover item | Browser pede confirmacao antes de remover | Pendente de execucao manual |
| Reordenar item | Ordem muda e permanece correta apos refresh | Pendente de execucao manual |
| Tab `Atividade` | Lista atividade ou mensagem vazia sem overflow | Pendente de execucao manual |
| Arquivar OP | Botao muda para `Restaurar` e drawer continua aberto | Pendente de execucao manual |
| Restaurar OP | Botao volta para `Arquivar` | Pendente de execucao manual |
| Fechar drawer | Overlay e drawer somem | Pendente de execucao manual |
| Preview TV/Foco lista | Lista e legivel para tela grande | Pendente de execucao manual |
| Preview TV/Foco kanban | Agrupamento por coluna/status aparece sem overflow | Pendente de execucao manual |
| Recarregar pagina | Estado persistido no backend continua correto | Pendente de execucao manual |

## Responsividade

Executar os mesmos fluxos nas larguras abaixo:

| Largura | O que observar | Status |
| --- | --- | --- |
| 1440px | Layout desktop com duas colunas e KPIs em linha | Pendente |
| 1024px | Coluna lateral continua utilizavel | Pendente |
| 768px | Lista, checklist e TV/Foco empilham sem overflow | Pendente |
| 390px | Drawer ocupa tela inteira e botoes quebram corretamente | Pendente |

## WebSocket e cache

| Validacao | Resultado esperado | Status |
| --- | --- | --- |
| Criar OP | Dashboard, lista e TV/Foco atualizam apos sucesso | Pendente |
| Editar OP | Detalhe, lista, atividade e TV/Foco atualizam | Pendente |
| Marcar checklist | Percentual atualiza no drawer e na lista | Pendente |
| Reordenar checklist | Ordem persiste apos reload | Pendente |
| Receber evento `kanban_producao.*` | Query invalidada com debounce, sem multiplas conexoes aparentes | Pendente |

## Playwright

O spec foi atualizado em:

```text
e2e/playwright/tests/kanban_producao.spec.ts
```

Execucao automatica ficou pendente porque `@playwright/test` nao esta instalado e nao ha script E2E no `package.json`.

Para habilitar futuramente:

```bash
npm install -D @playwright/test
npx playwright install
npx playwright test e2e/playwright --project=chromium
```

## Comandos automatizados executados nesta etapa

| Comando | Resultado |
| --- | --- |
| `npm run backend:test` | Passou: 25 testes |
| `npm run build --workspace=apps/web` | Passou |
| `npm run lint` | Passou |
| `npm run typecheck` | Passou |
| `npm ls @playwright/test --depth=0` | Confirmou Playwright nao instalado |

## Pendencias

- Executar este checklist manual apos reiniciar backend e frontend.
- Configurar Playwright como dependencia/script se a equipe quiser E2E oficial no CI.
- Validar visualmente em monitor de TV real antes de chamar o preview TV/Foco de pronto para uso operacional.
