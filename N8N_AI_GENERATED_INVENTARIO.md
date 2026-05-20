# N8N AI Workflows — Inventário Completo
*Gerado em: 2026-05-20 | Portal Vesper / Vent Rio*

## Resumo Executivo

| Métrica | Valor |
|---------|-------|
| Total de workflows AI analisados | 12 |
| Workflows antigos preservados | 11 |
| Total geral na malha n8n (após importação) | 23 |
| Workflows com risco crítico | 5 |
| Workflows com risco alto | 4 |
| Workflows com risco médio | 3 |
| Nenhum usa Google Sheets | ✅ |
| Nenhum usa process.env | ✅ |
| Nenhuma credencial real exposta | ✅ |
| Todos importados como INATIVOS | ✅ |

---

## Workflows Antigos Preservados (11)

| ID | Nome | Status |
|----|------|--------|
| LpsYX0AkHTdZKw7P | CORE - Error Audit Dead Letter | ativo |
| OBlIDpKf6oeiZZhD | Conexão Real - Antigravity Teste | inativo |
| assistente-dev-prompt-01 | Assistente Dev - Prompt Codex Antigravity | inativo |
| k2Ss9Ct4aHKf67cf | COMPRAS - Procure to Pay Agent | ativo |
| THg5NXA3w6kKyFJT | WAR ROOM - Observability | ativo |
| aY5nyRrZ3ugYT6ZH | CORE - Approval Center | ativo |
| x5JL06bbBOhrKUaU | COMERCIAL - Quote to Cash Agent | ativo |
| VkXV7Zjj76l8MABu | PRODUCAO - Kanban OP Agent | ativo |
| IkWAyy2BUsVgN4to | CORE - Gateway Supervisor | ativo |
| IihtDTarCO1U8vly | KNOWLEDGE - RAG Auditoria | ativo |
| 4O6XLSFUB3tK3QOz | INTERNO - Portal Assistant | ativo |

> **IMPORTANTE:** Nenhum workflow antigo foi alterado. Todos preservados intactos.

---

## Novos Workflows AI (12) — Inventário

### 1. PORTAL VESPER - Agente Empresarial Central
- **Arquivo:** `PORTAL VESPER - Agente Empresarial Central.json`
- **Arquivo corrigido:** `AI - PORTAL VESPER - Agente Empresarial Central.json`
- **Trigger:** `chatTrigger` (público, streaming, memória de sessão)
- **Nós:** 19 | **Credenciais originais:** 1
- **Modelo IA:** `gpt-5-mini` → corrigido para `gpt-4o-mini`
- **Aprovação:** `email_sendAndWait` → **convertido para** `/api/automation/approvals`
- **Problemas corrigidos:** 6
- **Bearer Token:** adicionado | **Error Workflow:** configurado | **Correlation ID:** pendente
- **Slack:** desabilitado (sem credencial) | **Google Sheets:** não usa
- **Risco:** `HIGH` | **Decisão:** `import_new_inactive`
- **Objetivo:** Gateway conversacional unificado para todos os módulos empresariais
- **Relação com antigos:** Complementa CORE - Gateway Supervisor (adiciona interface chat)

---

### 2. PORTAL VESPER - Agente Financeiro
- **Arquivo:** `PORTAL VESPER - Agente Financeiro.json`
- **Arquivo corrigido:** `AI - PORTAL VESPER - Agente Financeiro.json`
- **Trigger:** `manualTrigger` + `webhook` POST `/financeiro/documentos`
- **Nós:** ~22 | **Credenciais originais:** 1
- **Modelo IA:** `gpt-5-mini` → corrigido para `gpt-4o-mini`
- **Aprovação:** `wait/form` (72h timeout) para despesas > R$5.000
- **Problemas corrigidos:** 3
- **Bearer Token:** não presente | **Error Workflow:** configurado | **Correlation ID:** pendente
- **Slack:** desabilitado | **Google Sheets:** não usa
- **Risco:** `MEDIUM` | **Decisão:** `import_new_inactive`
- **Objetivo:** Análise de documentos fiscais, aprovação de despesas
- **Relação com antigos:** Módulo novo (sem equivalente nos 9 antigos)
- **APIs necessárias:** `/api/financeiro/*` (não existe no Portal ainda)

---

### 3. PORTAL VESPER - Agente HelpDesk e Controle TI
- **Arquivo:** `PORTAL VESPER - Agente HelpDesk e Controle TI.json`
- **Arquivo corrigido:** `AI - PORTAL VESPER - Agente HelpDesk e Controle TI.json`
- **Trigger:** `chatTrigger` (público, memória de sessão)
- **Nós:** ~18 | **Credenciais originais:** 1
- **Modelo IA:** `gpt-5-mini` → corrigido para `gpt-4o-mini`
- **Aprovação:** Slack + `wait/webhook` (24h) para ações sensíveis de TI
- **Problemas corrigidos:** 4
- **Bearer Token:** presente (ferramentas HTTP) | **Error Workflow:** configurado | **Correlation ID:** pendente
- **Slack:** desabilitado | **Google Sheets:** não usa
- **Risco:** `HIGH` | **Decisão:** `import_new_inactive`
- **Objetivo:** Triagem de chamados, diagnóstico TI, suporte L1/L2
- **Relação com antigos:** Complementa INTERNO - Portal Assistant
- **APIs necessárias:** `/api/helpdesk/*`, `/api/ti/ativos`, `/api/ti/certificados` (não existem)

---

### 4. PORTAL VESPER - Agente de Aprovações e Escalonamento
- **Arquivo:** `PORTAL VESPER - Agente de Aprovações e Escalonamento.json`
- **Arquivo corrigido:** `AI - PORTAL VESPER - Agente de Aprovações e Escalonamento.json`
- **Trigger:** `scheduleTrigger` a cada 1h + diário às 9h
- **Nós:** ~20 | **Credenciais originais:** 1
- **Modelo IA:** `gpt-5-mini` → corrigido para `gpt-4o-mini`
- **Aprovação:** Monitor/escalonador — notifica via Slack mas não gera aprovações
- **Problemas corrigidos:** 4
- **Bearer Token:** não presente (usa httpHeaderAuth) | **Error Workflow:** configurado | **Correlation ID:** pendente
- **Slack:** desabilitado | **Google Sheets:** não usa
- **Risco:** `MEDIUM` | **Decisão:** `import_new_inactive`
- **Objetivo:** Monitorar aprovações pendentes e escalonar via Slack
- **Relação com antigos:** Complementa CORE - Approval Center (adiciona escalonamento automático)
- **APIs necessárias:** `/api/automation/approvals` ✅ (já existe)

---

### 5. PORTAL VESPER - Agente de Arquivos NAS e Conhecimento
- **Arquivo:** `PORTAL VESPER - Agente de Arquivos NAS e Conhecimento.json`
- **Arquivo corrigido:** `AI - PORTAL VESPER - Agente de Arquivos NAS e Conhecimento.json`
- **Trigger:** `chatTrigger` (público, streaming, memória)
- **Nós:** ~16 | **Credenciais originais:** 2 (OpenAI + embeddings)
- **Modelo IA:** `gpt-5-mini` → corrigido para `gpt-4o-mini` + `embeddingsOpenAi`
- **Aprovação:** Nenhuma (apenas avisa restrições de acesso)
- **Problemas corrigidos:** 3
- **Bearer Token:** não presente | **Error Workflow:** configurado | **Correlation ID:** pendente
- **Slack:** não usa | **Google Sheets:** não usa
- **Risco:** `MEDIUM` | **Decisão:** `import_new_inactive`
- **Objetivo:** Busca semântica em arquivos NAS (integração NAS = stub/simulação)
- **Relação com antigos:** Complementa KNOWLEDGE - RAG Auditoria (adiciona NAS)
- **APIs necessárias:** `/api/files/*` ✅ (existe parcialmente: upload/download)
- **ATENÇÃO:** NAS integration é stub — precisa implementação real

---

### 6. PORTAL VESPER - Agente de Compras e Cotações
- **Arquivo:** `PORTAL VESPER - Agente de Compras e Cotações.json`
- **Arquivo corrigido:** `AI - PORTAL VESPER - Agente de Compras e Cotações.json`
- **Trigger:** `manualTrigger`
- **Nós:** ~15 | **Credenciais originais:** 1
- **Modelo IA:** `gpt-5-mini` → corrigido para `gpt-4o-mini`
- **Aprovação:** `email_sendAndWait` (48h) → **convertido para** `/api/automation/approvals`
- **Problemas corrigidos:** 8
- **Bearer Token:** presente (todas as chamadas) | **Error Workflow:** configurado | **Correlation ID:** pendente
- **Slack:** não usa | **Google Sheets:** não usa
- **Risco:** `HIGH` | **Decisão:** `import_new_inactive`
- **Objetivo:** Buscar catálogo, consultar fornecedores, criar cotações
- **Relação com antigos:** Complementa COMPRAS - Procure to Pay Agent (interface mais rica)
- **APIs necessárias:** `/api/compras/*`, `/api/fornecedores/*` (não existem ainda)

---

### 7. PORTAL VESPER - Agente de Estoque e Reposição
- **Arquivo:** `PORTAL VESPER - Agente de Estoque e Reposição.json`
- **Arquivo corrigido:** `AI - PORTAL VESPER - Agente de Estoque e Reposição.json`
- **Trigger:** `scheduleTrigger` a cada 6h
- **Nós:** ~25 | **Credenciais originais:** 1
- **Modelo IA:** `gpt-5-mini` → corrigido para `gpt-4o-mini`
- **Aprovação:** Slack buttons para urgência crítica → desabilitado; cria requisições via API
- **Problemas corrigidos:** 12
- **Bearer Token:** não presente (usa httpHeaderAuth) → corrigido | **Error Workflow:** configurado
- **Slack:** desabilitado | **Google Sheets:** não usa
- **Risco:** `CRITICAL` | **Decisão:** `import_new_inactive`
- **Objetivo:** Monitorar estoque, identificar ruptura, criar requisições de reposição
- **Relação com antigos:** Módulo novo (sem equivalente nos 9 antigos)
- **APIs necessárias:** `/api/estoque/*`, `/api/requisicoes/*` (não existem)

---

### 8. PORTAL VESPER - Agente de Produção OP e Kanban
- **Arquivo:** `PORTAL VESPER - Agente de Produção OP e Kanban.json`
- **Arquivo corrigido:** `AI - PORTAL VESPER - Agente de Produção OP e Kanban.json`
- **Trigger:** `scheduleTrigger` diário 8h + `webhook` POST
- **Nós:** ~20 | **Credenciais originais:** 1
- **Modelo IA:** `gpt-5-mini` → corrigido para `gpt-4o-mini`
- **Aprovação:** `email_sendAndWait` (24h) → **convertido para** `/api/automation/approvals`
- **Problemas corrigidos:** 8
- **Bearer Token:** não presente (usa httpHeaderAuth) → corrigido | **Error Workflow:** configurado
- **Slack:** desabilitado | **Google Sheets:** não usa
- **Risco:** `HIGH` | **Decisão:** `import_new_inactive`
- **Objetivo:** Monitorar OPs, alertar atrasos, registrar comentários
- **Relação com antigos:** Complementa PRODUCAO - Kanban OP Agent (adiciona schedule automático)
- **APIs necessárias:** `/api/kanban/producao/ops` ✅, `/api/kanban/*` ✅ (existem)

---

### 9. PORTAL VESPER - Agente de Propostas Comerciais
- **Arquivo:** `PORTAL VESPER - Agente de Propostas Comerciais.json`
- **Arquivo corrigido:** `AI - PORTAL VESPER - Agente de Propostas Comerciais.json`
- **Trigger:** `webhook` POST `/proposta-comercial` + `manualTrigger`
- **Nós:** ~18 | **Credenciais originais:** 1
- **Modelo IA:** `gpt-5-mini` → corrigido para `gpt-4o-mini`
- **Aprovação:** `wait/form` → mantido (formulário n8n para desconto > 10%)
- **Problemas corrigidos:** 8
- **Bearer Token:** não presente (usa httpHeaderAuth nas ferramentas) → corrigido | **Error Workflow:** configurado
- **Slack:** não usa | **Google Sheets:** não usa
- **Risco:** `HIGH` | **Decisão:** `import_new_inactive`
- **Objetivo:** Gerar propostas comerciais com precificação e certificações
- **Relação com antigos:** Complementa COMERCIAL - Quote to Cash Agent
- **APIs necessárias:** `/api/comercial/*`, `/api/produtos/*` (não existem ainda)

---

### 10. PORTAL VESPER - Agente de Qualidade Auditoria INMETRO e CAPA
- **Arquivo:** `PORTAL VESPER - Agente de Qualidade Auditoria INMETRO e CAPA.json`
- **Arquivo corrigido:** `AI - PORTAL VESPER - Agente de Qualidade Auditoria INMETRO e CAPA.json`
- **Trigger:** `manualTrigger` + `scheduleTrigger` diário 8h + `webhook` POST
- **Nós:** ~25 | **Credenciais originais:** 2 (OpenAI + embeddings)
- **Modelo IA:** `gpt-5-mini` → corrigido para `gpt-4o-mini` + `embeddingsOpenAi`
- **Aprovação:** Slack buttons (sem wait) para severidade alta — desabilitado
- **Problemas corrigidos:** 3
- **Bearer Token:** não presente | **Error Workflow:** configurado (já tinha tratamento de erro)
- **Slack:** desabilitado | **Google Sheets:** não usa | **Google Drive:** usa (credencial pendente)
- **Risco:** `CRITICAL` | **Decisão:** `import_new_inactive`
- **Objetivo:** Auditorias de qualidade, conformidade INMETRO, abertura de CAPA
- **Relação com antigos:** Complementa KNOWLEDGE - RAG Auditoria
- **APIs necessárias:** `/api/qualidade/*`, `/api/capa/*` (não existem)
- **ATENÇÃO:** Usa busca web (Perplexity) e Google Drive — credenciais extras necessárias

---

### 11. PORTAL VESPER - Agente de RH Onboarding e Offboarding
- **Arquivo:** `PORTAL VESPER - Agente de RH Onboarding e Offboarding.json`
- **Arquivo corrigido:** `AI - PORTAL VESPER - Agente de RH Onboarding e Offboarding.json`
- **Trigger:** `webhook` POST (path placeholder)
- **Nós:** ~15 | **Credenciais originais:** 1
- **Modelo IA:** `gpt-5-mini` → corrigido para `gpt-4o-mini`
- **Aprovação:** Slack oAuth2 (passiva, sem wait) para ações críticas — desabilitado
- **Problemas corrigidos:** 4
- **Bearer Token:** presente (chamadas ao Portal) | **Error Workflow:** configurado (já tinha tratamento)
- **Slack:** desabilitado | **Google Sheets:** não usa
- **Risco:** `CRITICAL` | **Decisão:** `import_new_inactive`
- **Objetivo:** Processar onboarding/offboarding de colaboradores, criar/bloquear acessos
- **Relação com antigos:** Módulo novo (sem equivalente nos 9 antigos)
- **APIs necessárias:** `/api/rh/*`, `/api/users/*` ✅ (parcial: existe `/api/admin/users`)
- **ATENÇÃO:** Dados pessoais sensíveis — LGPD deve ser observada

---

### 12. PORTAL VESPER - War Room Executivo
- **Arquivo:** `PORTAL VESPER - War Room Executivo.json`
- **Arquivo corrigido:** `AI - PORTAL VESPER - War Room Executivo.json`
- **Trigger:** `manualTrigger` + `scheduleTrigger` diário às 8h
- **Nós:** ~22 | **Credenciais originais:** 1
- **Modelo IA:** `gpt-5-mini` → corrigido para `gpt-4o-mini`
- **Aprovação:** Nenhuma (apenas leitura e relatório)
- **Problemas corrigidos:** 13
- **Bearer Token:** presente (todas as 10 chamadas HTTP) | **Error Workflow:** configurado
- **Slack:** desabilitado | **Google Sheets:** não usa
- **Risco:** `CRITICAL` | **Decisão:** `import_new_inactive`
- **Objetivo:** Dashboard executivo consolidado de todos os agentes e métricas
- **Relação com antigos:** Complementa WAR ROOM - Observability (adiciona IA e análise)
- **APIs necessárias:** `/api/ia/workflows/status` ✅, `/api/automation/approvals` ✅, `/api/automation/errors` ✅, `/api/automation/dead-letters` ✅, `/api/kanban/producao/ops` ✅

---

## Mapa de Decisões

| Workflow Novo | Ação | Workflow Antigo Relacionado |
|---|---|---|
| Agente Empresarial Central | Complementar | CORE - Gateway Supervisor |
| Agente Financeiro | Novo módulo | — |
| Agente HelpDesk e TI | Complementar | INTERNO - Portal Assistant |
| Agente de Aprovações e Escalonamento | Complementar | CORE - Approval Center |
| Agente de Arquivos e NAS | Complementar | KNOWLEDGE - RAG Auditoria |
| Agente de Compras e Cotações | Complementar | COMPRAS - Procure to Pay Agent |
| Agente de Estoque e Reposição | Novo módulo | — |
| Agente de Produção OP e Kanban | Complementar | PRODUCAO - Kanban OP Agent |
| Agente de Propostas Comerciais | Complementar | COMERCIAL - Quote to Cash Agent |
| Agente de Qualidade/INMETRO/CAPA | Complementar | KNOWLEDGE - RAG Auditoria |
| Agente de RH | Novo módulo | — |
| War Room Executivo | Complementar | WAR ROOM - Observability |
