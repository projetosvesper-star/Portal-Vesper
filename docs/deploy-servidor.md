# Deploy no Servidor

Fluxo recomendado para o PC servidor dedicado:

1. Instalar Docker Desktop ou Docker Engine.
2. Clonar o repositorio no servidor.
3. Criar `.env` com senhas reais e `ENVIRONMENT=production`.
4. Ajustar `DATABASE_URL`, `REDIS_URL`, `MINIO_ENDPOINT`, `API_BASE_URL` e `WEB_BASE_URL`.
5. Subir PostgreSQL, Redis, MinIO e backend via Docker Compose.
6. Rodar migrations com `npm run backend:migrate`.
7. Rodar seed somente quando necessario.
8. Gerar build do frontend e instalador Tauri para os PCs.

Antes de producao:

- Trocar a senha do usuario Admin.
- Usar chaves JWT fortes.
- Configurar backup do PostgreSQL e MinIO.
- Definir politica de atualizacao do app desktop.
- Revisar firewall e acesso de rede.

## Backup futuro

- PostgreSQL: dump agendado e teste periodico de restore.
- MinIO: espelhamento ou backup incremental para NAS.
- Redis: persistencia AOF ja fica habilitada no desenvolvimento; em producao, definir politica conforme criticidade das filas.
- `.env`: guardar em cofre de senhas, nunca em repositorio.
