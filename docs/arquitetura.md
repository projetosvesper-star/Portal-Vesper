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

O Hub `/kanban` e a entrada unica para todos os quadros Kanban no frontend. A sidebar nao deve receber itens separados para Kanban Producao, Kanban Projetos, Kanban TI ou Kanban Operacional. Esses contextos vivem dentro do modulo Kanban e usam o mesmo backend generico, exceto quando uma camada de dominio especifica for necessaria.

A rota `/kanban/tv` fornece TV/Foco global do Kanban. Ela usa uma camada adaptadora no frontend para transformar cards genericos e OPs de Producao no mesmo formato visual, evitando duplicacao de UI e mantendo Producao como contexto interno do Kanban.

As telas do Kanban compartilham componentes de UI escuros em `apps/web/src/shared/ui`, evitando selects nativos brancos, estados de erro inconsistentes e dialogs fora do padrao do Portal.

Detalhes: `docs/kanban-engine.md`.

## Kanban Producao

O Kanban Producao e uma camada especifica de dominio sobre o Kanban Engine. A OP fica em `production_orders` e referencia um card generico por `card_id`, preservando o motor reutilizavel.

Nesta primeira fundacao foram adicionados OP simples, checklist editavel por OP, templates de checklist, TV/Foco simples e eventos `kanban_producao.*`. Recursos avancados como risco, alertas, OCR, Telegram e automacoes ficam para fases futuras.

Detalhes: `docs/kanban-producao.md`.

## Validacao do backend ativo

Antes de testar telas que consomem API, valide o backend realmente ativo:

- `GET /api/health`;
- `GET /api/docs`;
- `GET /openapi.json`.

Se o OpenAPI ativo nao listar uma rota que existe no codigo, o problema e operacional: backend antigo, porta presa, Docker/imagem antiga ou `API_BASE_URL` apontando para o servidor errado. A UI deve mostrar erro contextual, mas a solucao correta e reiniciar o backend atual ou ajustar `VITE_API_BASE_URL`.
