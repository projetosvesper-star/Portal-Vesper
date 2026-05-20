# N8N AI Workflows Structural Fix and Credential Binding - Portal Vesper

## Resumo executivo

A etapa corrigiu os 12 workflows AI que antes nao ativavam no n8n local. O erro `Cannot read properties of undefined (reading 'execute')` foi removido por correcao de tipos LangChain, vinculo correto de credenciais, remocao de notificacoes externas inseguras, substituicao de DataTable local e preenchimento de URLs obrigatorias com endpoints seguros do Portal.

Estado final:

- Workflows totais no n8n: 24
- Workflows ativos: 21
- Workflows AI ativos: 12/12
- Workflows extras/de teste inativos: 3
- Git push: nao executado

## Credenciais usadas

- `OpenAI account`: usada nos nodes OpenAI dos 12 workflows AI.
- `Slack account`: detectada e mapeada onde havia Slack, mas nodes externos inseguros foram removidos/desconectados.
- `Google Gemini(PaLM) Api account`: detectada e documentada para fallback futuro.
- `Ollama account`: detectada e documentada para fallback futuro.

## Correcoes principais

- `n8n-nodes-base.httpRequestTool` -> `@n8n/n8n-nodes-langchain.toolHttpRequest`.
- `openAiApi` vinculado ao ID real de `OpenAI account`.
- `httpBearerAuth` inexistente removido dos AI workflows; headers usam variavel `VESPER_PORTAL_API_KEY`.
- `dataTable` sem tabela substituido por `Set` seguro.
- URLs vazias preenchidas com endpoints seguros do Portal.
- Nodes externos Slack/Gmail/SMTP removidos do grafo ativo.
- Webhook seguro adicionado ao workflow de Compras AI.
- Error Audit preservado via `errorWorkflow`.

## Fallback OpenAI -> Gemini -> Ollama

OpenAI ficou operacional como provider primario dos AI workflows. Gemini e Ollama foram detectados e documentados, mas nao foram embutidos como fallback executavel dentro dos 12 workflows nesta etapa para evitar reescrita grande e risco de regressao. O proximo passo recomendado e criar um sub-workflow utilitario `AI Provider Fallback Router` com testes isolados.

## Go/No-Go

A malha AI nova agora esta estruturalmente ativa e a malha core continua saudavel. Pode avançar para Kanban Fase 3 do Portal, mantendo como pendencia tecnica a implementacao completa do fallback multi-provedor executavel.
