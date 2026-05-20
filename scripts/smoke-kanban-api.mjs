import fs from "node:fs/promises";
import path from "node:path";

const runtimeConfigPath = path.join(process.cwd(), "apps/web/public/runtime-config.json");
const baseUrl = await resolveApiBaseUrl();
const requiredPaths = [
  "/api/kanban/boards",
  "/api/kanban/boards/from-template",
  "/api/kanban/contexts",
  "/api/kanban/templates",
  "/api/kanban/producao/ops",
  "/api/kanban/producao/dashboard",
  "/api/kanban/producao/tv",
];

async function run() {
  console.log(`Validando API em ${baseUrl}`);
  await validateHealth();
  await validateOpenApi();
  console.log("Smoke API: OK");
}

async function resolveApiBaseUrl() {
  const envUrl = process.env.SMOKE_API_BASE_URL;
  if (envUrl) return envUrl;

  try {
    const raw = await fs.readFile(runtimeConfigPath, "utf8");
    const config = JSON.parse(raw);
    if (config.apiBaseUrl) {
      return config.apiBaseUrl;
    }
  } catch {
    // ignore missing or unreadable runtime config
  }

  return "http://localhost:8002";
}

async function validateHealth() {
  const response = await fetch(`${baseUrl}/api/health`, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Health check falhou: HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (payload.status !== "ok") {
    throw new Error(`Health check inválido: ${JSON.stringify(payload)}`);
  }
  console.log("Health OK");
}

async function validateOpenApi() {
  const response = await fetch(`${baseUrl}/openapi.json`, { method: "GET" });
  if (!response.ok) {
    throw new Error(`OpenAPI falhou: HTTP ${response.status}`);
  }
  const payload = await response.json();
  const available = Object.keys(payload.paths ?? {});
  const missing = requiredPaths.filter((path) => !available.includes(path));
  if (missing.length > 0) {
    throw new Error(`OpenAPI faltando rotas: ${missing.join(", ")}`);
  }
  console.log("OpenAPI OK");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
