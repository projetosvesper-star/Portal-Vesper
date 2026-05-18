# Arquitetura

O Portal Vesper segue separacao estrita entre apresentacao e regra de negocio.

- `apps/desktop`: shell Tauri 2.0. Nao contem regra de negocio.
- `apps/web`: interface React. Esconde modulos sem permissao, mas nao decide acesso real.
- `backend`: FastAPI com autenticacao, RBAC, modulos, auditoria, notificacoes, arquivos e WebSocket.
- `infra`: PostgreSQL, Redis, MinIO, backend, worker e ferramentas locais.

O backend e a fonte de verdade para permissoes, dados, validacoes e integracoes. O cliente Tauri sempre conversa com a API central.

## Fluxo base

1. Usuario entra com username e senha.
2. Backend valida credenciais e emite access token JWT e refresh token.
3. Frontend chama `/api/me/modules` e monta a sidebar dinamicamente.
4. Cada endpoint protegido valida `current_user` e permissao no backend.
5. Eventos rapidos usam Redis Pub/Sub e WebSocket.
6. Eventos importantes usam Redis Streams para workers futuros.

## Endurecimentos da base

- Configuracao centralizada via Pydantic Settings.
- CORS configuravel por ambiente e bloqueio de `*` em producao.
- Upload com validacao de tamanho, tipo e bucket permitido.
- WebSocket autenticado por JWT com ping/pong basico.
- Redis Pub/Sub com broadcast, canal por usuario e canal por modulo.
- Redis Streams para auditoria, notificacoes, arquivos e filas futuras.

## Modulos futuros

Cada modulo deve ter pasta propria no backend e no frontend, permissao `modulo.view`, rotas protegidas e registro em `portal_modules`.

## Kanban Engine

O Kanban Engine e um **motor unico e generico** de quadros/colunas/cards. Ele sera reutilizado por contextos diferentes (producao, projetos, operacional, helpdesk e quadros customizados) sem duplicar codigo nem criar campos industriais diretamente em `kanban_cards`.

Detalhes: `docs/kanban-engine.md`.
