# Portal Vesper n8n Workflows

Esta pasta contem os workflows finais sanitizados do n8n para o Portal Vesper / Vent Rio.

## Estado validado

- Workflows encontrados no n8n local: 24
- Workflows ativos: 21
- Workflows AI ativos: 12/12
- Workflows core/legados preservados: 9
- Workflows extras/teste inativos: 3

## Estrutura

```text
N8N/
  workflows/
    ai/        Workflows AI ativos
    core/      Gateway Supervisor, Approval Center, Error Audit e War Room base
    legacy/    Trabalhadores legados validados
    inactive/  Workflows extras/teste preservados, mas fora da malha empresarial
```

## Workflows core

- `CORE - Gateway Supervisor`
- `CORE - Approval Center`
- `CORE - Error Audit Dead Letter`
- `WAR ROOM - Observability`

## Workers legados

- `COMPRAS - Procure to Pay Agent`
- `COMERCIAL - Quote to Cash Agent`
- `PRODUCAO - Kanban OP Agent`
- `KNOWLEDGE - RAG Auditoria`
- `INTERNO - Portal Assistant`

## Workflows AI

- `AI - PORTAL VESPER - Agente Empresarial Central`
- `AI - PORTAL VESPER - Agente de Compras e Cotações`
- `AI - PORTAL VESPER - Agente de Propostas Comerciais`
- `AI - PORTAL VESPER - Agente de Produção OP e Kanban`
- `AI - PORTAL VESPER - Agente HelpDesk e Controle TI`
- `AI - PORTAL VESPER - Agente de Arquivos NAS e Conhecimento`
- `AI - PORTAL VESPER - Agente de RH Onboarding e Offboarding`
- `AI - PORTAL VESPER - Agente Financeiro`
- `AI - PORTAL VESPER - Agente de Estoque e Reposição`
- `AI - PORTAL VESPER - Agente de Qualidade Auditoria INMETRO e CAPA`
- `AI - PORTAL VESPER - Agente de Aprovações e Escalonamento`
- `AI - PORTAL VESPER - War Room Executivo`

## Credenciais necessárias no n8n

Configure as credenciais no cofre do n8n. Não salve segredos nos JSONs.

- `OpenAI account` (`openAiApi`)
- `Google Gemini(PaLM) Api account` (`googlePalmApi`) para fallback futuro
- `Ollama account` (`ollamaApi`) para fallback local futuro
- `Slack account` (`slackOAuth2Api`) somente para notificações aprovadas e revisadas

Também configure as variáveis de ambiente:

```text
VESPER_PORTAL_BASE_URL
VESPER_PORTAL_API_KEY
OPENAI_API_KEY
GEMINI_API_KEY
OLLAMA_BASE_URL
```

## Regras de segurança

- O Portal Vesper é a fonte da verdade.
- n8n orquestra, mas não deve executar ação sensível sem Approval Center.
- Compra final, proposta final, pagamento, reset de senha/acesso, exclusão, alteração crítica de OP/Kanban e CAPA/INMETRO exigem aprovação/revisão humana.
- Error Audit deve permanecer configurado.

## Documentação relacionada

- `docs/automation_gateway.md`
- `docs/n8n/N8N_AI_STRUCTURAL_FIX_REPORT.md`
- `docs/n8n/N8N_WORKFLOWS_ONLINE_STATUS.md`
- `docs/n8n/N8N_SUPERVISOR_WORKER_ROUTING_MATRIX.md`
