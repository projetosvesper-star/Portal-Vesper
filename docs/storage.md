# Storage

Arquivos do Portal Vesper devem passar pelo `StorageService` do backend. O frontend e o Tauri nao acessam MinIO diretamente.

Buckets iniciais:

- `portal-files`
- `portal-avatars`
- `portal-chat`
- `portal-propostas`
- `portal-compras`
- `portal-helpdesk`
- `portal-templates`

O NAS da empresa pode ser usado como backup, espelho ou fonte de importacao, mas nao deve ser dependencia direta dos clientes desktop.

Metadados de arquivos ficam na tabela `files`; o binario fica no MinIO.

## Validacoes iniciais

- Bucket precisa estar na lista inicial permitida.
- Arquivo vazio e rejeitado.
- Tamanho maximo configuravel por `MAX_UPLOAD_SIZE_MB`.
- Tipos permitidos configuraveis por `ALLOWED_UPLOAD_CONTENT_TYPES`.
- Quando `module_key` e informado, o backend verifica acesso ao modulo.
