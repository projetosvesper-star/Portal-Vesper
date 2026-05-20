# N8N Model Upgrade Report

## Resumo

Os 12 workflows AI importados foram atualizados via API do n8n para remover a dependencia operacional de `gpt-4o-mini` como padrao unico. O modelo foi substituido por `gpt-5-mini` nos nodes OpenAI encontrados. A troca foi conservadora para nao inventar modelo nao suportado por node e nao inserir chave real em JSON.

## Alteracoes aplicadas

| Item | Resultado |
| --- | --- |
| Workflows AI analisados | 12 |
| Substituicoes de modelo | 12 |
| Modelo antigo | `gpt-4o-mini` |
| Modelo novo nos nodes | `gpt-5-mini` |
| Variaveis/credenciais reais gravadas | Nenhuma |
| Ativacao apos troca | Falhou em todos os 12 por bloqueios do n8n/credenciais |

## Estrategia recomendada

| Camada | Configuracao recomendada |
| --- | --- |
| Rapida/barata | `OPENAI_MODEL_FAST`, `GEMINI_MODEL_FAST`, `OLLAMA_MODEL_FAST` |
| Raciocinio | `OPENAI_MODEL_REASONING`, `GEMINI_MODEL_REASONING`, `OLLAMA_MODEL_REASONING` |
| Local/privada | `OLLAMA_BASE_URL`, `OLLAMA_MODEL_FAST`, `OLLAMA_MODEL_REASONING` |
| Controle | `AI_TIMEOUT_SECONDS`, `AI_MAX_RETRIES`, `AI_ENABLE_FALLBACK`, `AI_ENABLE_LOCAL_FALLBACK` |

## Pendencias

- Configurar credencial OpenAI no n8n para os nodes que exigem `openAiApi`.
- Criar credencial Gemini ou HTTP Request equivalente antes de usar Gemini como fallback real.
- Definir se o n8n local aceita modelo via expressao/variavel no node OpenAI sem quebrar a publicacao.
- Implementar fallback executavel por provider depois de corrigir os workflows AI que falham com `Cannot read properties of undefined (reading 'execute')`.

## Decisao

A mudanca de modelo foi aplicada, mas a malha AI nova ainda nao esta online. Nao houve tentativa de contornar validacao do n8n nem de ativar workflow inseguro.
