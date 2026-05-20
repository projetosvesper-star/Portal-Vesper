# N8N Ollama Credential Binding Fix

## Credencial detectada

| Nome | Tipo |
| --- | --- |
| Ollama account | `ollamaApi` |

## Ambiente local

O Ollama respondeu em:

```text
http://127.0.0.1:11434
```

Modelos detectados:

- `gemma4:latest`
- `gpt-oss:120b-cloud`

## Compatibilidade local

A instalacao n8n possui nodes:

- `@n8n/n8n-nodes-langchain.lmChatOllama`
- `@n8n/n8n-nodes-langchain.embeddingsOllama`

## Decisao desta etapa

Ollama foi mapeado como fallback local disponivel, mas nao foi embutido nos 12 workflows AI. Nao foi baixado nenhum modelo novo. A camada AI foi ativada com OpenAI primario e segurancas do Portal.

## Proximo passo

Adicionar fallback local por sub-workflow utilitario depois de testar se o container n8n deve acessar Ollama por `host.docker.internal:11434` ou por outra rota de rede.
