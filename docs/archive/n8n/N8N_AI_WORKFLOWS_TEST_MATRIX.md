# N8N AI Workflows — Matriz de Testes Mínimos
*Portal Vesper / Vent Rio — 2026-05-20*

> Status: **INATIVOS** — todos os 12 workflows foram importados como inativos.
> Os testes abaixo são a matriz de validação para quando cada workflow for ativado.

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Testado e passou |
| ❌ | Testado e falhou |
| ⏳ | Pendente (workflow inativo) |
| 🚫 | Não se aplica a este workflow |
| ⚠️ | Testado parcialmente / com ressalva |

---

## Matriz de Testes por Workflow

### WF-01 — AI - PORTAL VESPER - Agente Empresarial Central

| Teste | Status | Observação |
|-------|--------|-----------|
| 1. Entrada simples (consulta de estoque) | ⏳ | Workflow inativo |
| 2. Entrada com dados faltando (sem módulo) | ⏳ | Workflow inativo |
| 3. Portal offline — HTTP 404 | ⏳ | Error workflow configurado |
| 4. Ação sensível → requer aprovação | ⏳ | `requer_aprovacao: true` detectado |
| 5. Aprovação via `/api/automation/approvals` | ⏳ | Convertido de email sendAndWait |
| 6. Redaction de segredo na resposta | ⏳ | Sem segredos no payload |
| 7. correlation_id preservado | ⏳ | Não implementado ainda |
| 8. Auditoria registrada | ⏳ | Sem nó de audit no workflow |
| 9. Resposta final controlada | ⏳ | Output parser configurado |
| 10. Nenhuma ação sensível automática | ⏳ | Verificado via `requer_aprovacao` |

---

### WF-02 — AI - PORTAL VESPER - Agente Financeiro

| Teste | Status | Observação |
|-------|--------|-----------|
| 1. Processar documento fiscal simples | ⏳ | Webhook POST /financeiro/documentos |
| 2. Valor < R$5.000 → aprovação automática | ⏳ | Lógica de threshold no workflow |
| 3. Valor > R$5.000 → aguardar aprovação | ⏳ | wait/form 72h configurado |
| 4. API Financeiro inexistente → fallback | ⏳ | Módulo não existe no Portal |
| 5. Portal offline → error handling | ⏳ | Error workflow configurado |
| 6. Pagamento NÃO executado automaticamente | ⏳ | Sempre passa por aprovação |
| 7. Slack desabilitado | ✅ | Nó Slack marcado como disabled |

---

### WF-03 — AI - PORTAL VESPER - Agente HelpDesk e Controle TI

| Teste | Status | Observação |
|-------|--------|-----------|
| 1. Classificar chamado simples | ⏳ | chatTrigger ativo |
| 2. Ação sensível (reset senha) → aprovação | ⏳ | Slack + wait/webhook 24h |
| 3. API de ativos TI inexistente → aviso | ⏳ | URLs em placeholder |
| 4. Portal offline → error handling | ⏳ | Sem error handling implementado |
| 5. Reset de senha NÃO executado sem aprovação | ⏳ | Verificado no fluxo |
| 6. Slack desabilitado | ✅ | Nó Slack marcado como disabled |

---

### WF-04 — AI - PORTAL VESPER - Agente de Aprovações e Escalonamento

| Teste | Status | Observação |
|-------|--------|-----------|
| 1. Trigger agendado consulta `/api/automation/approvals` | ⏳ | Schedule 1h |
| 2. Aprovação pendente > threshold → escalonar | ⏳ | Lógica de escalonamento ativa |
| 3. Bearer token na chamada ao Portal | ⚠️ | httpHeaderAuth → corrigido para Bearer |
| 4. Slack desabilitado | ✅ | Nó Slack marcado como disabled |
| 5. Error workflow configurado | ✅ | CORE - Error Audit Dead Letter |

---

### WF-05 — AI - PORTAL VESPER - Agente de Arquivos NAS e Conhecimento

| Teste | Status | Observação |
|-------|--------|-----------|
| 1. Busca em arquivo por nome | ⏳ | NAS = stub/simulação |
| 2. Controle de permissões de acesso | ⏳ | Lógica implementada no código |
| 3. Arquivo não encontrado → resposta amigável | ⏳ | Output controlado |
| 4. Busca semântica com embeddings | ⏳ | OpenAI Embeddings necessário |
| 5. API RAG inexistente → aviso | ⏳ | Endpoint `/api/rag/search` não existe |
| 6. Nenhuma ação destrutiva | ✅ | Workflow apenas leitura |

---

### WF-06 — AI - PORTAL VESPER - Agente de Compras e Cotações

| Teste | Status | Observação |
|-------|--------|-----------|
| 1. Consultar catálogo de materiais | ⏳ | `/api/compras/materiais` não existe |
| 2. Criar rascunho de cotação | ⏳ | `/api/compras/cotacoes` não existe |
| 3. Compra < R$1.000 → rascunho (sem comprar) | ⏳ | Aprovação obrigatória |
| 4. Compra > R$1.000 → `/api/automation/approvals` | ⏳ | Convertido de email sendAndWait |
| 5. Compra final NÃO executada automaticamente | ⏳ | Sempre passa por aprovação |
| 6. Bearer token em todas as chamadas | ✅ | Corrigido pelo script |
| 7. Error workflow configurado | ✅ | CORE - Error Audit Dead Letter |

---

### WF-07 — AI - PORTAL VESPER - Agente de Estoque e Reposição

| Teste | Status | Observação |
|-------|--------|-----------|
| 1. Trigger agendado (6h) — analisar estoque | ⏳ | `/api/estoque/*` não existe |
| 2. Ruptura identificada → requisição (rascunho) | ⏳ | Não compra automaticamente |
| 3. Urgência crítica → aprovação obrigatória | ⏳ | Slack desabilitado, fluxo parcial |
| 4. Compra NÃO criada automaticamente | ⏳ | Apenas requisição/rascunho |
| 5. Slack desabilitado | ✅ | Nó Slack marcado como disabled |
| 6. Bearer token corrigido | ✅ | httpHeaderAuth → Bearer |
| 7. Error workflow configurado | ✅ | CORE - Error Audit Dead Letter |

---

### WF-08 — AI - PORTAL VESPER - Agente de Produção OP e Kanban

| Teste | Status | Observação |
|-------|--------|-----------|
| 1. Trigger 8h — analisar OPs atrasadas | ⏳ | `/api/kanban/producao/ops` ✅ existe |
| 2. Alerta de OP crítica → aprovação | ⏳ | Convertido de email sendAndWait |
| 3. Comentário em OP → via Portal API | ⏳ | `/api/kanban/cards/{id}/comments` ✅ |
| 4. Alteração crítica de OP → aprovação | ⏳ | Sem alteração automática |
| 5. Webhook sem autenticação | ⚠️ | Pendente — adicionar auth antes de ativar |
| 6. Bearer token corrigido | ✅ | httpHeaderAuth → Bearer |
| 7. Error handling parcial | ⚠️ | `onError: continueErrorOutput` + Slack (desabilitado) |
| 8. Error workflow configurado | ✅ | CORE - Error Audit Dead Letter |

---

### WF-09 — AI - PORTAL VESPER - Agente de Propostas Comerciais

| Teste | Status | Observação |
|-------|--------|-----------|
| 1. Receber solicitação de proposta | ⏳ | Webhook `/proposta-comercial` |
| 2. Gerar proposta com desconto < 10% → automático | ⏳ | wait/form para >= 10% |
| 3. Desconto >= 10% → aprovação humana | ⏳ | wait/form configurado |
| 4. Envio de proposta NÃO automático | ⏳ | Sempre passa por aprovação |
| 5. API Comercial inexistente → aviso | ⏳ | `/api/comercial/*` não existe |
| 6. Bearer token corrigido | ✅ | httpHeaderAuth → Bearer |
| 7. Error workflow configurado | ✅ | CORE - Error Audit Dead Letter |

---

### WF-10 — AI - PORTAL VESPER - Agente de Qualidade Auditoria INMETRO e CAPA

| Teste | Status | Observação |
|-------|--------|-----------|
| 1. Receber solicitação de auditoria | ⏳ | manualTrigger / webhook |
| 2. Severidade alta → aprovação humana | ⏳ | Slack desabilitado — fluxo parcial |
| 3. CAPA gerado sem assinar automaticamente | ⏳ | Apenas rascunho |
| 4. INMETRO NÃO afirmado sem fonte validada | ⏳ | Perplexity busca fontes gov.br |
| 5. Slack desabilitado | ✅ | Nó Slack marcado como disabled |
| 6. Error handling implementado | ✅ | Já existia no workflow original |
| 7. Error workflow configurado | ✅ | CORE - Error Audit Dead Letter |
| 8. Perplexity pendente | ⚠️ | Credencial não configurada |
| 9. Google Drive pendente | ⚠️ | Credencial não configurada |

---

### WF-11 — AI - PORTAL VESPER - Agente de RH Onboarding e Offboarding

| Teste | Status | Observação |
|-------|--------|-----------|
| 1. Onboarding simples → criar checklist | ⏳ | `/api/rh/*` não existe |
| 2. Offboarding → bloquear acesso → aprovação | ⏳ | Sem ação automática |
| 3. Criação de acesso NÃO automática | ⏳ | Slack aprovação (desabilitado) |
| 4. Dados pessoais NÃO expostos no log | ⏳ | Redaction deve ser verificado |
| 5. Reset de senha NÃO executado sem aprovação | ⏳ | Verificado no fluxo |
| 6. Slack desabilitado | ✅ | Nó Slack marcado como disabled |
| 7. Bearer token presente | ✅ | Já existia no workflow original |
| 8. Error handling implementado | ✅ | Já existia no workflow original |
| 9. Error workflow configurado | ✅ | CORE - Error Audit Dead Letter |

---

### WF-12 — AI - PORTAL VESPER - War Room Executivo

| Teste | Status | Observação |
|-------|--------|-----------|
| 1. Trigger manual → gerar resumo executivo | ⏳ | Muitas APIs necessárias |
| 2. `/api/ia/workflows/status` → retorna dados | ⏳ | ✅ existe — testar quando ativo |
| 3. `/api/automation/approvals` → pendentes | ⏳ | ✅ existe — testar quando ativo |
| 4. `/api/automation/errors` → erros recentes | ⏳ | ✅ existe — testar quando ativo |
| 5. API inexistente → aviso (não quebra) | ⏳ | Muitas APIs faltantes |
| 6. Sem ações destrutivas | ✅ | Workflow apenas leitura |
| 7. Bearer token em todas chamadas | ✅ | Já existia + corrigido |
| 8. Slack desabilitado | ✅ | Nó Slack marcado como disabled |
| 9. Error workflow configurado | ✅ | CORE - Error Audit Dead Letter |

---

## Testes de Continuidade (Workflows Antigos)

Verificar que os 11 workflows antigos NÃO foram afetados:

| Teste | Resultado |
|-------|----------|
| `npm run backend:test` (32 testes) | ⏳ Executar |
| `npm run smoke:api` (health + OpenAPI) | ⏳ Executar |
| `python scripts/test_real_integration.py` | ⏳ Executar |
| `npm run e2e` (2 testes Playwright) | ⏳ Executar |
| CORE - Gateway Supervisor ainda ativo | ✅ Verificado via n8n list |
| CORE - Approval Center ainda ativo | ✅ Verificado via n8n list |
| CORE - Error Audit Dead Letter ainda ativo | ✅ Verificado via n8n list |
| COMPRAS - Procure to Pay Agent ainda ativo | ✅ Verificado via n8n list |
| WAR ROOM - Observability ainda ativo | ✅ Verificado via n8n list |
| COMERCIAL - Quote to Cash Agent ainda ativo | ✅ Verificado via n8n list |
| PRODUCAO - Kanban OP Agent ainda ativo | ✅ Verificado via n8n list |
| KNOWLEDGE - RAG Auditoria ainda ativo | ✅ Verificado via n8n list |
| INTERNO - Portal Assistant ainda ativo | ✅ Verificado via n8n list |

---

## Ordem Recomendada de Ativação (quando APIs estiverem prontas)

1. **AI - Agente de Aprovações e Escalonamento** — usa apenas `/api/automation/approvals` (existe)
2. **AI - War Room Executivo** — apenas leitura, APIs Core existem
3. **AI - Agente de Produção OP e Kanban** — `/api/kanban/producao/ops` existe
4. **AI - Agente Empresarial Central** — quando OpenAI configurado
5. **AI - Agente de Compras e Cotações** — quando `/api/compras/*` existir
6. **AI - Agente HelpDesk e Controle TI** — quando `/api/helpdesk/*` existir
7. **AI - Agente de Estoque e Reposição** — quando `/api/estoque/*` existir
8. **AI - Agente de Propostas Comerciais** — quando `/api/comercial/*` existir
9. **AI - Agente de Qualidade/INMETRO/CAPA** — quando credenciais Perplexity e Drive configuradas
10. **AI - Agente de RH** — quando `/api/rh/*` existir + aprovação LGPD
11. **AI - Agente Financeiro** — quando `/api/financeiro/*` existir
12. **AI - Agente de Arquivos NAS** — quando NAS real integrado e RAG endpoint criado
