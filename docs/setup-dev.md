# Setup de Desenvolvimento

1. Instale Docker Desktop, Node.js 20+, npm 10+, Python 3.12+ e Rust stable.
2. Copie `.env.example` para `.env`.
3. Troque senhas e chaves no `.env`.
4. Rode `npm run infra:up`.
5. No backend, rode `pip install -e ".[dev]"`.
6. Rode `npm run backend:migrate`.
7. Rode `npm run backend:seed`.
8. Rode `npm run backend:dev`.
9. Rode `npm run dev:web`.
10. Para desktop, rode `npm run dev:desktop`.

API: `http://localhost:8000/api/docs`

Frontend: `http://127.0.0.1:5174`

`npm run infra:up` sobe PostgreSQL, Redis, MinIO e pgAdmin. O Compose tambem possui servicos `backend` e `worker` no profile `app`; para subir tudo em container, use `npm run infra:app`.

## Observacoes Windows

- Use Docker Desktop com WSL 2 habilitado.
- Crie o ambiente Python em `backend/.venv`.
- Os scripts `backend:*` usam `backend/.venv/Scripts/python`.
- O Portal Vesper usa `5174` em desenvolvimento para evitar conflito com outros projetos Vite locais.

O Vite usa `5174` com porta estrita; se ela estiver ocupada, pare o processo conflitante antes de rodar o portal.

## Tauri

Instale Rust stable via `rustup.rs`. Confirme com:

```bash
cargo --version
```

Sem `cargo` no PATH, `npm run dev:desktop` e `npm run build:desktop` nao conseguem compilar o shell Tauri.
