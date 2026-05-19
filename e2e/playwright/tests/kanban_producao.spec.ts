import { expect, test } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5174";
const adminUser = process.env.E2E_ADMIN_USERNAME ?? "Admin";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Vesper@890";

test("smoke: Kanban Producao UI flow", async ({ page }) => {
  const opNumber = `OP-E2E-${Date.now()}`;

  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("Username").fill(adminUser);
  await page.getByLabel("Senha").fill(adminPassword);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);

  const sidebar = page.getByRole("navigation");
  await expect(sidebar.getByText(/^Kanban$/)).toBeVisible();
  await expect(sidebar.getByText(/Kanban Producao/i)).toHaveCount(0);

  await sidebar.getByText(/^Kanban$/).click();
  await expect(page).toHaveURL(/\/kanban/);
  await expect(page.getByRole("heading", { name: "Kanban" })).toBeVisible();

  await page.getByLabel("Contexto").selectOption({ label: "Producao" });
  await expect(page).toHaveURL(/\/kanban\/producao/);
  await expect(page.getByRole("heading", { name: "Kanban Producao" })).toBeVisible();

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
  await expect(drawer.getByText("Cliente E2E Editado")).toBeVisible();

  await drawer.getByRole("button", { name: "Checklist" }).click();
  const firstChecklist = drawer.getByRole("checkbox").first();
  if ((await firstChecklist.count()) > 0) {
    await firstChecklist.check();
  }

  await drawer.getByRole("button", { name: /Arquivar/ }).click();
  await expect(drawer.getByRole("button", { name: /Restaurar/ })).toBeVisible();
  await drawer.getByRole("button", { name: /Restaurar/ }).click();
  await expect(drawer.getByRole("button", { name: /Arquivar/ })).toBeVisible();

  await drawer.getByRole("button", { name: "Fechar" }).click();
  await expect(drawer).toHaveCount(0);

  await expect(page.getByText("TV/Foco simples")).toBeVisible();
  await page.getByRole("button", { name: "Kanban" }).last().click();
  await expect(page.getByText(/Nenhum cartao disponivel|Aberta|Em andamento|Aguardando|Pronta|Arquivada/)).toBeVisible();
});
