# Implementacao - Kanban Engine (Backend)

## 1. O que foi implementado

- Fundacao do **Kanban Engine** no backend (FastAPI + SQLAlchemy 2.x).
- Modelo de dados + migracao Alembic.
- Permissoes granulares `kanban.*` e atualizacao do seed inicial (roles).
- Endpoints REST `GET/POST/PATCH/DELETE` para boards/columns/cards + checklist/comentarios/anexos + activity.
- Activity logs do Kanban + auditoria global para acoes criticas.
- Eventos do Kanban publicados em Redis Stream + WebSocket (via Redis Pub/Sub).
- Testes unitarios/servico para regras minimas e emissao de eventos.

## 2. Modelos criados

Arquivos:

- `backend/app/modules/kanban/models.py`
- `backend/app/modules/kanban/repository.py`
- `backend/app/modules/kanban/service.py`
- `backend/app/modules/kanban/router.py`
- `backend/app/modules/kanban/schemas.py`
- `backend/app/modules/kanban/permissions.py`
- `backend/app/modules/kanban/events.py`

## 3. Migration criada

- `backend/alembic/versions/0002_kanban_engine.py`

## 4. Permissoes adicionadas

Definicoes:

- `backend/app/modules/kanban/permissions.py` (todas as chaves `kanban.*`)

Seed:

- `backend/seeds/initial_seed.py` (associacao por perfil)

## 5. Endpoints criados

Prefixo: `/api/kanban`

Ver lista completa em `docs/kanban-engine.md`.

## 6. Eventos criados

Arquivo: `backend/app/modules/kanban/events.py`

Eventos:

- `kanban.board.created|updated|archived`
- `kanban.column.created|updated|reordered`
- `kanban.card.created|updated|moved|archived|restored|deleted|assigned`
- `kanban.comment.created|updated|deleted`
- `kanban.checklist.created|updated`
- `kanban.attachment.created|deleted`

## 7. Testes criados

- `backend/tests/test_kanban_engine.py`

## 8. Comandos executados

- `npm run backend:migrate` (OK)  
  - Aplicou: `0001_initial_foundation -> 0002_kanban_engine`
- `npm run backend:seed` (OK)
- `npm run backend:test` (OK)  
  - `19 passed`
- `npm run lint` (OK)
- `npm run typecheck` (OK)
- `npm run build --workspace=apps/web` (OK)

## 9. Resultado dos testes

- `npm run backend:test`: **19 passed** (Kanban Engine + base)

## 10. Problemas encontrados

- Um teste inicial do Kanban falhou ao consultar activity apos soft delete; ajustado para permitir leitura de activity mesmo quando `deleted_at` esta preenchido.
- Avisos do Pydantic (config class-based) e warnings de campo `schema` (somente warnings; nao bloqueiam build/test).

## 11. O que ficou para a proxima etapa

- UI completa do Kanban Engine (drag-and-drop e telas).
- Especializacoes (Producao/Projetos/etc.) em tabelas dedicadas, sem poluir `kanban_cards`.
- Enforcar permissao por quadro (`kanban_board_permissions`) no acesso aos recursos.
- Reorder/ordenacao completa e consistente (shift e reindex automatico).

## 12. Proximo prompt recomendado

> "Agora implemente a UI do Kanban Engine no React (sem especializacoes), com drag-and-drop, consumindo os endpoints existentes, e adicione uma pagina completa para boards/columns/cards."
