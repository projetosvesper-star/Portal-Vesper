# N8N — Credenciais Pendentes
*Portal Vesper / Vent Rio — 2026-05-20*

## Tabela de Credenciais

| Credencial | Usada por workflows | Obrigatória | Onde configurar no n8n | Variável esperada | Fallback | Status |
|------------|---------------------|-------------|------------------------|-------------------|----------|--------|
| **Portal Vesper API Key (Bearer)** | Todos os 12 workflows AI | ✅ Sim | Settings → Credentials → HTTP Bearer Token | `VESPER_PORTAL_API_KEY` | Nenhum — bloqueante | ⚠️ Configurar com `dev_portal_key_123` |
| **OpenAI API Key (Portal Vesper)** | Todos os 12 workflows AI | ✅ Sim | Settings → Credentials → OpenAI API | `OPENAI_API_KEY` | Gemini → Ollama | ❌ Pendente |
| **Gemini API Key (Portal Vesper)** | Fallback de todos | Não (fallback) | Settings → Credentials → Google Gemini API | `GEMINI_API_KEY` | Ollama → determinístico | ❌ Pendente |
| **Ollama Local (Portal Vesper)** | Fallback de todos | Não (fallback) | Settings → Credentials → Ollama API | `OLLAMA_BASE_URL` | Determinístico | ❌ Pendente |
| **Slack API (Portal Vesper)** | WF Financeiro, HelpDesk, Aprovações, Estoque, Produção, Qualidade, RH, War Room | Não (notificação) | Settings → Credentials → Slack API | `SLACK_BOT_TOKEN` | Portal notifications | ❌ Pendente (todos nós Slack desabilitados) |
| **SMTP (Portal Vesper)** | WF Financeiro, Produção, Qualidade | Não (notificação) | Settings → Credentials → SMTP | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Portal notifications | ❌ Pendente |
| **Perplexity API (Portal Vesper)** | Agente de Qualidade INMETRO | Não (busca regulatória) | Settings → Credentials → HTTP Header Auth | `PERPLEXITY_API_KEY` | Aviso manual | ❌ Pendente |
| **Google Drive (Portal Vesper)** | Agente de Qualidade INMETRO | Não (documentos) | Settings → Credentials → Google Drive OAuth2 | — | Aviso manual | ❌ Pendente |

---

## Prioridade de Configuração

### Fase 1 — Crítico (bloqueia os workflows)
1. **Portal Vesper API Key** → Configurar imediatamente com `dev_portal_key_123`
2. **OpenAI API Key** → Necessária para ativar qualquer workflow AI

### Fase 2 — Importante (habilita fallbacks)
3. **Gemini API Key** → Fallback gratuito com créditos do Google AI Studio
4. **Ollama Local** → Fallback local sem custo (precisa instalar Ollama)

### Fase 3 — Opcional (funcionalidades extras)
5. **Slack API** → Notificações em tempo real
6. **SMTP** → Notificações por e-mail
7. **Perplexity** → Busca de regulamentos INMETRO online
8. **Google Drive** → Acesso a documentos de qualidade

---

## Passo a Passo: Configurar Credenciais Mínimas

### 1. Portal Vesper API Key (Bearer)

```
n8n → Settings → Credentials → + New Credential
Tipo: HTTP Bearer Token
Nome: Portal Vesper API Key (Bearer)
Token: dev_portal_key_123
Salvar
```

### 2. OpenAI API Key

```
n8n → Settings → Credentials → + New Credential
Tipo: OpenAI API
Nome: OpenAI API Key (Portal Vesper)
API Key: sk-... (sua chave real)
Salvar
```

Depois, para cada workflow AI importado:
- Abrir o workflow
- Clicar no nó OpenAI/LM Chat
- Selecionar a credencial `OpenAI API Key (Portal Vesper)`
- Salvar

### 3. Verificar configuração nos workflows

Após configurar as credenciais, verificar nos 12 workflows se:
- Nó de modelo de IA está apontando para a credencial correta
- Nós HTTP Request para o Portal estão usando `Portal Vesper API Key (Bearer)`
- Nós Slack estão marcados como `disabled` (não remover)
- errorWorkflow está configurado para `CORE - Error Audit Dead Letter`

---

## Variáveis de Ambiente n8n (docker-compose)

Para configurar via variáveis de ambiente no container n8n, adicionar ao `docker-compose.yml`:

```yaml
environment:
  # Já configurado
  N8N_ENCRYPTION_KEY: "..."
  
  # Adicionar (opcional — alternativa às credenciais no UI):
  # OPENAI_API_KEY: "sk-..."  # NÃO fazer - usar credenciais do n8n
  # GEMINI_API_KEY: "..."     # NÃO fazer - usar credenciais do n8n
```

> **ATENÇÃO:** Não coloque API Keys diretamente em variáveis de ambiente se possível.
> Use o sistema de credenciais do n8n (Settings → Credentials) para maior segurança.
> As credenciais no n8n são criptografadas com `N8N_ENCRYPTION_KEY`.

---

## Webhooks dos Novos Workflows

Os seguintes workflows têm webhooks que precisam de URL fixa após ativação:

| Workflow | Webhook Path | Método | Autenticação atual |
|----------|-------------|--------|-------------------|
| Agente Financeiro | `/financeiro/documentos` | POST | Nenhuma ⚠️ |
| Agente de Produção | `<webhook-path>` (placeholder) | POST | Nenhuma ⚠️ |
| Agente de Propostas | `/proposta-comercial` | POST | Nenhuma ⚠️ |
| Agente de Qualidade | `/auditoria-inmetro` | POST | Nenhuma ⚠️ |
| Agente de RH | `<webhook-rh>` (placeholder) | POST | Nenhuma ⚠️ |

> **ATENÇÃO:** Todos os webhooks precisam de autenticação antes de serem ativados em produção.
> Recomendação: usar HMAC signature ou Bearer token via Header Auth.
