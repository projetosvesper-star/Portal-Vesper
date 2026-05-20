# Implementação de Dev Runtime Config e Fallback de Portas

## Objetivo

Evitar dependência fixa em `localhost:8000` durante o desenvolvimento e permitir um fluxo de inicialização que se adapta às portas disponíveis.

## Alterações realizadas

- Novo script `scripts/dev-portal.mjs`
  - Detecta se `8000`, `8002`, `8003` ou `8004` estão disponíveis
  - Reutiliza um backend válido já em execução se encontrar
  - Inicia backend em uma porta livre caso necessário
  - Escolhe frontend livre em `5174`, `5175`, `5176`, `5177`
  - Gera `apps/web/public/runtime-config.json`
- `apps/web/src/shared/config/runtimeConfig.ts`
  - Carrega o runtime config antes do bootstrap do React
- `apps/web/src/app/main.tsx`
  - Inicializa runtime config antes de renderizar
- `apps/web/src/shared/api/client.ts`
  - Usa `getRuntimeConfig().apiBaseUrl` para todas as chamadas
- `apps/web/src/shared/hooks/PortalWebSocketProvider.tsx`
  - Usa `wsBaseUrl` dinâmico definido no runtime config

## Comandos úteis

- `npm run dev:portal`
- `npm run dev:portal:clean`
- `npm run smoke:api`

## Observações

- O backend agora aceita `CORS_ORIGINS` para portas múltiplas, incluindo `5175` e `5177`.
- O frontend passa a depender de runtime config gerado em tempo de execução.
- O script não mata PID de portas ocupadas; apenas tenta uma porta livre ou valida backend existente.
