# N8N — Portal API Gap Analysis
*Portal Vesper / Vent Rio — 2026-05-20*

> Análise das APIs necessárias pelos 12 workflows AI vs. endpoints reais disponíveis no Portal Vesper.
> Verificado via `GET http://127.0.0.1:8000/openapi.json`

---

## APIs Existentes (já funcionam)

| Endpoint | Método | Usado por Workflow | Finalidade |
|----------|--------|-------------------|-----------|
| `/api/health` | GET | War Room Executivo | Health check do Portal |
| `/api/auth/login` | POST | Todos (autenticação) | Autenticação JWT |
| `/api/auth/me` | GET | Todos | Dados do usuário logado |
| `/api/ia/gateway` | POST | Agente Empresarial Central | Gateway principal de IA |
| `/api/ia/workflows/status` | GET | War Room Executivo | Status dos workflows n8n |
| `/api/automation/approvals` | POST/GET | Aprovações, Compras, Produção, RH | Criar/listar aprovações |
| `/api/automation/approvals/{id}/respond` | POST | Aprovações e Escalonamento | Responder aprovação |
| `/api/automation/audit` | POST | War Room, Produção, Compras | Registrar auditoria |
| `/api/automation/auditoria/by-correlation/{id}` | GET | War Room Executivo | Timeline por correlation_id |
| `/api/automation/errors` | POST/GET | Todos (error handling) | Registrar/listar erros |
| `/api/automation/dead-letters` | GET | War Room Executivo | Dead letters da fila |
| `/api/automation/events` | POST/GET | Todos | Registrar eventos |
| `/api/kanban/boards` | GET/POST | Produção OP e Kanban | Listar/criar boards |
| `/api/kanban/cards` | GET/POST | Produção OP e Kanban | Listar/criar cards |
| `/api/kanban/cards/{id}/move` | POST | Produção OP e Kanban | Mover card entre colunas |
| `/api/kanban/cards/{id}/comments` | POST | Produção OP e Kanban | Comentar em card |
| `/api/kanban/producao/ops` | GET/POST | Produção OP e Kanban | Listar/criar OPs |
| `/api/kanban/producao/ops/{id}` | GET/PATCH | Produção OP e Kanban | Detalhes/atualizar OP |
| `/api/kanban/producao/ops/{id}/checklist` | GET | Produção OP e Kanban | Checklist da OP |
| `/api/kanban/producao/dashboard` | GET | War Room Executivo | Dashboard de produção |
| `/api/admin/users` | GET | RH Onboarding | Listar usuários (admin) |
| `/api/admin/users/{id}` | PATCH | RH Onboarding | Atualizar status usuário |
| `/api/files/upload` | POST | Arquivos NAS e Conhecimento | Upload de arquivo |
| `/api/files/{id}` | GET | Arquivos NAS e Conhecimento | Download de arquivo |
| `/api/notifications` | GET/POST | RH, HelpDesk | Notificações do Portal |
| `/api/me` | GET | Todos | Perfil do usuário atual |
| `/api/users/lookup` | GET | RH, HelpDesk | Buscar usuário por ID |
| `/api/users/search` | GET | RH, HelpDesk | Buscar usuários |

**Total de endpoints existentes e usáveis: 27**

---

## APIs Parcialmente Existentes

| Endpoint necessário | Endpoint atual | Gap | Workflow que usa |
|--------------------|---------------|-----|-----------------|
| `/api/kanban/producao/ops` — alertar por atraso | Existe, mas sem filtro `status=atrasado` | Adicionar filtro de query | Produção OP e Kanban |
| `/api/automation/approvals` — metadados de escalonamento | Existe, mas sem campo `escalado_em` | Adicionar campo de escalonamento | Aprovações e Escalonamento |
| `/api/files/*` — busca semântica em arquivos | Existe apenas upload/download, sem busca vetorial | RAG real requer endpoint de busca semântica | Arquivos NAS e Conhecimento |

---

## APIs Inexistentes (endpoints futuros necessários)

### Módulo Financeiro
| Endpoint | Método | Workflow | Finalidade | Prioridade |
|----------|--------|---------|-----------|-----------|
| `/api/financeiro/contas-pagar` | GET | Agente Financeiro | Listar contas a pagar | Alta |
| `/api/financeiro/contas-receber` | GET | Agente Financeiro | Listar contas a receber | Alta |
| `/api/financeiro/documentos` | POST | Agente Financeiro | Registrar documento fiscal | Alta |
| `/api/financeiro/fluxo-caixa` | GET | War Room Executivo | Dashboard financeiro | Média |
| `/api/financeiro/aprovacoes` | POST | Agente Financeiro | Aprovar despesa financeira | Alta |

### Módulo Compras / Fornecedores
| Endpoint | Método | Workflow | Finalidade | Prioridade |
|----------|--------|---------|-----------|-----------|
| `/api/compras/materiais` | GET | Compras e Cotações | Catálogo de materiais | Alta |
| `/api/compras/cotacoes` | GET/POST | Compras e Cotações | Criar/listar cotações | Alta |
| `/api/compras/pedidos` | POST | Compras e Cotações | Criar pedido de compra | Alta |
| `/api/fornecedores` | GET | Compras e Cotações | Listar fornecedores | Alta |
| `/api/compras/historico` | GET | War Room Executivo | Histórico de compras | Média |

### Módulo HelpDesk / TI
| Endpoint | Método | Workflow | Finalidade | Prioridade |
|----------|--------|---------|-----------|-----------|
| `/api/helpdesk/chamados` | GET/POST | HelpDesk e TI | Listar/criar chamados | Alta |
| `/api/helpdesk/chamados/{id}` | PATCH | HelpDesk e TI | Atualizar chamado | Alta |
| `/api/ti/ativos` | GET | HelpDesk e TI | Inventário de ativos TI | Média |
| `/api/ti/certificados` | GET | HelpDesk e TI | Certificados de segurança | Baixa |

### Módulo Estoque
| Endpoint | Método | Workflow | Finalidade | Prioridade |
|----------|--------|---------|-----------|-----------|
| `/api/estoque/produtos` | GET | Estoque e Reposição | Listar produtos em estoque | Alta |
| `/api/estoque/movimentacoes` | GET/POST | Estoque e Reposição | Registrar movimentação | Alta |
| `/api/estoque/alertas-ruptura` | GET | Estoque e Reposição | Alertas de ruptura | Alta |
| `/api/estoque/requisicoes` | POST | Estoque e Reposição | Criar requisição de reposição | Alta |

### Módulo Comercial / Propostas
| Endpoint | Método | Workflow | Finalidade | Prioridade |
|----------|--------|---------|-----------|-----------|
| `/api/comercial/propostas` | GET/POST | Propostas Comerciais | Criar/listar propostas | Alta |
| `/api/comercial/clientes` | GET | Propostas Comerciais | Dados de clientes | Alta |
| `/api/comercial/produtos` | GET | Propostas Comerciais | Produtos/preços | Alta |
| `/api/comercial/certificacoes` | GET | Propostas Comerciais | Certificações disponíveis | Média |

### Módulo RH
| Endpoint | Método | Workflow | Finalidade | Prioridade |
|----------|--------|---------|-----------|-----------|
| `/api/rh/colaboradores` | GET/POST | RH Onboarding | Listar/criar colaboradores | Alta |
| `/api/rh/onboarding` | POST | RH Onboarding | Iniciar processo onboarding | Alta |
| `/api/rh/offboarding` | POST | RH Onboarding | Iniciar processo offboarding | Alta |
| `/api/rh/ferias` | GET | RH Onboarding | Saldos e solicitações de férias | Baixa |

### Módulo Qualidade
| Endpoint | Método | Workflow | Finalidade | Prioridade |
|----------|--------|---------|-----------|-----------|
| `/api/qualidade/auditorias` | GET/POST | Qualidade INMETRO | Listar/criar auditorias | Alta |
| `/api/qualidade/capa` | POST | Qualidade INMETRO | Abrir CAPA (Ação Corretiva) | Alta |
| `/api/qualidade/inspecoes` | GET | Qualidade INMETRO | Inspeções de qualidade | Média |
| `/api/qualidade/normas` | GET | Qualidade INMETRO | Base de normas INMETRO | Baixa |

### Busca Semântica (RAG)
| Endpoint | Método | Workflow | Finalidade | Prioridade |
|----------|--------|---------|-----------|-----------|
| `/api/rag/search` | POST | Arquivos NAS e Conhecimento | Busca semântica em documentos | Alta |
| `/api/rag/index` | POST | Arquivos NAS e Conhecimento | Indexar documento para RAG | Alta |

---

## Resumo do Gap Analysis

| Categoria | Endpoints existentes | Parcialmente existentes | Faltando |
|-----------|---------------------|------------------------|---------|
| Core / Auth | 8 | 0 | 0 |
| Automation Core | 8 | 1 | 0 |
| Kanban / Produção | 11 | 1 | 0 |
| Financeiro | 0 | 0 | 5 |
| Compras | 0 | 0 | 5 |
| HelpDesk / TI | 0 | 0 | 4 |
| Estoque | 0 | 0 | 4 |
| Comercial | 0 | 0 | 4 |
| RH | 1 (admin/users) | 0 | 4 |
| Qualidade | 0 | 0 | 4 |
| Arquivos / RAG | 2 | 1 | 2 |
| **TOTAL** | **30** | **3** | **32** |

---

## Estratégia para Endpoints Faltantes

Enquanto os módulos não existem no Portal:

1. **Workflows importados como INATIVOS** — não tentam chamar APIs inexistentes
2. **Mock temporário opcional** — podem ser criados endpoints mock em FastAPI que retornam dados estáticos para testes
3. **Documentação de contrato** — cada endpoint listado acima serve como contrato/especificação para o desenvolvimento futuro dos módulos
4. **Priorização sugerida:** Compras → HelpDesk → Estoque → Qualidade → Financeiro → Comercial → RH
