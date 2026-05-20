# N8N Enterprise Test Results

## Comandos executados

| Comando | Resultado |
| --- | --- |
| `npm run backend:test` | Passou: 32 testes |
| `npm run build --workspace=apps/web` | Passou; Vite alertou chunk acima de 500 kB |
| `npm run lint` | Passou |
| `npm run typecheck` | Passou |
| `npm run dev:portal` | Passou para ambiente de teste local |
| `npm run smoke:api` | Passou |
| `python scripts/test_real_integration.py` | Passou |
| `npm run e2e -- --project=chromium` | Passou: 2 testes |

## Integracao real

`scripts/test_real_integration.py` validou:

- `/api/ia/gateway`
- API key ausente/invalida/valida
- redaction de segredo
- Approval Center
- Error Audit/timeline por `correlation_id`

## n8n

| Teste | Resultado |
| --- | --- |
| Health n8n local | Passou em `http://127.0.0.1:5678/healthz` |
| Export backup | Passou |
| Atualizacao dos 12 AI workflows | Passou via PUT API |
| Ativacao dos 12 AI workflows | Falhou por erro n8n/credenciais |
| Workflows antigos ativos | Preservados |

## Erros nao encontrados nos testes

- Nenhum HTTP 404 inesperado nos testes executados.
- Nenhum `Failed to fetch`.
- Nenhum vazamento de segredo impresso.

## Decisao de teste

Portal, Automation Core, Approval Center, Error Audit, smoke e E2E estao saudaveis. A ativacao da nova malha AI nao passou e permanece pendente.
