# N8N Existing Credentials Mapping

## Credenciais detectadas pela API do n8n

| Credential name | Credential type | Used by workflows | Should be used by workflows | Status | Acao |
| --- | --- | --- | --- | --- | --- |
| OpenAI account | `openAiApi` | 12 workflows AI | Todos os Chat Models OpenAI e embeddings OpenAI | Mapeada | Vinculada nos nodes OpenAI corretos |
| Google Gemini(PaLM) Api account | `googlePalmApi` | Nao estava associada aos workflows AI | Fallback secundario Gemini | Detectada | Documentada; nao embutida nos 12 workflows para evitar troca estrutural grande |
| Ollama account | `ollamaApi` | Workflow extra `My workflow` | Fallback local | Detectada | Documentada; nao embutida nos 12 workflows nesta etapa |
| Slack account | `slackOAuth2Api` | Nodes Slack nos AI workflows | Apenas notificacao apos aprovacao e revisao | Detectada | Mapeada onde existia, mas nodes externos inseguros foram removidos/desconectados |

## Observacao

O erro anterior de OpenAI nao significava ausencia de credencial no n8n. A credencial existia, mas os JSONs importados apontavam para nomes/IDs antigos ou vazios. A correcao vinculou `OpenAI account` aos nodes `openAiApi` existentes.
