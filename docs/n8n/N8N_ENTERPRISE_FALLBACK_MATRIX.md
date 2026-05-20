# N8N Enterprise Fallback Matrix

## Matriz

| Falha | Comportamento esperado | Estado atual |
| --- | --- | --- |
| Portal offline | Retry limitado, Error Audit, resposta controlada | Portal Core testado; fallback documentado |
| Portal 401/403 | Nao repetir infinitamente; registrar credencial/RBAC | Documentado |
| Portal 404 | Registrar endpoint faltante; nao mascarar sucesso | Smoke passou sem 404 nos endpoints testados |
| Portal 500 | Retry com limite e dead letter | Documentado |
| Timeout HTTP | Timeout em HTTP Request AI aplicado quando possivel | Parcialmente aplicado |
| Credencial n8n ausente | Nao ativar workflow; listar pendencia | Aplicado: workflows AI ficaram inativos |
| API key invalida | Error Audit e resposta controlada | `test_real_integration.py` validou 401/403/200 |
| IA indisponivel | OpenAI -> Gemini -> Ollama -> regra deterministica -> erro seguro | Estrategia documentada; nodes ainda pendentes |
| Cota/limite IA | Trocar provider ou pausar sem acao sensivel | Documentado |
| Falha de parse JSON | Error Audit e pedido de complemento | Documentado |
| Campo obrigatorio ausente | Pedir apenas campo faltante | Regra documentada para Supervisor |
| Workflow trabalhador indisponivel | Nao acionar em cascata; responder com pendencia | Documentado |
| Baixa confianca | Pedir esclarecimento | Documentado |
| `request_id` duplicado | Retornar resultado existente ou ignorar duplicata | Documentado como gap de idempotencia por workflow |
| Falha Approval Center | Nao executar acao sensivel | Core testado e ativo |
| Falha Error Audit | Preservar erro local e nao mascarar sucesso | Core ativo; fallback secundario pendente |

## Conclusao

Fallback de infraestrutura e erro foi reforcado nos workflows AI onde era seguro mexer, mas fallback multi-provedor executavel ainda depende de correcao estrutural dos workflows AI e credenciais.
