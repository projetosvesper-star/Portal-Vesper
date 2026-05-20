# N8N AI Workflow Execute Error Root Cause

## Erro investigado

```text
Cannot read properties of undefined (reading 'execute')
```

## Causas encontradas

O erro nao tinha uma unica causa. Ele era resultado de workflows importados com schema gerado por AI Builder incompatível com a instalacao local do n8n.

Principais causas:

1. Tipo de node incorreto: `n8n-nodes-base.httpRequestTool`.
   - Tipo instalado correto: `@n8n/n8n-nodes-langchain.toolHttpRequest`.
2. Nodes externos de notificacao desativados ainda conectados ao grafo principal.
   - Isso continuava afetando a validacao/publicacao.
3. Nodes `dataTable` sem `dataTableId`.
   - Substituidos por `Set` seguro para manter Portal Vesper como fonte oficial.
4. HTTP Request com `url` vazia.
   - Preenchidos com endpoints seguros do Portal para permitir validacao.
5. Workflow de Compras AI sem trigger real.
   - Adicionado webhook seguro.
6. Nodes externos especificos, como `perplexityTool` e `googleDriveTool`, sem equivalencia instalada com aquele nome.
   - Substituidos por placeholder seguro `toolCode` quando necessario.

## Resultado por workflow

| Workflow AI | Causa principal | Correcao | Ativou |
| --- | --- | --- | --- |
| Agente Empresarial Central | HTTP tool incorreto e Slack no grafo | Tipo corrigido, OpenAI vinculado, Slack removido | Sim |
| Compras e Cotacoes | Sem trigger, HTTP tools, DataTable, SMTP | Webhook adicionado, HTTP tool corrigido, DataTable substituido, email removido | Sim |
| Propostas Comerciais | HTTP tools e OpenAI sem ID atual | HTTP tool corrigido, OpenAI vinculado | Sim |
| Producao OP e Kanban | Notificacoes externas e URLs/credenciais | OpenAI vinculado, notificacoes removidas, Portal seguro | Sim |
| HelpDesk e Controle TI | DataTable, URLs vazias e Slack | DataTable substituido, URLs preenchidas, Slack removido | Sim |
| Arquivos NAS e Conhecimento | OpenAI e embeddings sem ID atual | OpenAI vinculado | Sim |
| RH Onboarding/Offboarding | DataTable, URLs vazias e Slack | DataTable substituido, URLs preenchidas, Slack removido | Sim |
| Financeiro | DataTable sem ID e notificacoes externas | DataTable substituido, notificacoes removidas | Sim |
| Estoque e Reposicao | URLs vazias, HTTP tool, notificacoes | URLs seguras, HTTP tool corrigido, notificacoes removidas | Sim |
| Qualidade INMETRO/CAPA | Ferramentas externas incompatíveis e notificacoes | Placeholders seguros, OpenAI vinculado, notificacoes removidas | Sim |
| Aprovacoes e Escalonamento | URLs vazias, DataTable, Slack | URLs seguras, DataTable substituido, Slack removido | Sim |
| War Room Executivo | URLs vazias e notificacoes externas | URLs seguras, notificacoes removidas | Sim |
