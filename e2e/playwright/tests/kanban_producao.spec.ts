import { expect, test } from "@playwright/test";

const adminUser = process.env.E2E_ADMIN_USERNAME ?? "Admin";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Vesper@890";
const candidateFrontendUrls = [
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5176",
  "http://127.0.0.1:5177",
];

async function resolveRuntimeConfig(request) {
  const providedUrl = process.env.E2E_BASE_URL;
  if (providedUrl) {
    return {
      frontendUrl: providedUrl,
      apiBaseUrl: process.env.E2E_API_BASE_URL ?? providedUrl.replace(/:\d+$/, ":8002"),
    };
  }

  for (const frontendUrl of candidateFrontendUrls) {
    try {
      const response = await request.get(`${frontendUrl}/runtime-config.json`, { timeout: 5000 });
      if (!response.ok) continue;
      const config = await response.json();
      return {
        frontendUrl: config.frontendUrl || frontendUrl,
        apiBaseUrl: process.env.E2E_API_BASE_URL ?? config.apiBaseUrl ?? "http://localhost:8002",
      };
    } catch {
      continue;
    }
  }

  throw new Error("Não foi possível resolver o runtime config. Forneça E2E_BASE_URL ou verifique o frontend em uma porta válida.");
}

test("smoke: Kanban Producao UI flow", async ({ page, request }) => {
  const { frontendUrl } = await resolveRuntimeConfig(request);
  const opNumber = `OP-E2E-${Date.now()}`;

  await page.goto(`${frontendUrl}/login`);
  await page.getByLabel("Username").fill(adminUser);
  await page.getByLabel("Senha").fill(adminPassword);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);

  const sidebar = page.getByRole("navigation");
  await expect(sidebar.getByText(/^Kanban$/)).toBeVisible();
  await expect(sidebar.getByText(/Kanban Producao/i)).toHaveCount(0);

  await sidebar.getByText(/^Kanban$/).click();
  await expect(page).toHaveURL(/\/kanban/);
  await expect(page.getByRole("heading", { name: "Kanban", exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Producao OPs simples|Produção OPs simples/i }).click();
  await expect(page).toHaveURL(/\/kanban\/producao/);
  await expect(page.getByRole("heading", { name: "Kanban Producao", exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Nova OP/ }).click();
  await page.getByLabel("Numero OP").fill(opNumber);
  await page.getByLabel("Cliente").fill("Cliente E2E");
  await page.getByLabel("Projeto").fill("Projeto E2E");
  await page.getByLabel("Modelo").fill("Modelo E2E");
  await page.getByRole("button", { name: "Criar OP" }).click();

  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText(opNumber)).toBeVisible();

  await drawer.getByRole("button", { name: /Editar/ }).click();
  await drawer.getByLabel("Cliente").fill("Cliente E2E Editado");
  await drawer.getByRole("button", { name: "Salvar" }).click();
  await expect(drawer.getByText("Cliente E2E Editado", { exact: true })).toBeVisible();

  await drawer.getByRole("button", { name: "Checklist" }).click();
  const firstChecklist = drawer.getByRole("checkbox").first();
  if ((await firstChecklist.count()) > 0) {
    await firstChecklist.click();
  }

  await drawer.getByRole("button", { name: /Arquivar/ }).click();
  await expect(drawer.getByRole("button", { name: /Restaurar/ })).toBeVisible();
  await drawer.getByRole("button", { name: /Restaurar/ }).click();
  await expect(drawer.getByRole("button", { name: /Arquivar/ })).toBeVisible();

  await drawer.getByRole("button", { name: "Fechar" }).click();
  await expect(drawer).toHaveCount(0);

  await expect(page.getByText("TV/Foco simples")).toBeVisible();
  await page.getByRole("button", { name: "Kanban" }).last().click();
  await expect(page.getByText(/Abertas|Em andamento|Aguardando|Prontas|Arquivadas/).first()).toBeVisible();
});
