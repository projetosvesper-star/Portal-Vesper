# N8N Enterprise Hardening Checkpoint

- Data: 2026-05-20T14:12:55.432576
- Branch Git: main
- Workflows encontrados na API n8n: 24
- Observacao: o pedido mencionava 23 workflows, mas a API local retornou 24. O workflow extra foi preservado e inventariado.

| Workflow | ID | Ativo | Tipo | Nodes | Webhooks | Credenciais | Modelos |
|---|---|---:|---|---:|---|---|---|
| AI - PORTAL VESPER - Agente Empresarial Central | VWvbDbpaFBD7Mlb2 | False | supervisor | 25 | - | httpBearerAuth, openAiApi | gpt-4o-mini, {"__rl": true, "mode": "list", "value": "gpt-4o-mini"} |
| AI - PORTAL VESPER - Agente Financeiro | sEb2fdz1CsBGdqrG | False | ai_worker | 18 | financeiro/documentos | openAiApi | gpt-4o-mini, {"__rl": true, "mode": "list", "value": "gpt-4o-mini"} |
| AI - PORTAL VESPER - Agente HelpDesk e Controle TI | 8eiZJutfJzGWBcLa | False | ai_worker | 16 | - | openAiApi | gpt-4o-mini, {"__rl": true, "mode": "list", "value": "gpt-4o-mini"} |
| AI - PORTAL VESPER - Agente de Aprovações e Escalonamento | CwEjjhfG6oX8Jm8j | False | ai_worker | 19 | - | openAiApi | gpt-4o-mini, {"__rl": true, "mode": "list", "value": "gpt-4o-mini"} |
| AI - PORTAL VESPER - Agente de Arquivos NAS e Conhecimento | h8Iz1QFvOJJi9CEA | False | ai_worker | 16 | - | openAiApi | gpt-4o-mini, {"__rl": true, "mode": "list", "value": "gpt-4o-mini"} |
| AI - PORTAL VESPER - Agente de Compras e Cotações | Yj7CD3aJ8u7Fb099 | False | ai_worker | 18 | - | httpBearerAuth, openAiApi | gpt-4o-mini, {"__rl": true, "mode": "list", "value": "gpt-4o-mini"} |
| AI - PORTAL VESPER - Agente de Estoque e Reposição | gY7OJFcb1gKIO2PG | False | ai_worker | 24 | - | openAiApi | gpt-4o-mini, {"__rl": true, "mode": "list", "value": "gpt-4o-mini"} |
| AI - PORTAL VESPER - Agente de Produção OP e Kanban | 5N3jh1K3kg2bCw7u | False | ai_worker | 22 | Webhook Manual | httpBearerAuth, openAiApi | gpt-4o-mini, {"__rl": true, "mode": "list", "value": "gpt-4o-mini"} |
| AI - PORTAL VESPER - Agente de Propostas Comerciais | 7IT99SCO1c1H388N | False | ai_worker | 18 | proposta-comercial, Responder ao Webhook | httpBearerAuth, openAiApi | gpt-4o-mini, {"__rl": true, "mode": "list", "value": "gpt-4o-mini"} |
| AI - PORTAL VESPER - Agente de Qualidade Auditoria INMETRO e CAPA | DQqK9hgVQugbpJUh | False | ai_worker | 26 | auditoria-inmetro | openAiApi | gpt-4o-mini, {"__rl": true, "mode": "list", "value": "gpt-4o-mini"} |
| AI - PORTAL VESPER - Agente de RH Onboarding e Offboarding | IVSV8kGMLbI77P7v | False | ai_worker | 17 | Webhook Portal RH, Responder Webhook, Responder Webhook Erro | openAiApi | gpt-4o-mini, {"__rl": true, "mode": "list", "value": "gpt-4o-mini"} |
| AI - PORTAL VESPER - War Room Executivo | ZUw5rYMxgWI0eXn4 | False | war_room | 23 | - | openAiApi | gpt-4o-mini, {"__rl": true, "mode": "list", "value": "gpt-4o-mini"} |
| Assistente Dev - Prompt Codex Antigravity | assistente-dev-prompt-01 | False | legacy | 3 | assistente-dev, Responder | - | - |
| COMERCIAL - Quote to Cash Agent | x5JL06bbBOhrKUaU | True | legacy | 31 | vesper/comercial/quote-to-cash | - | - |
| COMPRAS - Procure to Pay Agent | k2Ss9Ct4aHKf67cf | True | legacy | 27 | vesper/compras/procure-to-pay | - | - |
| CORE - Approval Center | aY5nyRrZ3ugYT6ZH | True | approval_core | 29 | vesper/core/approval/request, vesper/core/approval/respond | - | - |
| CORE - Error Audit Dead Letter | LpsYX0AkHTdZKw7P | True | error_core | 11 | vesper/core/error-audit | - | - |
| CORE - Gateway Supervisor | IkWAyy2BUsVgN4to | True | supervisor | 31 | vesper/core/gateway | - | - |
| Conex�o Real - Antigravity Teste | OBlIDpKf6oeiZZhD | False | legacy | 2 | - | - | - |
| INTERNO - Portal Assistant | 4O6XLSFUB3tK3QOz | True | legacy | 31 | vesper/interno/portal-assistant | smtp | - |
| KNOWLEDGE - RAG Auditoria | IihtDTarCO1U8vly | True | legacy | 31 | vesper/knowledge/rag-auditoria | - | - |
| My workflow | dAixmKE23LTXEqml | False | legacy | 2 | - | ollamaApi | gpt-oss:120b-cloud, {"__rl": true, "value": "gpt-oss:120b-cloud", "mode": "list", "cachedResultName": "gpt-oss:120b-clou |
| PRODUCAO - Kanban OP Agent | VkXV7Zjj76l8MABu | True | legacy | 26 | vesper/producao/kanban-op | - | - |
| WAR ROOM - Observability | THg5NXA3w6kKyFJT | True | legacy | 35 | vesper/war-room/observability | - | - |
