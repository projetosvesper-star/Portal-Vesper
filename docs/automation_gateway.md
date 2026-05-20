# Automação e Gateway IA

Este documento descreve o funcionamento do módulo de Automação, e como o Portal Vesper se comunica com o motor de automação externo (n8n).

## 1. Arquitetura

O Portal Vesper é o "cérebro" e a "fonte de dados" primária.
O n8n atua como "músculo", orquestrando fluxos, consumindo e reagindo a dados do Vesper.

Toda comunicação "Portal -> n8n" passa pelo endpoint Gateway Supervisor no n8n.
Toda comunicação "n8n -> Portal" é feita chamando a API do Vesper com a chave de API (`VESPER_PORTAL_API_KEY`).

## 2. Gateway IA (Portal -> n8n)

Para disparar uma automação, o usuário ou o sistema do Portal envia uma requisição para o Gateway no n8n.

**Endpoint Backend:** `POST /api/ia/gateway`

**Payload Exemplo:**
```json
{
  "message": "Gerar relatório financeiro mensal",
  "module_hint": "reports",
  "payload": {
    "month": 5,
    "year": 2026
  }
}
```

O Portal aguarda a resposta síncrona do n8n. O n8n responde com `{ "success": true, "status": "processing", "correlation_id": "..." }`.

## 3. Retornos e Auditoria (n8n -> Portal)

Durante e ao final da execução, o n8n avisa o Vesper via Webhook reverso (`/api/automation/*`).

Endpoints suportados:
- **`POST /api/automation/events`**: Registra eventos (Ex: workflow_started, workflow_finished).
- **`POST /api/automation/audit`**: Registra logs de auditoria detalhados.
- **`POST /api/automation/errors`**: Registra erros graves que ocorreram no n8n, ocultando (redact) informações sensíveis no payload.
- **`POST /api/automation/dead-letters`**: Registra mensagens que não puderam ser entregues/processadas.
- **`POST /api/automation/approvals`**: Solicita a um humano para aprovar ou rejeitar uma ação crítica antes do n8n prosseguir.

## 4. Aprovações (War Room)

Qualquer fluxo do n8n pode parar e exigir aprovação enviando um payload para `/api/automation/approvals`.
No frontend do Portal, o módulo de Automações (`/automacoes/aprovacoes`) lista as pendências. O Gestor ou Administrador deve aprovar ou rejeitar, fornecendo um motivo quando rejeitado.

## 5. View "War Room"

A tela `/automacoes/war-room` exibe o status global das automações e fornece uma caixa de teste rápido para validar chamadas ao Gateway.

## 6. Segurança

1. O tráfego n8n -> Portal é protegido via token Bearer (com API Key ou suporte HMAC).
2. Campos sensíveis (`password`, `token`, `secret`, `authorization`, `credit_card`) logados em Erros e Auditorias são automaticamente substituídos por `***REDACTED***` no backend.
3. Permissões de controle (RBAC) regulam quem pode visualizar a War Room ou aprovar demandas.

## 7. Hardening empresarial n8n

A malha local do n8n foi inventariada na etapa `N8N Enterprise Hardening e Online Sync`.

Estado validado:

- Supervisor principal online: `CORE - Gateway Supervisor`.
- Approval Center online: `CORE - Approval Center`.
- Error Audit online: `CORE - Error Audit Dead Letter`.
- War Room base online: `WAR ROOM - Observability`.
- Workers legados online: Compras, Comercial, Produção/Kanban, Knowledge e Portal Assistant.
- Workflows AI novos revisados: 12.
- Workflows AI novos online: 0, por bloqueio real do n8n e credenciais ausentes.

Depois da etapa de structural fix, os 12 workflows AI foram corrigidos e ativados no n8n local. O erro `Cannot read properties of undefined (reading 'execute')` foi causado por tipos de nodes AI incompatíveis, notificações externas presas no grafo ativo, DataTable sem tabela, URLs vazias e credenciais OpenAI sem o ID interno atual. A malha atual tem 21 workflows ativos e 3 workflows extras/de teste inativos.

Antes de usar AI workers em operação real, mantenha a regra: nenhuma ação sensível executa sem Approval Center, e fallback multi-provedor OpenAI -> Gemini -> Ollama deve ser implementado como utilitário dedicado antes de depender dele para produção.
