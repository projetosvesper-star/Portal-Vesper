# Repository Cleanup Final Structure

## Estrutura final relevante

```text
PortalVesper/
  apps/
    desktop/
    web/
  backend/
    alembic/
    app/
    seeds/
    tests/
  docs/
    n8n/
    archive/
      kanban/
      n8n/
      repository/
    automation_gateway.md
    arquitetura.md
    setup-dev.md
  e2e/
  infra/
  N8N/
    README.md
    workflows/
      ai/
      core/
      legacy/
      inactive/
  packages/
  scripts/
  .env.example
  .gitignore
  package.json
  package-lock.json
  playwright.config.ts
  README.md
```

## O que saiu da raiz

- Relatorios antigos de Kanban e auditorias.
- Relatorios intermediarios n8n.
- Backups brutos `N8N_BACKUP_BEFORE_*`.
- Exports temporarios `N8N_AFTER_*`.
- Logs locais.
- JSONs intermediarios soltos.

## O que ficou versionavel

- Codigo fonte.
- Migration e modulo Automation Core.
- Testes backend e E2E.
- Documentacao final em `docs/`.
- Workflows finais sanitizados em `N8N/workflows/`.

## O que ficou local/ignorado

- `.env`.
- `.local_cleanup_backup/`.
- `node_modules/`.
- `backend/.venv/`.
- caches e logs.
- exports/backups brutos movidos para backup local.
