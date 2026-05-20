# Implementação Playwright E2E Kanban

## Objetivo

Criar um fluxo de testes end-to-end para validar o Kanban geral usando portas adaptáveis e runtime config.

## Componentes implementados

- `playwright.config.ts`
- `scripts/dev-portal.mjs`
- `scripts/smoke-kanban-api.mjs`
- `apps/web/src/shared/config/runtimeConfig.ts`
- `e2e/playwright/tests/kanban_geral.spec.ts`

## Workflow

1. `npm run dev:portal`
2. O script procura backend em `8000`, `8002`, `8003`, `8004`
3. Se encontrar backend válido, reutiliza a porta ocupada
4. Se não, sobe backend na primeira porta livre
5. O frontend é iniciado na primeira porta livre entre `5174`, `5175`, `5176`, `5177`
6. Um arquivo `apps/web/public/runtime-config.json` é gerado com as URLs reais
7. O frontend consome `apiBaseUrl` e `wsBaseUrl` do runtime config
8. O Playwright usa `E2E_BASE_URL` / `E2E_API_BASE_URL` ou lê runtime config se necessário

## Validação do backend

O script valida o backend ativo via:

- `GET /api/health`
- `GET /openapi.json`

O backend é aceito somente se as rotas esperadas estiverem presentes:

- `/api/kanban/boards`
- `/api/kanban/producao/ops`
- `/api/kanban/producao/dashboard`
- `/api/kanban/producao/tv`

## Observações

- A porta `8000` pode estar presa por um listener/PID fantasma.
- O fluxo adaptável evita o uso de backend antigo em `8000` e usa `8002` quando necessário.
- O frontend não depende mais de `localhost:8000` fixo.
