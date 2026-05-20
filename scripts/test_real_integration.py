import urllib.request
import urllib.error
import json
import uuid

BASE_URL = "http://localhost:8000"
API_KEY = "dev_portal_key_123"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}

    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, method=method, data=req_data, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.status
            body = response.read().decode("utf-8")
            try:
                json_body = json.loads(body)
            except:
                json_body = body
            return status_code, json_body
    except urllib.error.HTTPError as e:
        status_code = e.code
        body = e.read().decode("utf-8")
        try:
            json_body = json.loads(body)
        except:
            json_body = body
        return status_code, json_body
    except Exception as e:
        return 0, str(e)

def test_integration():
    print("--- 1. Login no Portal ---")
    status, login_resp = make_request(
        f"{BASE_URL}/api/auth/login",
        method="POST",
        data={"username": "Admin", "password": "Vesper@890", "remember_me": True}
    )
    if status != 200:
        print(f"Erro ao fazer login: {status} - {login_resp}")
        return

    token = login_resp["access_token"]
    user_id = login_resp["user"]["id"]
    headers_auth = {"Authorization": f"Bearer {token}"}
    print(f"Login bem sucedido! User ID: {user_id}")

    print("\n--- 2. Chamada ao Gateway IA (Portal -> n8n) ---")
    status, gateway_json = make_request(
        f"{BASE_URL}/api/ia/gateway",
        method="POST",
        data={
            "message": "Quero cotar 50 chapas de aço inox 304 para a OP 123",
            "module_hint": "compras"
        },
        headers=headers_auth
    )

    print(f"Status do Gateway: {status}")
    print(f"Resposta do Gateway: {json.dumps(gateway_json, indent=2, ensure_ascii=False)}")
    correlation_id = gateway_json.get("correlation_id")
    print(f"Correlation ID gerado: {correlation_id}")

    print("\n--- 3. Verificação do Audit Log / Errors via Timeline/Correlation ---")
    status, timeline = make_request(
        f"{BASE_URL}/api/automation/auditoria/by-correlation/{correlation_id}",
        headers=headers_auth
    )
    if status == 200:
        print(f"Timeline recuperada para correlation_id {correlation_id}:")
        audits = timeline.get("audit_logs", [])
        print(f"  - Logs de auditoria: {len(audits)}")
        for a in audits:
            print(f"    * Action: {a.get('action')}, Status: {a.get('status')}, Severity: {a.get('severity')}")
            print(f"      Summary: {a.get('summary')}")

        errors = timeline.get("errors", [])
        print(f"  - Erros na timeline: {len(errors)}")
        for err in errors:
            print(f"    * Error Message: {err.get('error_message')}, Status: {err.get('status')}")
    else:
        print(f"Erro ao obter linha do tempo de auditoria: {status} - {timeline}")

    print("\n--- 4. Segurança: Acesso com e sem API Key ---")
    # Chamar endpoint de erros sem API key - deve falhar
    err_fail_status, err_fail_resp = make_request(
        f"{BASE_URL}/api/automation/errors",
        method="POST",
        data={
            "correlation_id": str(uuid.uuid4()),
            "request_id": str(uuid.uuid4()),
            "source": "n8n",
            "error_message": "Teste sem API key",
            "status": "active"
        }
    )
    print(f"Chamada sem API Key (esperado 403): {err_fail_status}")

    # Chamar com API key inválida - deve falhar
    err_fail_bad_status, err_fail_bad_resp = make_request(
        f"{BASE_URL}/api/automation/errors",
        method="POST",
        data={
            "correlation_id": str(uuid.uuid4()),
            "request_id": str(uuid.uuid4()),
            "source": "n8n",
            "error_message": "Teste com API key inválida",
            "status": "active"
        },
        headers={"Authorization": "Bearer bad_key"}
    )
    print(f"Chamada com API Key inválida (esperado 401): {err_fail_bad_status}")

    # Chamar com API key válida - deve passar (esperado 200/201)
    err_ok_status, err_ok_resp = make_request(
        f"{BASE_URL}/api/automation/errors",
        method="POST",
        data={
            "correlation_id": str(uuid.uuid4()),
            "request_id": str(uuid.uuid4()),
            "source": "n8n",
            "error_message": "Teste com API key válida",
            "status": "active",
            "payload": {"status": "ok"}
        },
        headers={"Authorization": f"Bearer {API_KEY}"}
    )
    print(f"Chamada com API Key válida (esperado 200/201): {err_ok_status}")

    print("\n--- 5. Segurança: Redação de Dados Sensíveis (Redactor) ---")
    sensitive_payload = {
        "password": "senha_super_secreta_123",
        "token": "bearer_token_abc123",
        "secret": "my_secret_key_890",
        "authorization": "Bearer secret_api_key",
        "api_key": "some_api_key_xyz",
        "credit_card": "1234-5678-9012-3456",
        "safe_field": "Isso é seguro e não deve ser editado"
    }

    redact_err_id = str(uuid.uuid4())
    redact_status, redact_resp = make_request(
        f"{BASE_URL}/api/automation/errors",
        method="POST",
        data={
            "correlation_id": redact_err_id,
            "request_id": str(uuid.uuid4()),
            "source": "n8n_redact_test",
            "error_message": "Erro de teste de redação",
            "status": "active",
            "payload": sensitive_payload
        },
        headers={"Authorization": f"Bearer {API_KEY}"}
    )

    print(f"Envio de erro sensível status: {redact_status}")

    # Vamos verificar o erro registrado na linha do tempo
    status_t, redact_timeline = make_request(
        f"{BASE_URL}/api/automation/auditoria/by-correlation/{redact_err_id}",
        headers=headers_auth
    )
    if status_t == 200:
        errors = redact_timeline.get("errors", [])
        if errors:
            recorded_err = errors[0]
            print(f"Erro gravado no banco:")
            print(f"  - Message: {recorded_err.get('error_message')}")
            print(f"  - Redacted Payload: {json.dumps(recorded_err.get('redacted_payload_json'), indent=2)}")
        else:
            print("Não encontrou o erro gravado no banco.")
    else:
        print(f"Erro ao obter linha do tempo de erros: {status_t}")

    print("\n--- 6. Approval Center: Criar aprovação via n8n ---")
    approval_id = f"test-approval-{uuid.uuid4().hex[:6]}"
    approval_payload = {
        "approval_id": approval_id,
        "correlation_id": correlation_id,
        "request_id": str(uuid.uuid4()),
        "approval_type": "compras_cotacao",
        "requested_by": {"id": "n8n-agent", "name": "Procure to Pay Agent"},
        "summary": "Aprovação de cotação de 50 chapas de aço inox 304 para a OP 123",
        "risk_level": "medium",
        "amount": 2500.00,
        "currency": "BRL",
        "status": "pending",
        "details": {"items": [{"name": "chapas de aço", "qty": 50, "price": 50.0}]},
        "callback": {"url": "http://127.0.0.1:5678/webhook/vesper/core/approvals/callback"}
    }

    app_create_status, app_create_resp = make_request(
        f"{BASE_URL}/api/automation/approvals",
        method="POST",
        data=approval_payload,
        headers={"Authorization": f"Bearer {API_KEY}"}
    )
    print(f"Criação de aprovação status (esperado 201): {app_create_status}")
    if app_create_status in (200, 201):
        print(f"Aprovação criada no Portal com ID: {approval_id}")
    else:
        print(f"Falha na criação: {app_create_resp}")

    print("\n--- 7. Approval Center: Visualizar aprovações pendentes ---")
    app_list_status, approvals = make_request(
        f"{BASE_URL}/api/automation/approvals?status=pending",
        headers=headers_auth
    )
    print(f"Lista de aprovações status: {app_list_status}")
    if app_list_status == 200:
        matching_approvals = [a for a in approvals if a.get("approval_id") == approval_id]
        print(f"Aprovações pendentes com ID {approval_id}: {len(matching_approvals)}")
        if matching_approvals:
            print(f"  - Summary: {matching_approvals[0].get('summary')}")
            print(f"  - Risk: {matching_approvals[0].get('risk_level')}")
            print(f"  - Status: {matching_approvals[0].get('status')}")

    print("\n--- 8. Approval Center: Responder aprovação (Aprovar) ---")
    app_respond_status, response_body = make_request(
        f"{BASE_URL}/api/automation/approvals/{approval_id}/respond",
        method="POST",
        data={"decision": "approved", "reason": "Cotação aprovada, preço adequado."},
        headers=headers_auth
    )
    print(f"Resposta à aprovação status (esperado 200): {app_respond_status}")
    print(f"Resposta do endpoint: {json.dumps(response_body)}")

    # Consultar o registro final da aprovação no banco para ver o estado persistido
    app_get_status, final_approval = make_request(
        f"{BASE_URL}/api/automation/approvals/{approval_id}",
        headers=headers_auth
    )
    if app_get_status == 200:
        print(f"Estado final da aprovação consultado no banco:")
        print(f"  - Status: {final_approval.get('status')}")
        print(f"  - Decision: {final_approval.get('decision')}")
        print(f"  - Reason: {final_approval.get('reason')}")
        print(f"  - Responded By: {final_approval.get('responded_by_json')}")
        print(f"  - Responded At: {final_approval.get('responded_at')}")

if __name__ == "__main__":
    test_integration()
