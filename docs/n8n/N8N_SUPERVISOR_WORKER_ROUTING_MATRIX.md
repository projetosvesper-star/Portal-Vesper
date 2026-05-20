# N8N Supervisor Worker Routing Matrix

## Supervisor principal

Workflow online: `CORE - Gateway Supervisor`

Supervisor AI complementar online: `AI - PORTAL VESPER - Agente Empresarial Central`

## Estrategia

- Workers legados continuam padrao para fluxos ja validados.
- Workers AI entram como complementares para analise, rascunho e assistencia.
- Supervisor nao deve chamar worker inativo.
- Supervisor nao deve chamar todos os workers ao mesmo tempo.
- Acoes sensiveis continuam exigindo Approval Center.

## Matriz

| Intencao | Worker legado | Worker AI | Prioridade atual | Aprovacao |
| --- | --- | --- | --- | --- |
| compras | COMPRAS - Procure to Pay Agent | AI - Agente de Compras e Cotacoes | Legado para execucao, AI para analise/rascunho | Compra final, fornecedor novo e valor alto |
| propostas | COMERCIAL - Quote to Cash Agent | AI - Agente de Propostas Comerciais | Legado para fluxo validado, AI para proposta assistida | Envio externo, desconto, PDF final |
| producao_kanban | PRODUCAO - Kanban OP Agent | AI - Agente de Producao OP e Kanban | Legado para fluxo validado, AI para analise | Alteracao critica de OP/Kanban |
| helpdesk_ti | Nenhum legado dedicado | AI - Agente HelpDesk e Controle TI | AI com acao controlada | Senha, acesso, instalacao, exclusao |
| knowledge | KNOWLEDGE - RAG Auditoria | AI - Agente de Arquivos NAS e Conhecimento | Knowledge legado primeiro, AI complementar | INMETRO/certificacao exige fonte/revisao |
| rh | Nenhum legado dedicado | AI - Agente RH Onboarding e Offboarding | AI com aprovacao | Acesso, bloqueio, desligamento, dados sensiveis |
| financeiro | Nenhum legado dedicado | AI - Agente Financeiro | AI como triagem/rascunho | Pagamento e dados bancarios |
| estoque | Nenhum legado dedicado | AI - Agente Estoque e Reposicao | AI como triagem/rascunho | Compra/reposicao critica |
| qualidade | Nenhum legado dedicado | AI - Agente Qualidade INMETRO e CAPA | AI com revisao humana | CAPA, INMETRO, EX e afirmacao tecnica sensivel |
| war_room | WAR ROOM - Observability | AI - War Room Executivo | War Room legado primeiro, AI para resumo | Nao corrige automaticamente |
| aprovacoes | CORE - Approval Center | AI - Agente de Aprovacoes e Escalonamento | Core primeiro, AI para lembrete/escalonamento | Nunca aprova/rejeita automaticamente |

## Regras contra chamada desnecessaria

- Saudacao simples nao chama worker.
- Consulta simples nao cria registro.
- Baixa confianca pede esclarecimento.
- Campo faltante pede apenas o campo faltante.
- `request_id` duplicado deve ser bloqueado ou retornar resultado existente.
- Acoes sensiveis criam aprovacao e param.
