# N8N Credentials Required

## Credenciais obrigatorias para ativar a malha AI

| Credencial | Uso | Status |
| --- | --- | --- |
| `openAiApi` / OpenAI API Key Portal Vesper | 12 workflows AI, embeddings em Knowledge/Qualidade | Pendente no n8n para varios workflows |
| `httpBearerAuth` / Portal Vesper API Key | Chamada segura n8n -> Portal | Existente em alguns nodes, validar mapeamento antes de ativar |
| `smtp` | Notificacoes de conclusao por email | Pendente em Compras AI |
| `ollamaApi` | Fallback/local LLM | Existe em workflow extra `My workflow`; nao padronizado nos AI workers |
| Gemini API credential ou HTTP Request credential | Fallback Gemini | Pendente |

## Variaveis recomendadas

```text
DEFAULT_AI_PROVIDER
PRIMARY_AI_PROVIDER
SECONDARY_AI_PROVIDER
LOCAL_AI_PROVIDER
OPENAI_API_KEY
OPENAI_MODEL_FAST
OPENAI_MODEL_REASONING
OPENAI_MODEL_CHEAP
GEMINI_API_KEY
GEMINI_MODEL_FAST
GEMINI_MODEL_REASONING
OLLAMA_BASE_URL
OLLAMA_MODEL_FAST
OLLAMA_MODEL_REASONING
AI_TIMEOUT_SECONDS
AI_MAX_RETRIES
AI_ENABLE_FALLBACK
AI_ENABLE_LOCAL_FALLBACK
VESPER_PORTAL_BASE_URL
VESPER_PORTAL_API_KEY
```

## Regras

- Nenhuma credencial real deve ser salva em JSON exportado.
- Credenciais devem ser configuradas no cofre de credenciais do n8n ou variaveis de ambiente seguras.
- Envio externo por email, Slack, WhatsApp, Telegram ou Teams deve ficar desativado ate revisao humana.
