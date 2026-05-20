# N8N AI Structural Fix Checkpoint

Etapa: N8N AI Workflows Structural Fix and Credential Binding - Portal Vesper

Data: 2026-05-20

## Estado inicial

- Branch: `main`
- Workflows encontrados no n8n local: 24
- Workflows ativos antes da correcao estrutural: 9
- Workflows inativos antes da correcao estrutural: 15
- Workflows AI analisados: 12
- Erro principal anterior: `Cannot read properties of undefined (reading 'execute')`
- Outros erros anteriores: `openAiApi` ausente, SMTP ausente, workflows sem trigger real, URLs vazias e DataTable sem `dataTableId`.

## Backup

Backup exportado antes de qualquer alteracao desta etapa:

```text
N8N_BACKUP_BEFORE_AI_STRUCTURAL_FIX/
```

O backup inclui:

- `_api_workflows_index.json`
- `_api_credentials_index_sanitized.json`
- JSON individual de cada workflow

## Credenciais existentes detectadas

| Nome | Tipo n8n | Uso |
| --- | --- | --- |
| OpenAI account | `openAiApi` | Chat Model e embeddings OpenAI |
| Google Gemini(PaLM) Api account | `googlePalmApi` | Fallback Gemini pendente |
| Ollama account | `ollamaApi` | Fallback local pendente |
| Slack account | `slackOAuth2Api` | Mapeado, mas notificacoes externas continuam bloqueadas/desconectadas quando sensiveis |

Nenhum segredo foi impresso ou gravado.

## Decisao de seguranca

Os workflows AI foram corrigidos sem substituir os workflows core/legados. Acoes finais sensiveis continuam dependentes de Approval Center. Nodes externos de notificacao foram removidos do grafo ativo quando poderiam bloquear ativacao ou enviar algo fora do Portal.
