# Implementação — UI Kanban Produção

Resumo executivo

Implementação da primeira UI operacional do "Kanban Produção" integrada ao módulo `Kanban` do frontend.
O objetivo foi unificar a navegação (não ter item separado na sidebar) e oferecer uma experiência mínima produtiva para criar/editar OPs, gerenciar checklist, ver atividade e suportar preview TV/Foco.

Situação final (checklist de verificação)

1. Sidebar ficou somente com "Kanban": Sim — `kanban_producao` não aparece como item separado na sidebar.
2. "Kanban Produção" saiu da sidebar: Sim — é um contexto interno acessível via Hub Kanban.
3. Produção aparece dentro do Hub Kanban: Sim — `KanbanHubPage` adicionada com opção "Produção" que navega para `/kanban/producao`.
4. `/kanban` abre: Sim — rota do hub está funcionando.
5. `/kanban/producao` abre: Sim — `KanbanProducaoPage` implementada e funcional.
6. Criar OP funciona: Sim — formulário cria OP e invalida queries relevantes.
7. Editar OP funciona: Sim — drawer permite editar campos e salvar alterações.
8. Drawer funciona: Sim — exibe Resumo, Checklist e Atividade; abre/fecha corretamente.
9. Checklist funciona: Sim — adicionar, marcar como concluído, editar e remover itens.
10. Subir/descer checklist funciona: Sim — troca `order_index` entre itens e envia reordenação ao backend.
11. Arquivar/restaurar funciona: Sim — disponível na header do drawer com feedback (toasts) e invalidation.
12. TV/Foco preview funciona: Sim — suporte de frontend para preview e chaves de query para TV invalidadas por eventos.
13. WebSocket/realtime funciona: Sim — `PortalWebSocketProvider` usado para escutar eventos `kanban_producao.*` e debounced invalidation configurado.
14. `backend:test` passou: Sim — testes de backend executados localmente e passaram.
15. `build` / `lint` / `typecheck` passaram: Sim — build do web app, lint e typecheck estão ok.

Arquivos principais alterados / adicionados

- `apps/web/src/shared/layout/Sidebar.tsx`
- `apps/web/src/app/router.tsx`
- `apps/web/src/modules/kanban/KanbanHubPage.tsx`
- `apps/web/src/modules/production/queryKeys.ts`
- `apps/web/src/modules/production/api.ts`
- `apps/web/src/modules/production/types.ts`
- `apps/web/src/modules/production/KanbanProducaoPage.tsx`
- `apps/web/src/modules/production/ProductionOrderDrawer.tsx`
- `e2e/playwright/tests/kanban_producao.spec.ts`
- `TESTE_MANUAL_KANBAN_PRODUCAO_UI.md` (atualizado)

Bugs corrigidos

- Vários erros de tipagem TypeScript e JSX no `ProductionOrderDrawer.tsx` (fechamento de tags e usos incorretos de `.isLoading` em mutations) corrigidos.

Riscos pendentes / melhorias

- Polir UX do drawer (transformar seções em tabs, validações por campo).
- Ajustes visuais e responsividade.
- Implementar e rodar E2E Playwright em CI com dados controlados.

Próximos passos recomendados

- Revisar UX e acessibilidade do drawer e checklist.
- Executar e ajustar testes Playwright locais e integrar ao CI.
- Criar branch/PR e revisar em code review.

