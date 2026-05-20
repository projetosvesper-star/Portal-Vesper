# N8N External Notifications Fix

## Politica aplicada

Notificacoes externas por Slack, Gmail, SMTP, Telegram ou Twilio nao devem bloquear ativacao nem enviar conteudo sensivel sem Approval Center.

## Correcao aplicada

- `Slack account` foi detectada e mapeada quando o node Slack existia.
- Nodes Slack/Gmail/EmailSend inseguros foram removidos/desconectados do grafo ativo dos AI workflows.
- SMTP deixou de bloquear Compras AI porque `Notificar Conclusao` foi removido do grafo ativo.
- Nenhuma credencial SMTP nova foi criada.

## Estado

Slack pode ser reintroduzido depois, mas somente para notificacoes aprovadas e revisadas. SMTP ainda e pendente se a empresa quiser email externo real pelo n8n.
