# N8N Supervisor Decision Rules

## Regras de decisao

1. Classificar intencao antes de chamar qualquer trabalhador.
2. Calcular `confidence_score`.
3. Se `confidence_score` for baixo, pedir esclarecimento.
4. Se houver multiplas intencoes, separar em etapas e pedir prioridade.
5. Se faltar dado obrigatorio, pedir somente o campo faltante.
6. Se for consulta simples, nao criar registro.
7. Se for acao sensivel, criar aprovacao e parar.
8. Se `request_id` ja foi processado, retornar resultado existente ou bloquear duplicidade.
9. Nao chamar todos os trabalhadores em paralelo.
10. Nao usar modelo caro para regra deterministica simples.
11. Nao acionar Approval Center se nao houver acao sensivel.
12. Nao consultar NAS/Knowledge se o Portal ja tem o dado estruturado.
13. Nao executar workflow inativo.
14. Se trabalhador falhar, registrar Error Audit e retornar resposta segura.

## Dados minimos padronizados

```json
{
  "runtime_mode": "PORTAL",
  "source": "portal",
  "message": "...",
  "correlation_id": "...",
  "request_id": "...",
  "user": {
    "id": "...",
    "name": "...",
    "role": "...",
    "department": "..."
  },
  "payload": {},
  "metadata": {}
}
```

## Saida padronizada

```json
{
  "success": true,
  "correlation_id": "...",
  "request_id": "...",
  "status": "...",
  "agent": "...",
  "workflow": "...",
  "summary": "...",
  "risk_level": "low",
  "requires_approval": false,
  "approval_id": null,
  "provider_used": "...",
  "fallback_used": false,
  "next_action": "...",
  "data": {}
}
```
