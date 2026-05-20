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

### Configuracao por metadata JSONB

A Fase 1 do Kanban configuravel usa `metadata` JSONB como camada de configuracao versionada:

- `kanban_boards.metadata.config` guarda o contrato de configuracao do quadro;
- `kanban_cards.metadata.customFields` guarda os valores de campos dinamicos;
- o backend valida configuracao e valores com Pydantic v2;
- updates de configuracao fazem merge controlado e preservam outras chaves de metadata;
- alteracoes de configuracao geram activity log, audit log e evento `kanban.board.config.updated`.

Essa escolha evita novas tabelas na primeira iteracao e mantem o Kanban Engine generico. Tabelas dedicadas para templates, contexto, campos e permissoes por campo ficam para fases futuras se a configuracao exigir consultas e relatorios mais fortes.

### Configuracao do Hub Kanban

A Fase 2 usa um board interno de sistema para persistir configuracoes do Hub:

- `kanban_boards.key = "__kanban_hub_config__"`;
- `kanban_boards.metadata.hubConfig.contexts`;
- `kanban_boards.metadata.hubConfig.templates`.

Contextos definem quais entradas aparecem dentro de `/kanban`, suas permissoes, ordem, rota especializada ou filtros de board generico. Templates definem colunas iniciais e `metadata.config` aplicada na criacao do board.

Essa solucao mantem o dominio pequeno nesta fase e evita migrations desnecessarias. Se o Portal passar a precisar de auditoria detalhada por template, filtros por template ou relatorios analiticos, a configuracao pode migrar para tabelas dedicadas sem mudar o contrato publico da UI.

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
