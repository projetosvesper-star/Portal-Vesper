# Modulos

Os modulos sao registrados no banco em `portal_modules` e exibidos por permissao.

Campos principais:

- `key`
- `name`
- `description`
- `route`
- `icon`
- `enabled`
- `order_index`
- `version`

## Como adicionar modulo

1. Criar permissao `novo_modulo.view`.
2. Criar registro em `portal_modules`.
3. Associar permissao em `module_permissions`.
4. Adicionar permissao aos perfis necessarios.
5. Criar router no backend protegido por permissao.
6. Criar tela no frontend e rota correspondente.
7. Adicionar testes de permissao e acesso.

Modulos finais nao foram implementados nesta etapa de proposito.

Antes de implementar o Kanban Engine, mantenha o primeiro modulo dentro deste padrao: router proprio, permissoes `kanban.*`, migrations separadas, testes de acesso e tela isolada em `apps/web/src/modules/kanban`.

## Kanban Engine (primeiro modulo real)

O **Kanban Engine** e o primeiro modulo com implementacao real no backend, projetado para ser **generico** e reutilizado no futuro por:

- Kanban Producao;
- Kanban Projetos;
- Kanban Operacional;
- HelpDesk (opcional);
- Quadros personalizados.

Documentacao completa: `docs/kanban-engine.md`.
