# N8N OpenAI Setup

## Estado

OpenAI e o provedor principal atual dos workflows AI. O modelo `gpt-4o-mini` foi removido como padrao unico dos 12 workflows AI hardenizados e substituido por `gpt-5-mini` nos nodes OpenAI encontrados.

## Configuracao recomendada

```text
OPENAI_API_KEY=<configurar em credencial segura do n8n>
OPENAI_MODEL_FAST=gpt-5-mini
OPENAI_MODEL_REASONING=<modelo forte aprovado>
OPENAI_MODEL_CHEAP=<modelo barato aprovado>
AI_TIMEOUT_SECONDS=30
AI_MAX_RETRIES=2
```

## Regras de custo

- Usar modelo rapido para classificacao, extracao e roteamento.
- Usar modelo de raciocinio apenas para proposta, qualidade, risco empresarial e decisoes complexas assistidas.
- Nunca executar acao critica automaticamente apenas por IA.

## Pendencias

- Configurar credencial `openAiApi`.
- Validar se os nodes OpenAI da versao local do n8n aceitam variavel/expressao de modelo sem quebrar publicacao.
- Corrigir workflows com erro `Cannot read properties of undefined (reading 'execute')`.
