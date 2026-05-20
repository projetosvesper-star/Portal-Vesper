# N8N AI Model Inventory

Etapa: N8N Enterprise Hardening e Online Sync - Portal Vesper
Data: 2026-05-20

## Resumo

A API local do n8n retornou 24 workflows, nao 23. Os 23 esperados foram analisados e preservados; foi encontrado 1 workflow extra/legado no ambiente local. Nenhum workflow antigo foi apagado.

Estado apos hardening:

- Workflows totais encontrados: 24
- Ativos: 9
- Inativos: 15
- Workflows AI novos revisados: 12
- Workflows AI ativados nesta etapa: 0
- Motivo: o n8n recusou a ativacao por erro estrutural de nodes e credenciais ausentes.

## Modelos encontrados

| Grupo | Modelo antes | Modelo apos hardening | Status |
| --- | --- | --- | --- |
| 12 workflows AI Portal Vesper | `gpt-4o-mini` | `gpt-5-mini` nos nodes OpenAI alterados via API | Atualizado, mas workflows continuam inativos |
| Workflow extra `My workflow` | `gpt-oss:120b-cloud` via Ollama | Sem alteracao | Inativo, preservado |
| Workflows core antigos | Sem LLM direto | Sem alteracao | Preservados |

## Provedores

| Provedor | Estado |
| --- | --- |
| OpenAI | Presente nos 12 workflows AI. Credencial `openAiApi` ainda precisa ser configurada em workflows que falharam na ativacao. |
| Gemini | Nao encontrado como node ativo. Preparado como fallback documentado, pendente de credencial e nodes/HTTP dedicados. |
| Ollama/local | Detectado localmente em `http://127.0.0.1:11434`; modelos listados: `gemma4:latest` e `gpt-oss:120b-cloud`. Nao foi baixado nenhum modelo. |

## Workflows AI revisados

| Workflow | Provedor principal | Fallback real implementado | Status |
| --- | --- | --- | --- |
| AI - PORTAL VESPER - Agente Empresarial Central | OpenAI | Parcial/documentado | Inativo: erro n8n `Cannot read properties of undefined (reading 'execute')` |
| AI - PORTAL VESPER - Agente de Compras e Cotacoes | OpenAI | Parcial/documentado | Inativo: falta `openAiApi` e SMTP |
| AI - PORTAL VESPER - Agente de Propostas Comerciais | OpenAI | Parcial/documentado | Inativo: falta `openAiApi` |
| AI - PORTAL VESPER - Agente de Producao OP e Kanban | OpenAI | Parcial/documentado | Inativo: erro n8n `execute` |
| AI - PORTAL VESPER - Agente HelpDesk e Controle TI | OpenAI | Parcial/documentado | Inativo: erro n8n `execute` |
| AI - PORTAL VESPER - Agente de Arquivos NAS e Conhecimento | OpenAI | Parcial/documentado | Inativo: falta `openAiApi` em modelo e embeddings |
| AI - PORTAL VESPER - Agente RH | OpenAI | Parcial/documentado | Inativo: erro n8n `execute` |
| AI - PORTAL VESPER - Agente Financeiro | OpenAI | Parcial/documentado | Inativo: erro n8n `execute` |
| AI - PORTAL VESPER - Agente Estoque e Reposicao | OpenAI | Parcial/documentado | Inativo: erro n8n `execute` |
| AI - PORTAL VESPER - Agente Qualidade INMETRO e CAPA | OpenAI | Parcial/documentado | Inativo: erro n8n `execute` |
| AI - PORTAL VESPER - Agente de Aprovacoes e Escalonamento | OpenAI | Parcial/documentado | Inativo: erro n8n `execute` |
| AI - PORTAL VESPER - War Room Executivo | OpenAI | Parcial/documentado | Inativo: erro n8n `execute` |

## Conclusao

`gpt-4o-mini` nao permanece como modelo unico obrigatorio nos 12 workflows AI hardenizados. A estrategia multi-provedor foi preparada em documentacao e nos criterios de operacao, mas o fallback OpenAI -> Gemini -> Ollama ainda nao esta totalmente implementado como nodes executaveis porque os workflows AI nao puderam ser ativados pelo n8n local sem corrigir credenciais e erros estruturais.
