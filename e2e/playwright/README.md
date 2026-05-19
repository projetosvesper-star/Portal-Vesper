Playwright Smoke Tests (Kanban Produção)

These are smoke test specs for the Kanban Produção UI. Playwright is not installed by default in this repository — run the commands below locally to install and run tests.

Install (project root):

```bash
npm install -D @playwright/test
npx playwright install
```

Run tests (from repo root):

```bash
npx playwright test e2e/playwright --project=chromium
```

Notes:
- Tests assume a running backend and frontend at the URLs configured in the web app.
- Update credentials and selectors as needed for the environment.
