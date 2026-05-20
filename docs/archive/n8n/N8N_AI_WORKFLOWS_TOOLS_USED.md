# N8N AI Workflows — Ferramentas e Tecnologias Utilizadas
*Portal Vesper / Vent Rio — 2026-05-20*

## Ferramentas Utilizadas Nesta Implementação

### Análise e Auditoria
| Ferramenta | Versão | Uso |
|------------|--------|-----|
| Python | 3.14 | Script de auditoria e correção (`scripts/audit_n8n_workflows.py`) |
| json (stdlib) | — | Leitura/escrita dos arquivos JSON dos workflows |
| re (stdlib) | — | Detecção de placeholders, URLs suspeitas, segredos hardcoded |
| copy (stdlib) | — | Deep copy dos workflows para não modificar o original |
| pathlib (stdlib) | — | Manipulação de caminhos de arquivo cross-platform |
| PowerShell | 5.x | Comandos de gerenciamento Docker e verificações |
| Docker CLI | 27.x | Gerenciamento do container n8n |

### n8n
| Ferramenta | Versão | Uso |
|------------|--------|-----|
| n8n | latest (Docker) | Plataforma de automação — motor de workflows |
| n8n CLI | incluído | `n8n list:workflow`, `n8n export:workflow`, `n8n import:workflow` |
| `docker cp` | — | Transferência de arquivos entre host e container n8n |
| `docker exec` | — | Execução de comandos dentro do container n8n |

### Portal Vesper Backend
| Ferramenta | Versão | Uso |
|------------|--------|-----|
| FastAPI | 0.11x | Backend do Portal Vesper |
| Python | 3.12 | Runtime do backend |
| OpenAPI / Swagger | 3.x | Verificação dos endpoints disponíveis (`/openapi.json`) |
| PostgreSQL | 15 | Banco de dados do Portal e do n8n |
| Redis | 7 | Cache e fila de execuções n8n |

### Tipos de Nós n8n Encontrados nos 12 Workflows

| Nó n8n | Tipo | Presente em |
|--------|------|------------|
| `@n8n/n8n-nodes-langchain.chatTrigger` | Trigger | Empresarial, HelpDesk, Arquivos NAS |
| `@n8n/n8n-nodes-langchain.agent` | AI Agent | Todos os 12 |
| `@n8n/n8n-nodes-langchain.lmChatOpenAi` | LLM | Todos os 12 |
| `@n8n/n8n-nodes-langchain.memoryBufferWindow` | Memória | Empresarial, HelpDesk, Arquivos NAS |
| `@n8n/n8n-nodes-langchain.outputParserStructured` | Output Parser | Todos os 12 |
| `@n8n/n8n-nodes-langchain.embeddingsOpenAi` | Embeddings | Arquivos NAS, Qualidade |
| `@n8n/n8n-nodes-langchain.vectorStoreInMemory` | Vector Store | Arquivos NAS, Qualidade |
| `@n8n/n8n-nodes-langchain.toolCode` | Code Tool | Arquivos NAS, Empresarial |
| `@n8n/n8n-nodes-langchain.toolCalculator` | Calculadora | Empresarial, Compras |
| `@n8n/n8n-nodes-langchain.httpRequestTool` | HTTP Tool | Empresarial, Compras, Propostas |
| `n8n-nodes-base.httpRequest` | HTTP | Todos os 12 |
| `n8n-nodes-base.webhook` | Webhook Trigger | Financeiro, Propostas, Qualidade, RH, Produção |
| `n8n-nodes-base.scheduleTrigger` | Schedule Trigger | Aprovações, Estoque, Produção, War Room, Qualidade |
| `n8n-nodes-base.manualTrigger` | Manual Trigger | Compras, Financeiro, Qualidade, War Room |
| `n8n-nodes-base.set` | Set | Todos os 12 |
| `n8n-nodes-base.if` | Condição | Todos os 12 |
| `n8n-nodes-base.switch` | Switch | Aprovações, War Room, Estoque |
| `n8n-nodes-base.merge` | Merge | Todos os 12 |
| `n8n-nodes-base.aggregate` | Aggregate | Aprovações, War Room, Estoque |
| `n8n-nodes-base.filter` | Filter | Estoque, Produção |
| `n8n-nodes-base.code` | Code (JS) | Arquivos NAS, Qualidade, Produção |
| `n8n-nodes-base.emailSend` | Email | Financeiro, Compras, Produção, Qualidade |
| `n8n-nodes-base.wait` | Wait | Financeiro, Propostas, HelpDesk |
| `n8n-nodes-base.slack` | Slack | Financeiro, HelpDesk, Aprovações, Estoque, Produção, Qualidade, RH, War Room |
| `n8n-nodes-base.dataTable` | DataTable | Financeiro, HelpDesk, Aprovações, Arquivos, RH, Qualidade |
| `n8n-nodes-base.respondToWebhook` | Respond | Propostas, RH, Produção |
| `n8n-nodes-base.splitInBatches` | Batches | Estoque |
| `n8n-nodes-base.extractFromFile` | Extract File | Financeiro |
| `n8n-nodes-base.gmail` | Gmail | Financeiro, Qualidade |
| `n8n-nodes-base.stickyNote` | Sticky Note | Vários |

### Ferramentas Externas (Pendentes de Configuração)

| Serviço | Nó n8n | Workflows que usam | Credencial necessária |
|---------|--------|-------------------|----------------------|
| OpenAI GPT-4o-mini | `lmChatOpenAi` | Todos os 12 | `OpenAI API Key (Portal Vesper)` |
| OpenAI Embeddings | `embeddingsOpenAi` | Arquivos NAS, Qualidade | mesma API Key |
| Google Gemini | `lmGemini` (fallback) | Nenhum ativo | `Gemini API Key (Portal Vesper)` |
| Ollama | `lmOllama` (fallback) | Nenhum ativo | `Ollama Local (Portal Vesper)` |
| Slack | `slack` | 8 workflows | `Slack API (Portal Vesper)` — nós desabilitados |
| Gmail / SMTP | `emailSend`, `gmail` | Financeiro, Produção, Qualidade | `SMTP (Portal Vesper)` |
| Perplexity AI | `perplexityTool` | Qualidade INMETRO | `Perplexity API (Portal Vesper)` |
| Google Drive | `googleDriveTool` | Qualidade INMETRO | `Google Drive (Portal Vesper)` |

---

## Arquivos Criados nesta Integração

| Arquivo | Localização | Finalidade |
|---------|-------------|-----------|
| `audit_n8n_workflows.py` | `scripts/` | Script de auditoria e correção dos JSONs |
| `n8n_workflows_backup.json` | `N8N_BACKUP_BEFORE_AI_IMPORT/` | Backup dos 11 workflows antigos |
| `N8N_READY_TO_IMPORT/*.json` | `N8N_READY_TO_IMPORT/` | 12 JSONs corrigidos e padronizados |
| `N8N_AI_GENERATED_INVENTARIO.md` | raiz do projeto | Inventário completo dos workflows |
| `N8N_AI_WORKFLOWS_AUDITORIA.md` | raiz do projeto | Auditoria detalhada automática |
| `N8N_CREDENCIAIS_E_PROVEDORES_IA.md` | raiz do projeto | Guia de fallback de IA e credenciais |
| `N8N_CREDENCIAIS_PENDENTES.md` | raiz do projeto | Lista de credenciais a configurar |
| `N8N_PORTAL_API_GAP_ANALYSIS.md` | raiz do projeto | Análise de gap de APIs |
| `N8N_AI_WORKFLOWS_TEST_MATRIX.md` | raiz do projeto | Matriz de testes por workflow |
| `N8N_AI_WORKFLOWS_TOOLS_USED.md` | raiz do projeto | Este arquivo |
| `N8N_AI_GENERATED_WORKFLOWS_INTEGRATION_REPORT.md` | raiz do projeto | Relatório final consolidado |

---

## Correções Automáticas Aplicadas pelo Script

| Correção | Workflows afetados | Método |
|----------|--------------------|--------|
| `gpt-5-mini` → `gpt-4o-mini` | Todos os 12 | Substituição no campo `model.value` |
| Credencial `n8n free OpenAI API credits` → `OpenAI API Key (Portal Vesper)` | Todos os 12 | Substituição no campo `credentials.*.name` |
| URL placeholder → `http://host.docker.internal:8000/api` | Compras, Propostas, Produção, War Room + outros | regex substituição |
| `portal.vesper.com` → `host.docker.internal:8000` | Compras, Propostas | regex substituição |
| `email sendAndWait` → `POST /api/automation/approvals` | Empresarial, Compras, Produção | Transformação de nó completa |
| Nó Slack → `disabled: true` | 8 workflows | Flag `disabled` adicionada |
| `settings.errorWorkflow` → `LpsYX0AkHTdZKw7P` | Todos os 12 | Campo settings adicionado |
| `active: false` | Todos os 12 | Flag `active` forçada |
| `httpHeaderAuth` HTTP Requests → `httpBearerAuth` + credencial Portal | Compras, Estoque, Produção, Propostas | Tipo de autenticação substituído |
| Prefixo `AI - ` no nome do workflow | Todos os 12 | Renomeação para diferenciar dos antigos |
| ID da credencial OpenAI → `""` | Todos os 12 | ID zerado para forçar reconfiguração |
