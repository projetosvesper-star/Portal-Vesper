# Teste Manual Guiado — Kanban Produção UI

Pré-requisitos

- Infra local (docker-compose) e backend rodando.
- Frontend: `npm run dev --workspace=apps/web` ou `npm run build --workspace=apps/web` + servidor estático.
- Conta com permissão `kanban_producao.view` para acessar Produção.

Passos detalhados

1) Login
	- Acesse a aplicação e faça login com um usuário administrador.

2) Verificar sidebar
	- Confirme que a sidebar mostra apenas o item `Kanban` e NÃO mostra `Kanban Produção` como item separado.

3) Abrir Hub Kanban
	- Navegue para `/kanban`.
	- No seletor de contextos, confirme que a opção `Produção` existe (se o usuário tiver permissão).
	- Selecione `Produção` — o app deve navegar para `/kanban/producao`.

4) Página Produção (smoke)
	- Verifique presença de KPIs (Total, Em andamento, Atrasados, Concluídos, Arquivados).
	- Confirme que a lista de OPs é carregada.

5) Criar OP
	- Abra o formulário de criar OP.
	- Preencha `numero_op`, `quantidade`, `modelo` e clique em `Criar`.
	- Verifique toast de sucesso e presença da nova OP na lista.

6) Abrir Drawer de uma OP
	- Clique em uma OP para abrir o `ProductionOrderDrawer`.
	- Verifique cabeçalho (número OP, cliente, modelo) e botões (Editar, Arquivar/Restaurar, Fechar).

7) Editar OP
	- Clique em `Editar`, altere alguns campos (por ex. `cliente`, `observacoes`) e clique em `Salvar`.
	- Verifique toast de sucesso e que os dados atualizados aparecem na lista/detalhe.

8) Checklist
	- Na seção `Checklist`, adicione um item novo e confirme que aparece na lista.
	- Marque um item como concluído e verifique alteração visual (line-through) e percentual atualizado.
	- Edite título/descrição inline (se disponível) e confirme persistência.
	- Remova um item e confirme que some da lista.

9) Reordenar checklist
	- Use os botões `↑` / `↓` para subir e descer um item.
	- Confirme que a ordem muda imediatamente na UI e que o backend registra a nova ordem (via invalidation/refresh).

10) Arquivar / Restaurar
	- No header do drawer, clique em `Arquivar` e confirme que OP desaparece da lista ativa (ou aparece em Arquivados).
	- Abra uma OP arquivada e clique em `Restaurar` — confirme retorno ao estado ativo.

11) Atividade
	- Na aba `Atividade`, verifique que ações recentes (criação, edição, checklist) aparecem em ordem cronológica.

12) TV / Foco
	- Ative o preview TV/Foco disponível na página e confirme que a visualização mostra OPs conforme o layout de TV.

13) Loading / Empty / Error states
	- Simule listas vazias (ou use um usuário sem OPs) e confirme mensagens de empty.
	- Simule erro de backend (se possível) e verifique mensagem de erro exibida.

14) Permissões
	- Teste com um usuário sem `kanban_producao.view` e confirme que `Produção` não aparece no seletor.

Resultado esperado

- Todos os itens descritos acima devem funcionar conforme indicado. Em validação local os flows principais (criar, editar, drawer, checklist, reordenação, arquivar/restaurar) funcionaram.

Notas

- Se algum passo falhar com erro crítico (build, login, API, permissão), capture o console/Network e reportar.
- Para automação E2E: ajustar credenciais e seletores em `e2e/playwright/tests/kanban_producao.spec.ts`.

