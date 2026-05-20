# N8N Portal API Gap Analysis

## Endpoints validados por testes

| Endpoint/area | Estado |
| --- | --- |
| `/api/ia/gateway` | Funciona |
| `/api/automation/audit` | Funciona |
| `/api/automation/errors` | Funciona |
| `/api/automation/approvals` | Funciona |
| Timeline por `correlation_id` | Funciona |
| API key/redactor | Funciona |

## Gaps por dominio de worker

| Dominio | Endpoint esperado | Estado |
| --- | --- | --- |
| Compras | Fornecedores, historico de precos, cotacoes reais | Parcial/futuro |
| Propostas | Produtos, clientes, certificacoes, prazos, PDF final | Parcial/futuro |
| Producao/Kanban | OPs/Kanban ja existem parcialmente | Funciona para base atual |
| HelpDesk/TI | Tickets, acesso, equipamento, certificados | Futuro |
| RH | Onboarding/offboarding, acessos, documentos | Futuro |
| Financeiro | Pagamentos, notas, despesas, cobrancas | Futuro |
| Estoque | Estoque minimo, reposicao, vinculo com OP | Futuro |
| Qualidade | Documentos, CAPA, INMETRO/EX com fonte | Futuro/parcial |
| Knowledge/NAS | Indice oficial, permissao por arquivo, busca auditavel | Futuro/parcial |
| War Room | Status completo de workflows, credenciais, dependencias | Gap documentado em `N8N_PORTAL_WORKFLOW_STATUS_GAP.md` |

## Decisao

O Portal esta pronto como fonte da verdade para Automation Core, Error Audit, Approval Center e Gateway. Os workers AI de dominios especificos nao devem executar acoes finais ate que os endpoints oficiais de cada dominio existam ou estejam documentados como mock/futuro.
