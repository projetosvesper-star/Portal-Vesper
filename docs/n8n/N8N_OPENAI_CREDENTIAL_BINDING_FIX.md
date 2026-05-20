# N8N OpenAI Credential Binding Fix

## Problema

Alguns workflows AI informavam `Credential not configured: openAiApi`, embora a credencial `OpenAI account` existisse na tela do n8n.

## Causa

Os JSONs importados mantinham referencias antigas como `OpenAI API Key (Portal Vesper)` sem o ID interno atual da credencial. O n8n exige o par correto `id` + `name`.

## Correcao aplicada

Todos os nodes:

- `@n8n/n8n-nodes-langchain.lmChatOpenAi`
- `@n8n/n8n-nodes-langchain.embeddingsOpenAi`

foram vinculados a:

```json
{
  "openAiApi": {
    "id": "2UvgecDOWh3858ZA",
    "name": "OpenAI account"
  }
}
```

O ID e o nome da credencial foram registrados apenas como metadados de n8n. Nenhuma API key foi exibida ou salva em texto puro.

## Resultado

Os erros de `openAiApi` foram resolvidos. Os 12 workflows AI ativaram apos as correcoes estruturais complementares.
