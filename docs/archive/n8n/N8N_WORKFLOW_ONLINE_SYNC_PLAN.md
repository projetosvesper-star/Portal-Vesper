# N8N Workflow Online Sync Plan

## Estado final local

| Total | Ativos | Inativos |
| --- | --- | --- |
| 24 | 9 | 15 |

Observacao: o pedido mencionava 23 workflows, mas a API local retornou 24. O workflow extra foi preservado e documentado.

## Workflows ativos

| Workflow | Tipo | Quem chama | Intencoes |
| --- | --- | --- | --- |
| CORE - Gateway Supervisor | supervisor/core | Portal `/api/ia/gateway` | Roteamento central |
| CORE - Approval Center | core | Workers e Portal | Aprovacoes humanas |
| CORE - Error Audit Dead Letter | core | Workflows via errorWorkflow | Erros e dead letters |
| WAR ROOM - Observability | core | Portal/operador | Observabilidade |
| INTERNO - Portal Assistant | trabalhador legado | Supervisor/Portal | Assistente interno |
| COMPRAS - Procure to Pay Agent | trabalhador legado | Supervisor | Compras/cotacoes |
| COMERCIAL - Quote to Cash Agent | trabalhador legado | Supervisor | Propostas/comercial |
| PRODUCAO - Kanban OP Agent | trabalhador legado | Supervisor | OP/Kanban |
| KNOWLEDGE - RAG Auditoria | trabalhador legado | Supervisor | Knowledge/auditoria |

## Workflows inativos justificados

| Workflow | Motivo principal | Pode ativar agora? |
| --- | --- | --- |
| 12 workflows `AI - PORTAL VESPER - ...` | Falha de ativacao pelo n8n e/ou credenciais ausentes | Nao |
| Assistente Dev - Prompt Codex Antigravity | Workflow legado extra, fora da malha empresarial | Nao sem decisao |
| Conexao Real - Antigravity Teste | Workflow legado/teste | Nao sem decisao |
| My workflow | Workflow extra Ollama isolado, sem papel na malha | Nao sem decisao |

## Proximo passo para ativar AI workers

1. Configurar credenciais `openAiApi`, Portal Bearer, SMTP quando necessario.
2. Corrigir erro n8n `Cannot read properties of undefined (reading 'execute')` em cada workflow AI.
3. Rodar teste minimo por workflow.
4. Ativar somente workflows que passam sem acao sensivel automatica.
