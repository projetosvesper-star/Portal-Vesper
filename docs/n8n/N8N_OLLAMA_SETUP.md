# N8N Ollama Setup

## Deteccao local

O endpoint local respondeu:

```text
http://127.0.0.1:11434/api/tags
```

Modelos encontrados:

- `gemma4:latest`
- `gpt-oss:120b-cloud`

Nenhum modelo foi baixado nesta etapa.

## Configuracao recomendada

```text
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL_FAST=gemma4:latest
OLLAMA_MODEL_REASONING=gpt-oss:120b-cloud
AI_ENABLE_LOCAL_FALLBACK=true
```

## Uso recomendado

- Classificacao simples.
- Resumo interno.
- Rascunhos sem dados sensiveis externos.
- Fallback quando OpenAI/Gemini falharem.

## Limitacoes

- Validar desempenho local antes de ativar em producao.
- Nao assumir que o modelo existe em outra maquina.
- Nao usar resposta local para acao sensivel sem Approval Center.
