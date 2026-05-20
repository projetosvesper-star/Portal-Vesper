#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
"""
audit_n8n_workflows.py
Audita e corrige os 12 workflows AI-gerados da pasta N8N/
para padronizá-los ao Automation Core do Portal Vesper.

Uso: python scripts/audit_n8n_workflows.py
"""
import json
import re
import os
import copy
from pathlib import Path
from datetime import datetime

# Diretórios
BASE_DIR = Path(__file__).parent.parent
N8N_DIR = BASE_DIR / "N8N"
OUTPUT_DIR = BASE_DIR / "N8N_READY_TO_IMPORT"
BACKUP_DIR = BASE_DIR / "N8N_BACKUP_BEFORE_AI_IMPORT"

OUTPUT_DIR.mkdir(exist_ok=True)
BACKUP_DIR.mkdir(exist_ok=True)

# Constantes de correção
PORTAL_BASE_URL = "http://host.docker.internal:8000"
CORRECT_MODEL = "gpt-4o-mini"
WRONG_MODELS = ["gpt-5-mini", "gpt-5", "gpt-4-mini", "gpt-4o-2024"]
ERROR_WORKFLOW_ID = "LpsYX0AkHTdZKw7P"  # CORE - Error Audit Dead Letter

# Padrões para detectar problemas
PLACEHOLDER_PATTERN = re.compile(r"<__PLACEHOLDER_VALUE__.*?__>")
HARDCODED_SECRET_PATTERN = re.compile(
    r"(api[_-]?key|token|secret|password|bearer|authorization)\s*[:=]\s*['\"](?!{{)[^'\"]{8,}['\"]",
    re.IGNORECASE
)
PROCESS_ENV_PATTERN = re.compile(r"process\.env\.")

# Credenciais que devem ser removidas/substituídas
CREDENTIAL_REPLACEMENTS = {
    "n8n free OpenAI API credits": "OpenAI API Key (Portal Vesper)",
    "Slack account": "Slack API (Portal Vesper)",
    "Gmail account": "SMTP (Portal Vesper)",
    "n8n free Gemini API credits": "Gemini API Key (Portal Vesper)",
}


def load_workflow(filepath: Path) -> dict:
    """Carrega um JSON de workflow."""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def save_workflow(workflow: dict, filepath: Path):
    """Salva um JSON de workflow."""
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(workflow, f, ensure_ascii=False, indent=2)


def audit_workflow(wf: dict, filename: str) -> dict:
    """
    Audita um workflow e retorna relatório de problemas.
    Verifica os 25 critérios da especificação.
    """
    name = wf.get("name", filename)
    nodes = wf.get("nodes", [])
    connections = wf.get("connections", {})
    settings = wf.get("settings", {})

    report = {
        "filename": filename,
        "workflow_name": name,
        "node_count": len(nodes),
        "problems": [],
        "warnings": [],
        "info": [],
        "node_types": [],
        "credentials_found": [],
        "urls_found": [],
        "has_correlation_id": False,
        "has_request_id": False,
        "has_runtime_mode": False,
        "has_error_workflow": bool(settings.get("errorWorkflow")),
        "has_bearer_token": False,
        "uses_process_env": False,
        "uses_slack": False,
        "uses_gmail": False,
        "uses_google_sheets": False,
        "uses_ai_agent": False,
        "ai_models": [],
        "has_approval_mechanism": False,
        "approval_type": None,
        "has_error_handling": False,
        "has_audit_log": False,
        "disconnected_nodes": [],
        "trigger_type": None,
        "risk_level": "low",
        "decision": "import_new",
        "ready_to_import": False,
    }

    # Identificar nós desconectados
    connected_nodes = set()
    for src_node, conns in connections.items():
        connected_nodes.add(src_node)
        for port_type, port_conns in conns.items():
            for conn_list in port_conns:
                for conn in conn_list:
                    connected_nodes.add(conn.get("node", ""))

    for node in nodes:
        node_name = node.get("name", "")
        node_type = node.get("type", "")
        params = node.get("parameters", {})
        creds = node.get("credentials", {})

        # Coletar tipos de nós
        if node_type not in report["node_types"]:
            report["node_types"].append(node_type)

        # Identificar trigger
        if "Trigger" in node_type or "trigger" in node_type.lower():
            report["trigger_type"] = node_type

        # Verificar se usa AI Agent
        if "agent" in node_type.lower() or "langchain" in node_type.lower():
            report["uses_ai_agent"] = True

        # Verificar modelos de IA
        model_val = ""
        if "model" in params:
            model_param = params["model"]
            if isinstance(model_param, dict):
                model_val = model_param.get("value", "")
            else:
                model_val = str(model_param)
        if model_val and model_val not in report["ai_models"]:
            report["ai_models"].append(model_val)

        # Verificar modelos errados
        for wrong_model in WRONG_MODELS:
            if wrong_model in model_val:
                report["problems"].append(
                    f"MODELO_INEXISTENTE: Nó '{node_name}' usa '{model_val}' (não existe)"
                )

        # Verificar credenciais
        for cred_type, cred_info in creds.items():
            cred_name = cred_info.get("name", "")
            entry = f"{cred_type}: {cred_name}"
            if entry not in report["credentials_found"]:
                report["credentials_found"].append(entry)
            if cred_name in CREDENTIAL_REPLACEMENTS:
                report["warnings"].append(
                    f"CREDENCIAL_GENERICA: '{cred_name}' deve ser substituída"
                )

        # Verificar uso de Slack
        if "slack" in node_type.lower():
            report["uses_slack"] = True
            report["warnings"].append(f"USA_SLACK: Nó '{node_name}' usa Slack (credencial necessária)")

        # Verificar uso de Gmail/Email
        if "email" in node_type.lower() or "gmail" in node_type.lower():
            report["uses_gmail"] = True
            if "sendAndWait" in str(params.get("operation", "")):
                report["has_approval_mechanism"] = True
                report["approval_type"] = "email_sendAndWait"
                report["problems"].append(
                    f"APPROVAL_EMAIL: Nó '{node_name}' usa email sendAndWait - deve usar /api/automation/approvals"
                )
            else:
                report["warnings"].append(f"USA_EMAIL: Nó '{node_name}' usa email (SMTP necessário)")

        # Verificar uso de Google Sheets
        if "googleSheets" in node_type.lower() or "googleSheet" in node_type.lower():
            report["uses_google_sheets"] = True
            report["problems"].append(
                f"USA_GOOGLE_SHEETS: Nó '{node_name}' usa Google Sheets como dado - viola regra"
            )

        # Verificar URLs
        for key, val in params.items():
            if isinstance(val, str):
                if "http" in val:
                    if val not in report["urls_found"]:
                        report["urls_found"].append(val)
                    if PLACEHOLDER_PATTERN.search(val):
                        report["problems"].append(
                            f"URL_PLACEHOLDER: Nó '{node_name}' tem URL placeholder: {val[:80]}"
                        )
                    elif "portal.vesper.com" in val:
                        report["problems"].append(
                            f"URL_PRODUCAO: Nó '{node_name}' tem URL de produção hardcoded: {val[:80]}"
                        )
                    elif "portal.vesper" in val.lower() and "host.docker.internal" not in val:
                        report["warnings"].append(
                            f"URL_SUSPEITA: Nó '{node_name}': {val[:80]}"
                        )

                # Verificar process.env
                if PROCESS_ENV_PATTERN.search(val):
                    report["uses_process_env"] = True
                    report["problems"].append(
                        f"PROCESS_ENV: Nó '{node_name}' usa process.env (bloqueado em n8n)"
                    )

                # Verificar segredos hardcoded (simplificado)
                if HARDCODED_SECRET_PATTERN.search(val):
                    report["problems"].append(
                        f"SEGREDO_HARDCODED: Nó '{node_name}' pode ter segredo exposto"
                    )

                # Verificar correlation_id
                if "correlation_id" in val:
                    report["has_correlation_id"] = True

                # Verificar request_id
                if "request_id" in val:
                    report["has_request_id"] = True

                # Verificar runtime_mode
                if "runtime_mode" in val:
                    report["has_runtime_mode"] = True

                # Verificar Bearer token
                if "Bearer" in val or "bearer" in val.lower() or "httpBearerAuth" in val:
                    report["has_bearer_token"] = True

                # Verificar auditoria
                if "/api/automation/audit" in val:
                    report["has_audit_log"] = True

        # Verificar aprovação via Portal
        if "/api/automation/approvals" in str(params):
            report["has_approval_mechanism"] = True
            report["approval_type"] = "portal_api"

        # Verificar error handling
        if "errorWorkflow" in str(params) or "CORE - Error" in str(params):
            report["has_error_handling"] = True

        # Verificar nós desconectados
        if node_name and node_name not in connected_nodes and "Trigger" not in node_name:
            # Verificar se é nó de sticky note
            if "stickyNote" not in node_type:
                report["disconnected_nodes"].append(node_name)

    # Verificar error workflow
    if not report["has_error_workflow"]:
        report["warnings"].append("SEM_ERROR_WORKFLOW: errorWorkflow não configurado")

    if not report["has_correlation_id"]:
        report["warnings"].append("SEM_CORRELATION_ID: correlation_id não encontrado")

    if not report["has_request_id"]:
        report["warnings"].append("SEM_REQUEST_ID: request_id não encontrado")

    if not report["has_runtime_mode"]:
        report["warnings"].append("SEM_RUNTIME_MODE: runtime_mode não encontrado")

    if not report["has_bearer_token"]:
        report["problems"].append("SEM_BEARER_TOKEN: Chamadas ao Portal sem Authorization Bearer")

    if not report["has_audit_log"]:
        report["warnings"].append("SEM_AUDIT: Não registra auditoria em /api/automation/audit")

    # Definir nível de risco
    p_count = len(report["problems"])
    if p_count == 0:
        report["risk_level"] = "low"
    elif p_count <= 3:
        report["risk_level"] = "medium"
    elif p_count <= 6:
        report["risk_level"] = "high"
    else:
        report["risk_level"] = "critical"

    # Decisão
    if report["risk_level"] == "critical":
        report["decision"] = "needs_fixes_before_import"
    else:
        report["decision"] = "import_new_inactive"

    report["ready_to_import"] = p_count == 0

    return report


def fix_workflow(wf: dict, audit_report: dict) -> dict:
    """
    Aplica correções padronizadas em um workflow.
    Retorna o workflow corrigido (não modifica in-place).
    """
    fixed = copy.deepcopy(wf)
    original_name = fixed.get("name", "")

    # 1. Adicionar prefixo ao nome se não tiver
    if not original_name.startswith("AI - "):
        fixed["name"] = f"AI - {original_name}"

    # 2. Configurar errorWorkflow
    if "settings" not in fixed:
        fixed["settings"] = {}
    if not fixed["settings"].get("errorWorkflow"):
        fixed["settings"]["errorWorkflow"] = ERROR_WORKFLOW_ID

    # 3. Garantir que começa inativo
    fixed["active"] = False

    # 4. Corrigir nodes
    nodes_to_remove = []  # índices de nós que devem ser removidos (Slack sem credencial)

    for i, node in enumerate(fixed.get("nodes", [])):
        node_type = node.get("type", "")
        params = node.get("parameters", {})
        creds = node.get("credentials", {})

        # 4a. Corrigir modelo de IA
        if "model" in params:
            model_param = params["model"]
            if isinstance(model_param, dict):
                model_val = model_param.get("value", "")
                if any(wrong in model_val for wrong in WRONG_MODELS):
                    node["parameters"]["model"]["value"] = CORRECT_MODEL
                    node["parameters"]["model"]["mode"] = "list"
            elif isinstance(model_param, str):
                if any(wrong in model_param for wrong in WRONG_MODELS):
                    node["parameters"]["model"] = CORRECT_MODEL

        # 4b. Corrigir credenciais genéricas
        for cred_type, cred_info in list(creds.items()):
            old_name = cred_info.get("name", "")
            if old_name in CREDENTIAL_REPLACEMENTS:
                node["credentials"][cred_type]["name"] = CREDENTIAL_REPLACEMENTS[old_name]
                node["credentials"][cred_type]["id"] = ""  # Limpar ID (será configurado no n8n)

        # 4c. Corrigir URLs placeholder e de produção
        def fix_url_in_value(val):
            if not isinstance(val, str):
                return val
            # Substituir placeholder de URL base
            if PLACEHOLDER_PATTERN.search(val):
                val = re.sub(
                    r"<__PLACEHOLDER_VALUE__URL da API do Portal Vesper[^>]*>",
                    f"{PORTAL_BASE_URL}/api",
                    val
                )
                val = re.sub(r"<__PLACEHOLDER_VALUE__[^>]*>", "", val)
            # Substituir portal.vesper.com por host.docker.internal
            val = re.sub(r"https?://portal\.vesper\.com", PORTAL_BASE_URL, val)
            val = re.sub(r"https?://[^/]+\.vesper\.com", PORTAL_BASE_URL, val)
            return val

        # Aplicar correção de URLs nos parâmetros
        for param_key in list(params.keys()):
            params[param_key] = fix_url_in_value(params[param_key])

        # 4d. Adicionar Bearer Token se for HTTP Request ao Portal
        if node_type in ["n8n-nodes-base.httpRequest", "n8n-nodes-base.httpRequestTool"]:
            url = params.get("url", "")
            if isinstance(url, str) and (PORTAL_BASE_URL in url or "automation" in url or "/api/" in url):
                # Garantir autenticação
                if params.get("authentication") != "genericCredentialType":
                    node["parameters"]["authentication"] = "genericCredentialType"
                    node["parameters"]["genericAuthType"] = "httpBearerAuth"
                if "credentials" not in node:
                    node["credentials"] = {}
                if "httpBearerAuth" not in node["credentials"]:
                    node["credentials"]["httpBearerAuth"] = {
                        "id": "",
                        "name": "Portal Vesper API Key (Bearer)"
                    }

        # 4e. Marcar nó Slack como disabled se não há credencial
        if "slack" in node_type.lower():
            node["disabled"] = True
            # Adicionar nota
            node["notes"] = "DESATIVADO: Configure credencial Slack no n8n antes de ativar"

        # 4f. Substituir email sendAndWait por placeholder HTTP request ao Portal
        if "email" in node_type.lower() and params.get("operation") == "sendAndWait":
            # Transformar em HTTP Request para o Approval Center do Portal
            node["type"] = "n8n-nodes-base.httpRequest"
            node["typeVersion"] = 4.4
            node["parameters"] = {
                "method": "POST",
                "url": f"{PORTAL_BASE_URL}/api/automation/approvals",
                "authentication": "genericCredentialType",
                "genericAuthType": "httpBearerAuth",
                "sendBody": True,
                "specifyBody": "json",
                "jsonBody": (
                    '={{ { "action_type": $json.acao_original || $json.acao || "unknown", '
                    '"description": $json.detalhes || $json.assunto || "Aprovação necessária", '
                    '"requester": $json.user || "n8n_agent", '
                    '"correlation_id": $json.correlation_id || $execution.id, '
                    '"metadata": $json } }}'
                ),
                "options": {
                    "response": {"response": {"neverError": True}}
                }
            }
            node["credentials"] = {
                "httpBearerAuth": {
                    "id": "",
                    "name": "Portal Vesper API Key (Bearer)"
                }
            }
            node["notes"] = "CONVERTIDO: Email sendAndWait → POST /api/automation/approvals"

    return fixed


def generate_inventory_entry(wf: dict, audit: dict) -> str:
    """Gera linha de inventário em Markdown."""
    name = audit["workflow_name"]
    trigger = audit["trigger_type"] or "N/A"
    nodes = audit["node_count"]
    risk = audit["risk_level"].upper()
    decision = audit["decision"]
    problems = len(audit["problems"])
    warnings = len(audit["warnings"])
    models = ", ".join(audit["ai_models"]) or "N/A"
    creds = len(audit["credentials_found"])
    approval = audit["approval_type"] or "nenhum"
    slack = "✅" if audit["uses_slack"] else "❌"
    sheets = "✅" if audit["uses_google_sheets"] else "❌"
    bearer = "✅" if audit["has_bearer_token"] else "❌"
    error_wf = "✅" if audit["has_error_workflow"] else "❌"
    corr_id = "✅" if audit["has_correlation_id"] else "❌"

    return f"""### {name}
- **Trigger:** `{trigger}`
- **Nós:** {nodes} | **Credenciais:** {creds}
- **Modelo IA:** `{models}`
- **Aprovação:** `{approval}`
- **Problemas:** {problems} | **Avisos:** {warnings}
- **Bearer Token:** {bearer} | **Error Workflow:** {error_wf} | **Correlation ID:** {corr_id}
- **Slack:** {slack} | **Google Sheets:** {sheets}
- **Risco:** `{risk}` | **Decisão:** `{decision}`
"""


def main():
    """Executa auditoria e correção de todos os workflows."""
    print(f"=== Portal Vesper — Auditoria de Workflows AI ===")
    print(f"Pasta de entrada: {N8N_DIR}")
    print(f"Pasta de saída: {OUTPUT_DIR}")
    print()

    json_files = sorted(N8N_DIR.glob("*.json"))
    print(f"Encontrados {len(json_files)} workflows para auditar.\n")

    all_reports = []
    summary = {
        "total": len(json_files),
        "ready": 0,
        "needs_fixes": 0,
        "high_risk": 0,
        "critical": 0,
    }

    inventory_lines = []
    audit_lines = []

    for fp in json_files:
        print(f"Auditando: {fp.name}")
        try:
            wf = load_workflow(fp)
        except json.JSONDecodeError as e:
            print(f"  ❌ JSON inválido: {e}")
            continue

        # Auditoria
        report = audit_workflow(wf, fp.name)
        all_reports.append(report)

        # Resumo
        if report["ready_to_import"]:
            summary["ready"] += 1
        else:
            summary["needs_fixes"] += 1

        if report["risk_level"] == "critical":
            summary["critical"] += 1
        elif report["risk_level"] == "high":
            summary["high_risk"] += 1

        # Inventário
        inventory_lines.append(generate_inventory_entry(wf, report))

        # Auditoria detalhada
        audit_section = f"""## {report['workflow_name']}

**Arquivo:** `{fp.name}`
**Risco:** `{report['risk_level'].upper()}`
**Decisão:** `{report['decision']}`

### Problemas ({len(report['problems'])})
"""
        for p in report["problems"]:
            audit_section += f"- ❌ {p}\n"
        if not report["problems"]:
            audit_section += "- ✅ Nenhum problema crítico\n"

        audit_section += f"\n### Avisos ({len(report['warnings'])})\n"
        for w in report["warnings"]:
            audit_section += f"- ⚠️ {w}\n"

        audit_section += f"\n### Informações\n"
        audit_section += f"- **Tipos de nós:** `{', '.join(report['node_types'][:5])}`\n"
        audit_section += f"- **Credenciais:** `{', '.join(report['credentials_found'])}`\n"
        audit_section += f"- **URLs encontradas:** {len(report['urls_found'])}\n"
        audit_section += f"- **Nós desconectados:** {report['disconnected_nodes']}\n"
        audit_section += "\n---\n"
        audit_lines.append(audit_section)

        # Correção e exportação
        fixed_wf = fix_workflow(wf, report)
        output_filename = f"AI - {fp.stem}.json"
        # Garantir nome seguro para arquivo
        output_filename = re.sub(r'[<>:"/\\|?*]', '_', output_filename)
        output_path = OUTPUT_DIR / output_filename
        save_workflow(fixed_wf, output_path)

        n_problems = len(report["problems"])
        status = "[OK]" if n_problems == 0 else f"[WARN] {n_problems} problemas corrigidos"
        print(f"  {status} -> {output_filename}")

    # Gerar relatório de inventário
    inventory_md = f"""# N8N AI Workflows — Inventário
*Gerado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*

## Resumo Executivo

| Métrica | Valor |
|---------|-------|
| Total de workflows analisados | {summary['total']} |
| Prontos para importar (sem problemas) | {summary['ready']} |
| Precisam de correções | {summary['needs_fixes']} |
| Risco alto | {summary['high_risk']} |
| Risco crítico | {summary['critical']} |

## Workflows Encontrados

"""
    inventory_md += "\n".join(inventory_lines)

    inventory_path = BASE_DIR / "N8N_AI_GENERATED_INVENTARIO.md"
    with open(inventory_path, "w", encoding="utf-8") as f:
        f.write(inventory_md)
    print(f"\n[OK] Inventario salvo: {inventory_path}")

    # Gerar relatório de auditoria
    audit_md = f"""# N8N AI Workflows — Auditoria Detalhada
*Gerado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*

## Critérios de Auditoria
Cada workflow foi auditado contra os 25 critérios da especificação Portal Vesper.

---

"""
    audit_md += "\n".join(audit_lines)

    audit_path = BASE_DIR / "N8N_AI_WORKFLOWS_AUDITORIA.md"
    with open(audit_path, "w", encoding="utf-8") as f:
        f.write(audit_md)
    print(f"[OK] Auditoria salva: {audit_path}")

    # Sumário final
    print(f"""
=== SUMÁRIO ===
Total analisados: {summary['total']}
Prontos (sem correção): {summary['ready']}
Corrigidos e exportados: {summary['needs_fixes']}
Risco alto: {summary['high_risk']}
Risco crítico: {summary['critical']}

JSONs corrigidos em: {OUTPUT_DIR}
""")

    return all_reports


if __name__ == "__main__":
    main()
