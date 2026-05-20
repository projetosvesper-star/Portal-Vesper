# N8N Enterprise Security Audit

## Resultado

Nenhum segredo real foi impresso ou gravado nos relatorios. Nenhum `.env` foi commitado ou exposto. Nenhum git push foi executado.

## Achados

| Severidade | Achado | Estado |
| --- | --- | --- |
| Alta | 12 workflows AI nao podem ser ativados sem credenciais e/ou correcao estrutural | Mantidos inativos |
| Alta | Nodes externos de email/Slack/Gmail em workflows AI poderiam notificar fora do Portal | Nodes externos encontrados foram desativados quando seguro |
| Alta | Acoes sensiveis nao podem rodar sem Approval Center | Approval Center preservado e testado |
| Media | Workflows antigos possuem textos/sticky nodes citando `VESPER_PORTAL_API_KEY` | Nao sao segredo real, mas devem continuar em redaction/revisao |
| Media | Alguns workflows usam URLs de desenvolvimento `host.docker.internal` ou `127.0.0.1` | Aceitavel localmente; documentar para producao |
| Media | Alguns workflows AI dependem de SMTP/OpenAI antes de ativar | Documentado |
| Baixa | Workflow extra `My workflow` usa Ollama e esta inativo | Preservado, sem acao |

## Acoes aplicadas

- Backup completo antes de alteracoes.
- `errorWorkflow` configurado nos 12 workflows AI hardenizados.
- Timeouts adicionados em HTTP Request dos AI workflows quando o node permitiu.
- Nodes externos de notificacao em AI workflows desativados quando detectados.
- Ativacao bloqueada quando o n8n reportou erro ou credencial ausente.

## Regras mantidas

- Compra final exige aprovacao.
- Envio de proposta exige aprovacao.
- Pagamento exige aprovacao.
- Reset de senha e alteracao de acesso exigem aprovacao.
- Alteracao critica de OP/Kanban exige aprovacao.
- Qualidade/INMETRO/CAPA exige fonte e revisao humana.
