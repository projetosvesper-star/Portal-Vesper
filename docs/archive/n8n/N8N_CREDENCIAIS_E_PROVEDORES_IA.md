# N8N — Credenciais e Provedores de IA
*Portal Vesper / Vent Rio — 2026-05-20*

## Estratégia de Fallback de IA

O Portal Vesper adota a seguinte ordem de prioridade para modelos de IA nos workflows n8n:

```
1º OpenAI GPT-4o-mini  →  principal (custo/performance)
2º Google Gemini Flash  →  fallback 1 (se OpenAI falhar/cota esgotada)
3º Ollama Local         →  fallback 2 (se ambos falharem)
4º Resposta determinística →  fallback final (sem IA, regras fixas)
```

### Regras de Fallback

- Se OpenAI retornar HTTP 429 (rate limit) ou 503 → tentar Gemini
- Se Gemini retornar erro → tentar Ollama
- Se Ollama retornar erro → retornar resposta controlada + registrar em `/api/automation/errors`
- **Para ações sensíveis (compra, aprovação, exclusão):** qualquer falha de IA = NÃO executar, pedir aprovação humana
- **Para consultas/relatórios:** qualquer falha de IA = retornar "Serviço temporariamente indisponível"
- Sempre registrar qual provedor respondeu no campo `agent` da resposta
- Sempre registrar falhas de provedor em `/api/automation/errors`

---

## Provedores de IA — Status e Configuração

### 1. OpenAI (Principal)

| Campo | Valor |
|-------|-------|
| **Status** | ⚠️ **PENDENTE** — credencial real necessária |
| **Credencial n8n** | `OpenAI API Key (Portal Vesper)` |
| **Tipo** | `openAiApi` |
| **Onde configurar** | n8n → Settings → Credentials → New → OpenAI API |
| **Variável** | `OPENAI_API_KEY` |
| **Modelos usados** | `gpt-4o-mini` (corrigido de gpt-5-mini) |
| **Obrigatória** | Sim (para todos os 12 workflows AI) |
| **Fallback** | Gemini → Ollama → regra determinística |
| **Workflows que usam** | Todos os 12 workflows AI |

**Como configurar:**
1. Acesse https://platform.openai.com/api-keys
2. Crie uma API Key
3. No n8n: Settings → Credentials → New → OpenAI API
4. Nome: `OpenAI API Key (Portal Vesper)`
5. Cole a API Key

---

### 2. Google Gemini (Fallback 1)

| Campo | Valor |
|-------|-------|
| **Status** | ⚠️ **PENDENTE** — credencial real necessária |
| **Credencial n8n** | `Gemini API Key (Portal Vesper)` |
| **Tipo** | `googleGeminiApi` |
| **Onde configurar** | n8n → Settings → Credentials → New → Google Gemini API |
| **Variável** | `GEMINI_API_KEY` |
| **Modelos sugeridos** | `gemini-1.5-flash` (custo-benefício) |
| **Obrigatória** | Não (fallback) |
| **Fallback** | Ollama → regra determinística |
| **Workflows que usam** | Nenhum ativo ainda — será configurado manualmente |

**Como configurar:**
1. Acesse https://aistudio.google.com/app/apikey
2. Crie uma API Key gratuita
3. No n8n: Settings → Credentials → New → Google Gemini API
4. Nome: `Gemini API Key (Portal Vesper)`

---

### 3. Ollama Local (Fallback 2)

| Campo | Valor |
|-------|-------|
| **Status** | ⚠️ **PENDENTE** — verificar se Ollama está rodando |
| **Credencial n8n** | `Ollama Local (Portal Vesper)` |
| **Tipo** | `ollamaApi` |
| **Onde configurar** | n8n → Settings → Credentials → New → Ollama API |
| **URL base** | `http://host.docker.internal:11434` |
| **Variável** | `OLLAMA_BASE_URL` |
| **Modelos sugeridos** | `llama3.2`, `mistral`, `phi3` |
| **Obrigatória** | Não (fallback) |
| **Fallback** | Regra determinística |
| **Workflows que usam** | Nenhum ativo ainda — será configurado manualmente |

**Como instalar Ollama:**
```bash
# Windows
winget install Ollama.Ollama
# Depois pull do modelo
ollama pull llama3.2
```

---

### 4. Embeddings OpenAI (Workflows RAG)

| Campo | Valor |
|-------|-------|
| **Status** | ⚠️ **PENDENTE** — usa mesma API Key da OpenAI |
| **Credencial n8n** | `OpenAI API Key (Portal Vesper)` (mesma) |
| **Tipo** | `openAiApi` |
| **Modelo** | `text-embedding-ada-002` ou `text-embedding-3-small` |
| **Obrigatória** | Sim para: Agente de Arquivos NAS, Agente de Qualidade |
| **Fallback** | Sem fallback de embeddings — workflow fica degradado |

---

## Outros Provedores Externos

### 5. Perplexity AI (Busca Web Regulatória)

| Campo | Valor |
|-------|-------|
| **Status** | ⚠️ **PENDENTE** |
| **Credencial n8n** | `Perplexity API (Portal Vesper)` |
| **Tipo** | `perplexityApi` |
| **Obrigatória** | Não (apenas Agente de Qualidade INMETRO) |
| **Fallback** | Sem busca web → aviso ao usuário para consultar manualmente |
| **Workflows** | AI - PORTAL VESPER - Agente de Qualidade Auditoria INMETRO e CAPA |

---

### 6. Google Drive (Documentos de Qualidade)

| Campo | Valor |
|-------|-------|
| **Status** | ⚠️ **PENDENTE** |
| **Credencial n8n** | `Google Drive (Portal Vesper)` |
| **Tipo** | `googleDriveOAuth2Api` |
| **Obrigatória** | Não (apenas Agente de Qualidade) |
| **Fallback** | Sem acesso a documentos do Drive → aviso ao usuário |
| **Workflows** | AI - PORTAL VESPER - Agente de Qualidade Auditoria INMETRO e CAPA |

---

### 7. Slack (Notificações)

| Campo | Valor |
|-------|-------|
| **Status** | ⚠️ **PENDENTE** — todos os nós Slack foram desabilitados |
| **Credencial n8n** | `Slack API (Portal Vesper)` |
| **Tipo** | `slackApi` ou `slackOAuth2Api` |
| **Obrigatória** | Não (opcional para notificações) |
| **Fallback** | Sem notificação Slack → notificação apenas via Portal Vesper |
| **Workflows** | WF Financeiro, HelpDesk, Aprovações, Estoque, Produção, Qualidade, RH, War Room |

**Como configurar:**
1. Acesse https://api.slack.com/apps e crie um Slack App
2. Configure permissões: `chat:write`, `channels:read`
3. Gere Bot User OAuth Token
4. No n8n: Settings → Credentials → New → Slack API

---

### 8. SMTP / Gmail (E-mails de Notificação)

| Campo | Valor |
|-------|-------|
| **Status** | ⚠️ **PENDENTE** |
| **Credencial n8n** | `SMTP (Portal Vesper)` |
| **Tipo** | `smtp` ou `gmailOAuth2` |
| **Obrigatória** | Não |
| **Fallback** | Sem e-mail → aprovação apenas via Portal |
| **Workflows** | WF Financeiro, Produção, Qualidade |

---

## Portal Vesper API Key (Crítico)

| Campo | Valor |
|-------|-------|
| **Status** | ✅ **CONFIGURADO** — `dev_portal_key_123` |
| **Credencial n8n** | `Portal Vesper API Key (Bearer)` |
| **Tipo** | `httpBearerAuth` |
| **Valor dev** | `dev_portal_key_123` |
| **Onde configurar** | n8n → Settings → Credentials → New → HTTP Bearer Auth |
| **Nome exato** | `Portal Vesper API Key (Bearer)` |
| **Variável Portal** | `VESPER_PORTAL_API_KEY` |
| **URL base** | `http://host.docker.internal:8000` |
| **Obrigatória** | ✅ **Sim — obrigatória para todos os workflows** |

**Como configurar no n8n:**
1. n8n → Settings → Credentials → New → HTTP Bearer Token
2. Nome: `Portal Vesper API Key (Bearer)`
3. Token: `dev_portal_key_123`
4. Salvar

---

## Implementando Fallback de IA nos Workflows

Para implementar fallback real no n8n, o padrão recomendado é:

```javascript
// Code Node — Fallback de IA
// Execute após o AI Agent com onError: continueErrorOutput

const error = $input.item.json.error;
const provider = $json.provider || 'openai';

if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
  // Rate limit — tentar próximo provedor
  return [{ json: { fallback_to: 'gemini', reason: 'rate_limit', original_error: error } }];
} else if (error?.status >= 500) {
  // Erro de servidor — tentar próximo provedor  
  return [{ json: { fallback_to: 'ollama', reason: 'server_error', original_error: error } }];
} else {
  // Erro desconhecido — resposta controlada
  return [{ json: { 
    fallback_to: 'deterministic',
    success: false,
    message: 'Serviço de IA temporariamente indisponível. Por favor, tente novamente em instantes.',
    original_error: error
  }}];
}
```

> **NOTA:** Os workflows importados ainda não têm fallback de IA implementado nos nós.
> O fallback deve ser configurado manualmente ao ativar cada workflow.
> A ordem recomendada de ativação está documentada em `N8N_AI_GENERATED_WORKFLOWS_INTEGRATION_REPORT.md`.
