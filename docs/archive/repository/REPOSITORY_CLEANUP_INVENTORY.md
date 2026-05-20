# Repository Cleanup Inventory

Etapa: CHECKPOINT FINAL N8N + LIMPEZA DO REPOSITORIO - Portal Vesper

Data: 2026-05-20

## Resumo

A raiz do projeto foi auditada e limpa. Antes de mover/remover arquivos, os candidatos foram copiados para:

```text
.local_cleanup_backup/2026-05-20-final-n8n-cleanup/
```

Essa pasta esta ignorada pelo Git.

## Inventario

| Caminho | Tipo | Categoria | Acao recomendada/executada | Motivo | Seguro remover? | Precisa backup? | Deve entrar no Git? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `README.md` | doc principal | KEEP_ROOT | Mantido na raiz | Entrada principal do projeto | Nao | Nao | Sim |
| `package.json` / `package-lock.json` | Node/npm | KEEP_ROOT | Mantidos | Scripts e lockfile do monorepo | Nao | Nao | Sim |
| `.env.example` | template ambiente | KEEP_ROOT | Mantido | Necessario para setup | Nao | Nao | Sim |
| `.env` | ambiente local | IGNORE_LOCAL | Mantido local e ignorado | Pode conter valores reais | Nao | Sim | Nao |
| `.gitignore` | Git | KEEP_ROOT | Atualizado | Protecao contra artefatos/segredos | Nao | Nao | Sim |
| `apps/`, `backend/`, `infra/`, `packages/`, `scripts/`, `e2e/` | codigo | KEEP_ROOT | Mantidos | Codigo fonte real | Nao | Nao | Sim |
| `docs/automation_gateway.md` | documentacao | KEEP_ROOT_DOCS | Atualizado | Estado final Automation/n8n | Nao | Nao | Sim |
| `N8N/workflows/**` | workflows | KEEP_VERSIONED_N8N | Reorganizado | Workflows finais sanitizados | Nao | Sim | Sim |
| `N8N_BACKUP_BEFORE_*` | backup bruto | MOVE_TO_ARTIFACTS_ARCHIVE | Movido para backup local ignorado | Backup bruto nao deve ir para Git | Sim | Sim | Nao |
| `N8N_AFTER_*` | export bruto | MOVE_TO_ARTIFACTS_ARCHIVE | Movido para backup local ignorado | Export temporario | Sim | Sim | Nao |
| `N8N_READY_TO_IMPORT/` | export intermediario | MOVE_TO_ARTIFACTS_ARCHIVE | Movido para backup local ignorado | Substituido por workflows finais | Sim | Sim | Nao |
| `N8N_*.json` soltos | artefato intermediario | MOVE_TO_ARTIFACTS_ARCHIVE | Movido para backup local ignorado | Inventarios e resultados temporarios | Sim | Sim | Nao |
| `N8N_*REPORT*.md` e docs finais n8n | relatorio | MOVE_TO_DOCS | Movidos para `docs/n8n/` | Documentacao util final | Nao | Sim | Sim |
| `N8N_AI_GENERATED_*`, auditorias antigas | relatorio historico | MOVE_TO_DOCS_ARCHIVE | Movidos para `docs/archive/n8n/` | Historico util, nao doc principal | Sim | Sim | Sim |
| `IMPLEMENTACAO_*`, `TESTE_MANUAL_*`, `AUDITORIA_*` Kanban/base | relatorio historico | MOVE_TO_DOCS_ARCHIVE | Movidos para `docs/archive/kanban/` | Historico tecnico, nao raiz | Sim | Sim | Sim |
| `*.log` | log local | IGNORE_LOCAL | Movidos para backup local ignorado | Artefato de execucao | Sim | Sim | Nao |
| `node_modules/`, `.venv/`, caches, `dist/` | dependencia/cache | IGNORE_LOCAL | Ignorados | Nao versionar artefato | Sim | Nao | Nao |

## Decisao

A raiz ficou limitada a arquivos de projeto, codigo, configuracao, `README.md`, `N8N/` final, `docs/` e scripts. Relatorios soltos e exports brutos foram removidos da raiz.
