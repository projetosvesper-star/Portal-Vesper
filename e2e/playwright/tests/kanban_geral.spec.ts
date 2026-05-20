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

  throw new Error("Nao foi possivel resolver o runtime config. Forneca E2E_BASE_URL ou verifique o frontend em uma porta valida.");
}

test("smoke: Kanban configuravel fases 1 e 2", async ({ page, request }) => {
  const { frontendUrl, apiBaseUrl } = await resolveRuntimeConfig(request);
  const suffix = Date.now();
  const contextKey = `manutencao_${suffix}`;
  const contextName = `Manutencao ${suffix}`;
  const templateKey = `auditoria_${suffix}`;
  const templateName = `Auditoria ${suffix}`;
  const boardName = `E2E Config ${suffix}`;
  const cardTitle = `Tarefa E2E ${suffix}`;
  const cliente = `Cliente E2E ${suffix}`;
  const clienteEditado = `Cliente Editado ${suffix}`;

  await page.goto(`${frontendUrl}/login`);
  await page.getByLabel("Username").fill(adminUser);
  await page.getByLabel("Senha").fill(adminPassword);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);

  const sidebar = page.getByRole("navigation");
  await expect(sidebar.getByText(/^Kanban$/)).toBeVisible();
  await expect(sidebar.getByText(/Kanban Producao/i)).toHaveCount(0);

  await sidebar.getByText(/^Kanban$/).click();
  await expect(page).toHaveURL(/\/kanban$/);
  await expect(page.getByRole("heading", { name: "Kanban", exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Configurar Kanban/i }).click();
  const ocultarProjetos = page.getByRole("button", { name: /^Ocultar Projetos$/ });
  const reativarProjetos = page.getByRole("button", { name: /^Reativar Projetos$/ });
  if ((await ocultarProjetos.count()) === 0 && (await reativarProjetos.count()) > 0) {
    await reativarProjetos.first().click();
    await expect(page.getByRole("button", { name: /^Ocultar Projetos$/ })).toBeVisible();
  }
  await page.getByRole("button", { name: /^Ocultar Projetos$/ }).click();
  await expect(page.getByRole("button", { name: /^Reativar Projetos$/ })).toBeVisible();
  await page.getByRole("button", { name: /^Reativar Projetos$/ }).click();
  await expect(page.getByRole("button", { name: /^Ocultar Projetos$/ })).toBeVisible();
  await page.getByRole("button", { name: /^Ocultar Projetos$/ }).click();
  await expect(page.getByRole("button", { name: /^Reativar Projetos$/ })).toBeVisible();
  await page.getByLabel("Fechar").last().click();
  await expect(page.getByRole("button", { name: /Projetos Quadros de projetos/i })).toHaveCount(0);

  const apiLogin = await request.post(`${apiBaseUrl}/api/auth/login`, {
    data: { username: adminUser, password: adminPassword },
  });
  const token = (await apiLogin.json()).access_token;
  await request.patch(`${apiBaseUrl}/api/kanban/contexts/projetos`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { visible: true },
  });
  await page.reload();
  await expect(page.getByRole("button", { name: /Projetos Quadros de projetos/i })).toBeVisible();

  await page.getByRole("button", { name: /Configurar Kanban/i }).click();
  await page.getByRole("textbox", { name: "Key" }).fill(contextKey);
  await page.getByRole("textbox", { name: "Nome" }).fill(contextName);
  await page.getByRole("textbox", { name: "Descricao" }).fill("Fluxo de manutencao configurado no E2E.");
  await page.getByRole("textbox", { name: "Module context" }).fill(contextKey);
  await expect(page.getByRole("button", { name: /Criar contexto/i })).toBeEnabled();
  await page.getByRole("button", { name: /Criar contexto/i }).click();
  await expect(page.getByText(contextName).first()).toBeVisible();
  await page.getByRole("button", { name: "Templates" }).click();
  await page.getByRole("textbox", { name: "Key" }).fill(templateKey);
  await page.getByRole("textbox", { name: "Nome" }).fill(templateName);
  await page.getByRole("textbox", { name: "Descricao" }).fill("Template de auditoria criado no E2E.");
  await page.getByLabel("Contexto").fill(contextKey);
  await page.getByLabel("Singular").fill("Auditoria");
  await page.getByLabel("Plural").fill("Auditorias");
  await page.getByLabel("Botao").fill("Nova auditoria");
  await page.getByLabel("Colunas").fill("Entrada\nConferencia\nFechado");
  await page.getByRole("button", { name: /Criar template/i }).click();
  await expect(page.getByText(templateName).first()).toBeVisible();
  const templateRow = page.locator("section").filter({ hasText: templateName }).filter({ has: page.getByRole("button", { name: /Duplicar/i }) }).first();
  await templateRow.getByRole("button", { name: /Duplicar/i }).click();
  await expect(page.getByText(`${templateName} copia`).first()).toBeVisible();
  const duplicatedRow = page.locator("section").filter({ hasText: `${templateName} copia` }).filter({ has: page.getByRole("button", { name: /Arquivar/i }) }).first();
  await duplicatedRow.getByRole("button", { name: /Arquivar/i }).click();
  await expect(page.getByText(`${templateName} copia`).first()).toHaveCount(0);
  await page.getByLabel("Fechar").last().click();
  await expect(page.getByRole("button", { name: new RegExp(contextName) })).toBeVisible();

  await page.getByRole("button", { name: /Novo quadro/i }).first().click();
  await page.getByLabel("Nome").fill(boardName);
  await page.getByLabel("Template").click();
  await page.getByRole("option", { name: new RegExp(templateName) }).click();
  await page.getByRole("button", { name: "Criar quadro" }).click();

  await expect(page).toHaveURL(/\/kanban\/boards\//);
  await expect(page.getByRole("heading", { name: boardName })).toBeVisible();
  await expect(page.getByText("Entrada").first()).toBeVisible();
  await expect(page.getByText("Conferencia").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Nova auditoria/i })).toBeVisible();

  await page.getByRole("button", { name: /Configuracoes do quadro/i }).click();
  await page.getByRole("button", { name: "Terminologia" }).click();
  await page.getByLabel("Singular").fill("Tarefa");
  await page.getByLabel("Plural").fill("Tarefas");
  await page.getByLabel("Botao principal").fill("Nova tarefa");
  await page.getByLabel("Botao de edicao").fill("Editar tarefa");
  await page.getByLabel("Label do titulo").fill("Titulo da tarefa");
  await page.getByLabel("Label da descricao").fill("Descricao da tarefa");

  await page.getByRole("button", { name: "Campos" }).click();
  await page.getByLabel("Key").fill("cliente");
  await page.getByLabel("Label").fill("Cliente");
  await page.getByRole("button", { name: /Adicionar campo/i }).click();
  await page.getByRole("button", { name: /Salvar configuracao/i }).click();

  await expect(page.getByRole("button", { name: /Nova tarefa/i })).toBeVisible();

  await page.getByRole("button", { name: /Nova tarefa/i }).click();
  await page.getByLabel("Titulo da tarefa *").fill(cardTitle);
  await page.getByLabel("Cliente").fill(cliente);
  await page.getByRole("button", { name: /Nova tarefa/i }).last().click();

  await expect(page.getByText(cardTitle)).toBeVisible();
  await expect(page.getByText(cliente).first()).toBeVisible();

  await page.getByText(cardTitle).click();
  await expect(page.getByText("Detalhes de Tarefa")).toBeVisible();
  await expect(page.getByText("Cliente").last()).toBeVisible();
  await expect(page.getByText(cliente).first()).toBeVisible();
  await page.getByRole("button", { name: /Editar tarefa/i }).click();

  await page.getByLabel("Cliente").fill(clienteEditado);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(clienteEditado).first()).toBeVisible();

  await page.reload();
  await expect(page.getByText(clienteEditado).first()).toBeVisible();

  await page.goto(`${frontendUrl}/kanban/tv`);
  await expect(page.getByRole("heading", { name: "TV/Foco", exact: true })).toBeVisible();
  await page.getByLabel("Quadro").click();
  await page.getByRole("option", { name: new RegExp(boardName) }).click();
  await expect(page.getByText(clienteEditado).first()).toBeVisible();

  await page.goto(`${frontendUrl}/kanban/producao`);
  await expect(page.getByRole("heading", { name: /Kanban Producao/i })).toBeVisible();
  await expect(page.getByText(/Failed to fetch|HTTP 404|Falha ao carregar preview/i)).toHaveCount(0);
  await expect(page.locator("select")).toHaveCount(0);
});
