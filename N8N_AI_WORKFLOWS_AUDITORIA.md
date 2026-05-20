# N8N AI Workflows — Auditoria Detalhada
*Gerado em: 2026-05-20 13:33:43*

## Critérios de Auditoria
Cada workflow foi auditado contra os 25 critérios da especificação Portal Vesper.

---

## PORTAL VESPER - Agente de Aprovações e Escalonamento

**Arquivo:** `PORTAL VESPER - Agente de Aprovações e Escalonamento.json`
**Risco:** `HIGH`
**Decisão:** `import_new_inactive`

### Problemas (4)
- ❌ URL_PLACEHOLDER: Nó 'Consultar Aprovações Pendentes' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API de aprovações (ex: https://api.vesper.com/v1/ap
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ SEM_BEARER_TOKEN: Chamadas ao Portal sem Authorization Bearer

### Avisos (12)
- ⚠️ CREDENCIAL_GENERICA: 'n8n free OpenAI API credits' deve ser substituída
- ⚠️ USA_SLACK: Nó 'Notificar Vencida' usa Slack (credencial necessária)
- ⚠️ USA_SLACK: Nó 'Escalonar para Gestor' usa Slack (credencial necessária)
- ⚠️ USA_SLACK: Nó 'Notificar Crítica' usa Slack (credencial necessária)
- ⚠️ USA_SLACK: Nó 'Notificar Vencendo' usa Slack (credencial necessária)
- ⚠️ USA_SLACK: Nó 'Notificar Normal' usa Slack (credencial necessária)
- ⚠️ USA_SLACK: Nó 'Enviar Resumo Diário' usa Slack (credencial necessária)
- ⚠️ SEM_ERROR_WORKFLOW: errorWorkflow não configurado
- ⚠️ SEM_CORRELATION_ID: correlation_id não encontrado
- ⚠️ SEM_REQUEST_ID: request_id não encontrado
- ⚠️ SEM_RUNTIME_MODE: runtime_mode não encontrado
- ⚠️ SEM_AUDIT: Não registra auditoria em /api/automation/audit

### Informações
- **Tipos de nós:** `n8n-nodes-base.scheduleTrigger, n8n-nodes-base.httpRequest, n8n-nodes-base.set, @n8n/n8n-nodes-langchain.agent, @n8n/n8n-nodes-langchain.lmChatOpenAi`
- **Credenciais:** `openAiApi: n8n free OpenAI API credits`
- **URLs encontradas:** 2
- **Nós desconectados:** []

---

## PORTAL VESPER - Agente de Arquivos NAS e Conhecimento

**Arquivo:** `PORTAL VESPER - Agente de Arquivos NAS e Conhecimento.json`
**Risco:** `MEDIUM`
**Decisão:** `import_new_inactive`

### Problemas (3)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ SEM_BEARER_TOKEN: Chamadas ao Portal sem Authorization Bearer

### Avisos (7)
- ⚠️ CREDENCIAL_GENERICA: 'n8n free OpenAI API credits' deve ser substituída
- ⚠️ CREDENCIAL_GENERICA: 'n8n free OpenAI API credits' deve ser substituída
- ⚠️ SEM_ERROR_WORKFLOW: errorWorkflow não configurado
- ⚠️ SEM_CORRELATION_ID: correlation_id não encontrado
- ⚠️ SEM_REQUEST_ID: request_id não encontrado
- ⚠️ SEM_RUNTIME_MODE: runtime_mode não encontrado
- ⚠️ SEM_AUDIT: Não registra auditoria em /api/automation/audit

### Informações
- **Tipos de nós:** `@n8n/n8n-nodes-langchain.chatTrigger, @n8n/n8n-nodes-langchain.memoryBufferWindow, @n8n/n8n-nodes-langchain.agent, @n8n/n8n-nodes-langchain.lmChatOpenAi, @n8n/n8n-nodes-langchain.vectorStoreInMemory`
- **Credenciais:** `openAiApi: n8n free OpenAI API credits`
- **URLs encontradas:** 0
- **Nós desconectados:** []

---

## PORTAL VESPER - Agente de Compras e Cotações

**Arquivo:** `PORTAL VESPER - Agente de Compras e Cotações.json`
**Risco:** `CRITICAL`
**Decisão:** `needs_fixes_before_import`

### Problemas (8)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI GPT-5' usa 'gpt-5-mini' (não existe)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI GPT-5' usa 'gpt-5-mini' (não existe)
- ❌ URL_PLACEHOLDER: Nó 'Consultar Catálogo Portal Vesper' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper para catálogo (ex: https://por
- ❌ URL_PLACEHOLDER: Nó 'Buscar Fornecedores Portal Vesper' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper para fornecedores (ex: https:/
- ❌ URL_PLACEHOLDER: Nó 'Solicitar Cotação a Fornecedor' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper para cotações (ex: https://por
- ❌ URL_PLACEHOLDER: Nó 'Verificar Histórico de Compras' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper para histórico (ex: https://po
- ❌ APPROVAL_EMAIL: Nó 'Solicitar Aprovação por Email' usa email sendAndWait - deve usar /api/automation/approvals
- ❌ URL_PLACEHOLDER: Nó 'Atualizar Status no Portal' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper para atualizar rascunho (ex: h

### Avisos (7)
- ⚠️ CREDENCIAL_GENERICA: 'n8n free OpenAI API credits' deve ser substituída
- ⚠️ USA_EMAIL: Nó 'Notificar Conclusão' usa email (SMTP necessário)
- ⚠️ SEM_ERROR_WORKFLOW: errorWorkflow não configurado
- ⚠️ SEM_CORRELATION_ID: correlation_id não encontrado
- ⚠️ SEM_REQUEST_ID: request_id não encontrado
- ⚠️ SEM_RUNTIME_MODE: runtime_mode não encontrado
- ⚠️ SEM_AUDIT: Não registra auditoria em /api/automation/audit

### Informações
- **Tipos de nós:** `n8n-nodes-base.manualTrigger, @n8n/n8n-nodes-langchain.agent, @n8n/n8n-nodes-langchain.lmChatOpenAi, n8n-nodes-base.httpRequestTool, @n8n/n8n-nodes-langchain.toolCalculator`
- **Credenciais:** `openAiApi: n8n free OpenAI API credits`
- **URLs encontradas:** 6
- **Nós desconectados:** []

---

## PORTAL VESPER - Agente de Estoque e Reposição

**Arquivo:** `PORTAL VESPER - Agente de Estoque e Reposição.json`
**Risco:** `CRITICAL`
**Decisão:** `needs_fixes_before_import`

### Problemas (12)
- ❌ URL_PLACEHOLDER: Nó 'Consultar Estoque' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API de Estoque (ex: https://api.vesper.com/estoque)
- ❌ URL_PLACEHOLDER: Nó 'Consultar Ordens de Produção' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API de OPs (ex: https://api.vesper.com/ops)__>
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ URL_PLACEHOLDER: Nó 'Ferramenta Consultar Estoque' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API de Estoque (ex: https://api.vesper.com/estoque/
- ❌ URL_PLACEHOLDER: Nó 'Ferramenta Consultar Fornecedores' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API de Fornecedores (ex: https://api.vesper.com/for
- ❌ URL_PLACEHOLDER: Nó 'Criar Rascunho Crítico' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API de Requisições (ex: https://api.vesper.com/requ
- ❌ URL_PLACEHOLDER: Nó 'Criar Rascunho Alta' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API de Requisições (ex: https://api.vesper.com/requ
- ❌ URL_PLACEHOLDER: Nó 'Criar Rascunho Média' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API de Requisições (ex: https://api.vesper.com/requ
- ❌ URL_PLACEHOLDER: Nó 'Criar Rascunho Baixa' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API de Requisições (ex: https://api.vesper.com/requ
- ❌ URL_PLACEHOLDER: Nó 'Registrar Auditoria' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API de Auditoria (ex: https://api.vesper.com/audito
- ❌ SEM_BEARER_TOKEN: Chamadas ao Portal sem Authorization Bearer

### Avisos (9)
- ⚠️ USA_EMAIL: Nó 'Enviar Relatório' usa email (SMTP necessário)
- ⚠️ CREDENCIAL_GENERICA: 'n8n free OpenAI API credits' deve ser substituída
- ⚠️ USA_SLACK: Nó 'Notificar Aprovação Crítica' usa Slack (credencial necessária)
- ⚠️ USA_EMAIL: Nó 'Notificar Rascunho Alta' usa email (SMTP necessário)
- ⚠️ SEM_ERROR_WORKFLOW: errorWorkflow não configurado
- ⚠️ SEM_CORRELATION_ID: correlation_id não encontrado
- ⚠️ SEM_REQUEST_ID: request_id não encontrado
- ⚠️ SEM_RUNTIME_MODE: runtime_mode não encontrado
- ⚠️ SEM_AUDIT: Não registra auditoria em /api/automation/audit

### Informações
- **Tipos de nós:** `n8n-nodes-base.scheduleTrigger, n8n-nodes-base.httpRequest, n8n-nodes-base.filter, n8n-nodes-base.set, n8n-nodes-base.aggregate`
- **Credenciais:** `openAiApi: n8n free OpenAI API credits`
- **URLs encontradas:** 7
- **Nós desconectados:** []

---

## PORTAL VESPER - Agente de Produção OP e Kanban

**Arquivo:** `PORTAL VESPER - Agente de Produção OP e Kanban.json`
**Risco:** `CRITICAL`
**Decisão:** `needs_fixes_before_import`

### Problemas (8)
- ❌ URL_PLACEHOLDER: Nó 'Consultar OPs Ativas' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper para OPs (ex: https://portal.v
- ❌ URL_PLACEHOLDER: Nó 'Consultar Cards Kanban' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper para Kanban (ex: https://porta
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ APPROVAL_EMAIL: Nó 'Solicitar Aprovação Humana' usa email sendAndWait - deve usar /api/automation/approvals
- ❌ URL_PLACEHOLDER: Nó 'Registrar Comentário Aprovado' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper para comentários (ex: https://
- ❌ URL_PLACEHOLDER: Nó 'Salvar Log de Auditoria' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper para auditoria (ex: https://po
- ❌ SEM_BEARER_TOKEN: Chamadas ao Portal sem Authorization Bearer

### Avisos (10)
- ⚠️ USA_SLACK: Nó 'Alertar Erro de API' usa Slack (credencial necessária)
- ⚠️ CREDENCIAL_GENERICA: 'n8n free OpenAI API credits' deve ser substituída
- ⚠️ USA_SLACK: Nó 'Notificar Slack - Ação Aprovada' usa Slack (credencial necessária)
- ⚠️ USA_SLACK: Nó 'Notificar Slack - Ação Rejeitada' usa Slack (credencial necessária)
- ⚠️ USA_EMAIL: Nó 'Enviar Relatório por Email' usa email (SMTP necessário)
- ⚠️ SEM_ERROR_WORKFLOW: errorWorkflow não configurado
- ⚠️ SEM_CORRELATION_ID: correlation_id não encontrado
- ⚠️ SEM_REQUEST_ID: request_id não encontrado
- ⚠️ SEM_RUNTIME_MODE: runtime_mode não encontrado
- ⚠️ SEM_AUDIT: Não registra auditoria em /api/automation/audit

### Informações
- **Tipos de nós:** `n8n-nodes-base.scheduleTrigger, n8n-nodes-base.httpRequest, n8n-nodes-base.if, n8n-nodes-base.slack, n8n-nodes-base.merge`
- **Credenciais:** `openAiApi: n8n free OpenAI API credits`
- **URLs encontradas:** 5
- **Nós desconectados:** []

---

## PORTAL VESPER - Agente de Propostas Comerciais

**Arquivo:** `PORTAL VESPER - Agente de Propostas Comerciais.json`
**Risco:** `CRITICAL`
**Decisão:** `needs_fixes_before_import`

### Problemas (8)
- ❌ MODELO_INEXISTENTE: Nó 'OpenAI GPT-5' usa 'gpt-5-mini' (não existe)
- ❌ MODELO_INEXISTENTE: Nó 'OpenAI GPT-5' usa 'gpt-5-mini' (não existe)
- ❌ URL_PLACEHOLDER: Nó 'Buscar Dados do Produto' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper para buscar produto (ex: https
- ❌ URL_PLACEHOLDER: Nó 'Buscar Dados do Cliente' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper para buscar cliente (ex: https
- ❌ URL_PLACEHOLDER: Nó 'Buscar Certificações' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper para buscar certificações (ex:
- ❌ URL_PLACEHOLDER: Nó 'Buscar Prazos Técnicos' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper para buscar prazos (ex: https:
- ❌ URL_PLACEHOLDER: Nó 'Registrar Auditoria' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper para auditoria (ex: https://ap
- ❌ SEM_BEARER_TOKEN: Chamadas ao Portal sem Authorization Bearer

### Avisos (6)
- ⚠️ CREDENCIAL_GENERICA: 'n8n free OpenAI API credits' deve ser substituída
- ⚠️ SEM_ERROR_WORKFLOW: errorWorkflow não configurado
- ⚠️ SEM_CORRELATION_ID: correlation_id não encontrado
- ⚠️ SEM_REQUEST_ID: request_id não encontrado
- ⚠️ SEM_RUNTIME_MODE: runtime_mode não encontrado
- ⚠️ SEM_AUDIT: Não registra auditoria em /api/automation/audit

### Informações
- **Tipos de nós:** `n8n-nodes-base.webhook, n8n-nodes-base.set, @n8n/n8n-nodes-langchain.agent, @n8n/n8n-nodes-langchain.lmChatOpenAi, n8n-nodes-base.httpRequestTool`
- **Credenciais:** `openAiApi: n8n free OpenAI API credits`
- **URLs encontradas:** 6
- **Nós desconectados:** []

---

## PORTAL VESPER - Agente de Qualidade Auditoria INMETRO e CAPA

**Arquivo:** `PORTAL VESPER - Agente de Qualidade Auditoria INMETRO e CAPA.json`
**Risco:** `MEDIUM`
**Decisão:** `import_new_inactive`

### Problemas (3)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ SEM_BEARER_TOKEN: Chamadas ao Portal sem Authorization Bearer

### Avisos (9)
- ⚠️ CREDENCIAL_GENERICA: 'n8n free OpenAI API credits' deve ser substituída
- ⚠️ CREDENCIAL_GENERICA: 'n8n free OpenAI API credits' deve ser substituída
- ⚠️ USA_SLACK: Nó 'Notificar Revisão Humana' usa Slack (credencial necessária)
- ⚠️ USA_EMAIL: Nó 'Notificar Erro' usa email (SMTP necessário)
- ⚠️ SEM_ERROR_WORKFLOW: errorWorkflow não configurado
- ⚠️ SEM_CORRELATION_ID: correlation_id não encontrado
- ⚠️ SEM_REQUEST_ID: request_id não encontrado
- ⚠️ SEM_RUNTIME_MODE: runtime_mode não encontrado
- ⚠️ SEM_AUDIT: Não registra auditoria em /api/automation/audit

### Informações
- **Tipos de nós:** `n8n-nodes-base.manualTrigger, n8n-nodes-base.set, n8n-nodes-base.scheduleTrigger, n8n-nodes-base.dataTable, n8n-nodes-base.merge`
- **Credenciais:** `openAiApi: n8n free OpenAI API credits`
- **URLs encontradas:** 0
- **Nós desconectados:** []

---

## PORTAL VESPER - Agente de RH Onboarding e Offboarding

**Arquivo:** `PORTAL VESPER - Agente de RH Onboarding e Offboarding.json`
**Risco:** `HIGH`
**Decisão:** `import_new_inactive`

### Problemas (4)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ URL_PLACEHOLDER: Nó 'Criar Tarefas no Portal' tem URL placeholder: <__PLACEHOLDER_VALUE__https://api.portal-vesper.com/tarefas__>
- ❌ URL_PLACEHOLDER: Nó 'Notificar Colaborador' tem URL placeholder: <__PLACEHOLDER_VALUE__https://api.portal-vesper.com/notificacoes__>

### Avisos (8)
- ⚠️ CREDENCIAL_GENERICA: 'n8n free OpenAI API credits' deve ser substituída
- ⚠️ USA_SLACK: Nó 'Solicitar Aprovação Humana' usa Slack (credencial necessária)
- ⚠️ USA_SLACK: Nó 'Notificar Erro' usa Slack (credencial necessária)
- ⚠️ SEM_ERROR_WORKFLOW: errorWorkflow não configurado
- ⚠️ SEM_CORRELATION_ID: correlation_id não encontrado
- ⚠️ SEM_REQUEST_ID: request_id não encontrado
- ⚠️ SEM_RUNTIME_MODE: runtime_mode não encontrado
- ⚠️ SEM_AUDIT: Não registra auditoria em /api/automation/audit

### Informações
- **Tipos de nós:** `n8n-nodes-base.webhook, @n8n/n8n-nodes-langchain.agent, @n8n/n8n-nodes-langchain.lmChatOpenAi, @n8n/n8n-nodes-langchain.outputParserStructured, n8n-nodes-base.set`
- **Credenciais:** `openAiApi: n8n free OpenAI API credits`
- **URLs encontradas:** 3
- **Nós desconectados:** []

---

## PORTAL VESPER - Agente Empresarial Central

**Arquivo:** `PORTAL VESPER - Agente Empresarial Central.json`
**Risco:** `HIGH`
**Decisão:** `import_new_inactive`

### Problemas (6)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI GPT-5' usa 'gpt-5-mini' (não existe)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI GPT-5' usa 'gpt-5-mini' (não existe)
- ❌ URL_PLACEHOLDER: Nó 'Consulta Portal Vesper' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper (ex: https://portal.vesper.com
- ❌ APPROVAL_EMAIL: Nó 'Solicitar Aprovação por Email' usa email sendAndWait - deve usar /api/automation/approvals
- ❌ URL_PLACEHOLDER: Nó 'Executar Ação Aprovada no Portal' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper (ex: https://portal.vesper.com
- ❌ URL_PLACEHOLDER: Nó 'Executar Ação Direta no Portal' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API do Portal Vesper (ex: https://portal.vesper.com

### Avisos (7)
- ⚠️ CREDENCIAL_GENERICA: 'n8n free OpenAI API credits' deve ser substituída
- ⚠️ USA_SLACK: Nó 'Notificar Slack' usa Slack (credencial necessária)
- ⚠️ SEM_ERROR_WORKFLOW: errorWorkflow não configurado
- ⚠️ SEM_CORRELATION_ID: correlation_id não encontrado
- ⚠️ SEM_REQUEST_ID: request_id não encontrado
- ⚠️ SEM_RUNTIME_MODE: runtime_mode não encontrado
- ⚠️ SEM_AUDIT: Não registra auditoria em /api/automation/audit

### Informações
- **Tipos de nós:** `@n8n/n8n-nodes-langchain.chatTrigger, @n8n/n8n-nodes-langchain.memoryBufferWindow, @n8n/n8n-nodes-langchain.agent, @n8n/n8n-nodes-langchain.lmChatOpenAi, @n8n/n8n-nodes-langchain.toolCalculator`
- **Credenciais:** `openAiApi: n8n free OpenAI API credits`
- **URLs encontradas:** 3
- **Nós desconectados:** []

---

## PORTAL VESPER - Agente Financeiro

**Arquivo:** `PORTAL VESPER - Agente Financeiro.json`
**Risco:** `MEDIUM`
**Decisão:** `import_new_inactive`

### Problemas (3)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ SEM_BEARER_TOKEN: Chamadas ao Portal sem Authorization Bearer

### Avisos (9)
- ⚠️ USA_EMAIL: Nó 'Enviar Relatório Financeiro' usa email (SMTP necessário)
- ⚠️ CREDENCIAL_GENERICA: 'n8n free OpenAI API credits' deve ser substituída
- ⚠️ USA_EMAIL: Nó 'Notificar por Email' usa email (SMTP necessário)
- ⚠️ USA_SLACK: Nó 'Notificar no Slack' usa Slack (credencial necessária)
- ⚠️ SEM_ERROR_WORKFLOW: errorWorkflow não configurado
- ⚠️ SEM_CORRELATION_ID: correlation_id não encontrado
- ⚠️ SEM_REQUEST_ID: request_id não encontrado
- ⚠️ SEM_RUNTIME_MODE: runtime_mode não encontrado
- ⚠️ SEM_AUDIT: Não registra auditoria em /api/automation/audit

### Informações
- **Tipos de nós:** `n8n-nodes-base.manualTrigger, n8n-nodes-base.dataTable, n8n-nodes-base.code, n8n-nodes-base.gmail, n8n-nodes-base.webhook`
- **Credenciais:** `openAiApi: n8n free OpenAI API credits`
- **URLs encontradas:** 0
- **Nós desconectados:** []

---

## PORTAL VESPER - Agente HelpDesk e Controle TI

**Arquivo:** `PORTAL VESPER - Agente HelpDesk e Controle TI.json`
**Risco:** `HIGH`
**Decisão:** `import_new_inactive`

### Problemas (4)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ URL_PLACEHOLDER: Nó 'Consultar Ativos' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API de Ativos (ex: https://api.empresa.com/ativos)_
- ❌ URL_PLACEHOLDER: Nó 'Consultar Certificados' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API de Certificados (ex: https://api.empresa.com/ce

### Avisos (8)
- ⚠️ CREDENCIAL_GENERICA: 'n8n free OpenAI API credits' deve ser substituída
- ⚠️ USA_SLACK: Nó 'Solicitar Aprovação' usa Slack (credencial necessária)
- ⚠️ USA_SLACK: Nó 'Notificar Usuário' usa Slack (credencial necessária)
- ⚠️ SEM_ERROR_WORKFLOW: errorWorkflow não configurado
- ⚠️ SEM_CORRELATION_ID: correlation_id não encontrado
- ⚠️ SEM_REQUEST_ID: request_id não encontrado
- ⚠️ SEM_RUNTIME_MODE: runtime_mode não encontrado
- ⚠️ SEM_AUDIT: Não registra auditoria em /api/automation/audit

### Informações
- **Tipos de nós:** `@n8n/n8n-nodes-langchain.chatTrigger, @n8n/n8n-nodes-langchain.agent, @n8n/n8n-nodes-langchain.lmChatOpenAi, @n8n/n8n-nodes-langchain.memoryBufferWindow, @n8n/n8n-nodes-langchain.outputParserStructured`
- **Credenciais:** `openAiApi: n8n free OpenAI API credits`
- **URLs encontradas:** 3
- **Nós desconectados:** []

---

## PORTAL VESPER - War Room Executivo

**Arquivo:** `PORTAL VESPER - War Room Executivo.json`
**Risco:** `CRITICAL`
**Decisão:** `needs_fixes_before_import`

### Problemas (13)
- ❌ URL_PLACEHOLDER: Nó 'Consulta Saúde Workflows' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API Portal Vesper - Saúde dos Workflows (ex: https:
- ❌ URL_PLACEHOLDER: Nó 'Consulta Aprovações Pendentes' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API Portal Vesper - Aprovações (ex: https://api.ves
- ❌ URL_PLACEHOLDER: Nó 'Consulta Erros Recentes' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API Portal Vesper - Erros (ex: https://api.vesper.c
- ❌ URL_PLACEHOLDER: Nó 'Consulta Dead Letters' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API Portal Vesper - Dead Letters (ex: https://api.v
- ❌ URL_PLACEHOLDER: Nó 'Consulta OPs Atrasadas' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API Portal Vesper - Ordens de Produção (ex: https:/
- ❌ URL_PLACEHOLDER: Nó 'Consulta Kanban' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API Portal Vesper - Kanban (ex: https://api.vesper.
- ❌ URL_PLACEHOLDER: Nó 'Consulta Compras Pendentes' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API Portal Vesper - Compras (ex: https://api.vesper
- ❌ URL_PLACEHOLDER: Nó 'Consulta Propostas Paradas' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API Portal Vesper - Propostas (ex: https://api.vesp
- ❌ URL_PLACEHOLDER: Nó 'Consulta Chamados Críticos' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API Portal Vesper - Chamados (ex: https://api.vespe
- ❌ URL_PLACEHOLDER: Nó 'Consulta Documentos Vencendo' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API Portal Vesper - Documentos (ex: https://api.ves
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ MODELO_INEXISTENTE: Nó 'Modelo OpenAI' usa 'gpt-5-mini' (não existe)
- ❌ URL_PLACEHOLDER: Nó 'Registrar Auditoria' tem URL placeholder: <__PLACEHOLDER_VALUE__URL da API Portal Vesper - Auditoria (ex: https://api.vesp

### Avisos (10)
- ⚠️ CREDENCIAL_GENERICA: 'n8n free OpenAI API credits' deve ser substituída
- ⚠️ USA_SLACK: Nó 'Notificação Crítica - Slack' usa Slack (credencial necessária)
- ⚠️ USA_SLACK: Nó 'Notificação Alta - Slack' usa Slack (credencial necessária)
- ⚠️ USA_EMAIL: Nó 'Notificação Média - Email' usa email (SMTP necessário)
- ⚠️ USA_EMAIL: Nó 'Notificação Baixa - Email' usa email (SMTP necessário)
- ⚠️ SEM_ERROR_WORKFLOW: errorWorkflow não configurado
- ⚠️ SEM_CORRELATION_ID: correlation_id não encontrado
- ⚠️ SEM_REQUEST_ID: request_id não encontrado
- ⚠️ SEM_RUNTIME_MODE: runtime_mode não encontrado
- ⚠️ SEM_AUDIT: Não registra auditoria em /api/automation/audit

### Informações
- **Tipos de nós:** `n8n-nodes-base.manualTrigger, n8n-nodes-base.httpRequest, n8n-nodes-base.merge, n8n-nodes-base.scheduleTrigger, n8n-nodes-base.aggregate`
- **Credenciais:** `openAiApi: n8n free OpenAI API credits`
- **URLs encontradas:** 12
- **Nós desconectados:** []

---
