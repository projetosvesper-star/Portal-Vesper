# N8N Portal Workflow Status Gap

## Estado atual

O Portal enxerga a malha via Automation Core, War Room e timeline, mas ainda nao possui um endpoint completo para representar todos os metadados empresariais dos 24 workflows encontrados no n8n.

## Gaps recomendados para endpoint futuro

Endpoint sugerido:

```text
GET /api/ia/workflows/status
```

Campos sugeridos:

- `workflow_id`
- `name`
- `type`
- `active`
- `health`
- `last_execution_at`
- `last_error`
- `provider_used`
- `fallback_used`
- `requires_credentials`
- `missing_credentials`
- `required_portal_endpoints`
- `pending_approvals`
- `dead_letters`
- `risk_level`
- `owner_module`
- `called_by`
- `calls`

## Uso no War Room

O War Room deve apenas observar, resumir, recomendar e alertar. Ele nao deve corrigir, aprovar, apagar ou ativar workflows automaticamente.
