Playwright Smoke Tests (Kanban Produção)

These are smoke test specs for the Kanban Produção UI. Playwright is not installed by default in this repository — run the commands below locally to install and run tests.

Install (project root):

```bash
npm install
npx playwright install
```

Run tests (from repo root):

```bash
npm run e2e -- --project=chromium
```

Optional environment variables:
- `E2E_BASE_URL` — frontend root URL used by Playwright
- `E2E_API_BASE_URL` — backend API URL used when runtime config is unavailable
- `E2E_ADMIN_USERNAME` / `E2E_ADMIN_PASSWORD` — login credentials for the smoke test

Notes:
- Tests assume a running backend and frontend at the URLs configured in the web app.
- Update credentials and selectors as needed for the environment.
