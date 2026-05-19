# Implementação — Polimento da UI do Kanban Engine (Portal Vesper)

Data: 2026-05-18

## 1. O que foi implementado

1) **Reordenação precisa dentro da mesma coluna** (drag-and-drop) usando o endpoint existente de move.  
2) **Melhorias no dnd kit** (sensors + modifiers + indicador de drop).  
3) **UserPicker (responsável)** com usuários reais via endpoints seguros (`/api/users/search` e `/api/users/lookup`).  
4) **AttachmentsPanel** no drawer: upload em `/api/files/upload` + vínculo no Kanban attachments.  
5) **Feedback visual**: skeleton do board e toasts de sucesso/erro nas principais ações.  
6) **WebSocket**: invalidação com debounce e keys mais específicas (inclui attachments).  

## 2. Arquivos alterados/criados

### Frontend

- Alterados:
  - `apps/web/src/modules/kanban/KanbanEnginePage.tsx`
  - `apps/web/src/modules/kanban/hooks.ts`
  - `apps/web/src/modules/kanban/utils/permissions.ts`
  - `apps/web/src/modules/kanban/utils/dnd.ts`
  - `apps/web/src/modules/kanban/components/KanbanBoard.tsx`
  - `apps/web/src/modules/kanban/components/KanbanColumn.tsx`
  - `apps/web/src/modules/kanban/components/KanbanCard.tsx`
  - `apps/web/src/modules/kanban/components/CardDetailDrawer.tsx`
  - `apps/web/src/modules/kanban/components/CardFormDialog.tsx`
  - `apps/web/src/app/providers.tsx`
- Criados:
  - `apps/web/src/shared/api/users.ts`
  - `apps/web/src/shared/api/files.ts`
  - `apps/web/src/shared/components/UserPicker.tsx`
  - `apps/web/src/shared/components/ToastProvider.tsx`
  - `apps/web/src/modules/kanban/components/AttachmentsPanel.tsx`
  - `apps/web/src/modules/kanban/components/KanbanBoardSkeleton.tsx`

### Backend

- Alterados:
  - `backend/app/modules/kanban/service.py` (normalização da ordenação no move)
  - `backend/app/main.py` (inclui router de users)
  - `backend/app/schemas/auth.py` (UserLookupRead)
  - `backend/tests/test_kanban_engine.py` (novo teste de reorder dentro da coluna)
- Criados:
  - `backend/app/modules/users/router.py` (endpoints seguros `/api/users/search` e `/api/users/lookup`)

### Documentação

- Alterado:
  - `docs/kanban-engine.md`

## 3. Como funciona a reordenação (mesma coluna)

### Frontend

- O DnD calcula a posição alvo (índice) dentro da coluna.
- Chama `POST /api/kanban/cards/{card_id}/move` com:
  - `to_column_id` (mesma coluna)
  - `new_order_index` (índice alvo)
- Faz update otimista simples no cache (`useMoveKanbanCard`) e sempre refaz queries ao final.

### Backend

- O service `move_card()` agora **normaliza `order_index`** da coluna (ou das duas colunas afetadas) para:
  - evitar buracos/duplicações;
  - manter `order_index` sempre `0..n-1`.
- Continua gerando:
  - activity log (`card.moved`)
  - evento `kanban.card.moved`.

## 4. Como funciona o picker de usuários

### Endpoints

- `GET /api/users/search?q=<texto>&limit=20`
- `GET /api/users/lookup?ids=<uuid,uuid,...>`

Regras:
- exige login;
- retorna somente campos mínimos: `id`, `name`, `username`, `avatar_url`, `department`, `job_title`, `status`.

### UI

- `UserPicker` mostra campo de busca + dropdown, avatar/iniciais e metadados (departamento/cargo).
- Integrado no `CardFormDialog` para definir `assigned_to`.

## 5. Como funcionam anexos

### Fluxo

1. Upload do arquivo:
   - `POST /api/files/upload` com `FormData(upload)` e query `module_key=kanban&bucket=portal-files`.
2. Vincula ao card:
   - `POST /api/kanban/cards/{card_id}/attachments` com `file_id`.
3. Lista anexos:
   - `GET /api/kanban/cards/{card_id}/attachments`
4. Para abrir/baixar:
   - `GET /api/files/{file_id}` (retorna URL presigned)
5. Remover vínculo:
   - `DELETE /api/kanban/cards/{card_id}/attachments/{attachment_id}`

## 6. Permissões usadas

- `kanban.card.move` (drag-and-drop / reorder)
- `kanban.card.assign` **ou** `kanban.card.edit` (responsável)
- `kanban.card.attach` (upload/remover anexo)
- `kanban.card.checklist`, `kanban.card.comment`, `kanban.activity.view` (abas do drawer)

## 7. Ajustes backend (se houve)

- `move_card()` passou a normalizar `order_index` ao mover/reordenar cards (inclui mover dentro da mesma coluna).
- Adicionados endpoints seguros de busca/lookup de usuários.

## 8. Comandos executados

- `npm run build --workspace=apps/web`
- `npm run lint`
- `npm run typecheck`
- `npm run backend:test`

## 9. Resultado dos testes

- Build web: OK
- Lint: OK
- Typecheck: OK
- Backend tests: OK

## 10. Problemas encontrados

- O Portal ainda não possui `shadcn/ui` instalado; o polimento foi feito mantendo Tailwind + componentes existentes e adicionando componentes simples (UserPicker/Toast).

## 11. O que ficou para próxima etapa

- Refinar o comportamento de reorder em listas grandes (ex.: indicador de drop mais “sólido” e edge cases).
- Exibir nome/preview de anexos com mais detalhes (ex.: tipo com ícone, uploader quando disponível).
- Evoluir “assignees múltiplos” (tabela `kanban_card_assignees`) com UI própria.

## 12. Próximo prompt recomendado

“Iniciar Kanban Produção específico reaproveitando o Kanban Engine, criando campos/regas de OP apenas via especialização (sem poluir kanban_cards), mantendo as integrações (WebSocket, anexos, user picker e reorder).”

