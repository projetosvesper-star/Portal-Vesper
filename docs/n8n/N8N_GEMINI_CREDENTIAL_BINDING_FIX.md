# N8N Gemini Credential Binding Fix

## Credencial detectada

| Nome | Tipo |
| --- | --- |
| Google Gemini(PaLM) Api account | `googlePalmApi` |

## Compatibilidade local

A instalacao n8n possui node LangChain:

```text
@n8n/n8n-nodes-langchain.lmChatGoogleGemini
```

Esse node usa credencial `googlePalmApi`.

## Decisao desta etapa

A credencial Gemini foi detectada e documentada, mas nao foi inserida diretamente nos 12 workflows AI nesta etapa. Motivo: os workflows falhavam por problemas estruturais de ativacao; a prioridade foi deixa-los publicaveis e seguros sem reescrever todo o grafo AI.

## Proximo passo

Criar um `AI Provider Fallback Router` dedicado ou uma camada de fallback comum usando Gemini como provider secundario, com teste individual de custo, timeout, Error Audit e Approval Center.
