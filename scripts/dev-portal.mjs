import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "apps/web/public");
const RUNTIME_CONFIG_PATH = path.join(PUBLIC_DIR, "runtime-config.json");

const BACKEND_PORTS = [8000, 8002, 8003, 8004];
const FRONTEND_PORTS = [5174, 5175, 5176, 5177];
const REQUIRED_OPENAPI_PATHS = [
  "/api/kanban/boards",
  "/api/kanban/boards/from-template",
  "/api/kanban/contexts",
  "/api/kanban/templates",
  "/api/kanban/producao/ops",
  "/api/kanban/producao/dashboard",
  "/api/kanban/producao/tv",
];

const args = process.argv.slice(2);
if (args.includes("--clean")) {
  void cleanRuntimeConfig();
  process.exit(0);
}

await runDevPortal();

async function cleanRuntimeConfig() {
  try {
    await fs.rm(RUNTIME_CONFIG_PATH, { force: true });
    console.log("runtime-config.json removido com sucesso.");
  } catch (error) {
    console.error("Falha ao limpar runtime-config.json:", error);
    process.exit(1);
  }
}

async function runDevPortal() {
  await fs.mkdir(PUBLIC_DIR, { recursive: true });

  const frontendResult = await chooseFrontend();
  const frontendOrigin = `http://127.0.0.1:${frontendResult.port}`;
  const backendResult = await chooseBackend(frontendOrigin);

  const runtimeConfig = {
    apiBaseUrl: backendResult.apiBaseUrl,
    wsBaseUrl: backendResult.apiBaseUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:") + "/ws",
    frontendUrl: frontendOrigin,
    environment: "development",
    backendPort: backendResult.port,
    frontendPort: frontendResult.port,
    generatedAt: new Date().toISOString(),
  };

  await fs.writeFile(RUNTIME_CONFIG_PATH, JSON.stringify(runtimeConfig, null, 2), "utf8");
  console.log(`runtime-config gerado em ${RUNTIME_CONFIG_PATH}`);

  const frontendProcess = spawnFrontend(frontendResult.port, runtimeConfig.apiBaseUrl);
  if (backendResult.process) {
    listenForExit(frontendProcess, backendResult.process);
  } else {
    listenForExit(frontendProcess, null);
  }

  console.log("Portal Vesper DEV iniciado:");
  console.log(`  Frontend: http://127.0.0.1:${frontendResult.port}`);
  console.log(`  Backend: ${runtimeConfig.apiBaseUrl}`);
  console.log(`  Docs: ${runtimeConfig.apiBaseUrl}/api/docs`);
  console.log(`  WebSocket: ${runtimeConfig.wsBaseUrl}`);
}

function spawnFrontend(port, apiBaseUrl) {
  const env = {
    ...process.env,
    VITE_API_BASE_URL: apiBaseUrl,
  };

  const isWindows = process.platform === "win32";
  const command = isWindows ? "cmd.exe" : "npm";
  const args = isWindows
    ? ["/c", "npm", "exec", "--workspace=apps/web", "--", "vite", "--host", "0.0.0.0", "--strictPort", "--port", String(port)]
    : ["exec", "--workspace=apps/web", "--", "vite", "--host", "0.0.0.0", "--strictPort", "--port", String(port)];

  const child = spawn(command, args, {
    cwd: ROOT,
    env,
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    if (code !== null && code !== 0) process.exit(code);
  });

  return child;
}

function listenForExit(frontendProcess, backendProcess) {
  const cleanup = () => {
    if (backendProcess) backendProcess.kill();
    frontendProcess.kill();
    process.exit(0);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("uncaughtException", (error) => {
    console.error("Erro inesperado:", error);
    cleanup();
  });
}

async function chooseBackend(frontendOrigin) {
  for (const port of BACKEND_PORTS) {
    const apiBaseUrl = `http://localhost:${port}`;
    const portAvailable = await isPortAvailable(port);

    if (portAvailable) {
      const backendProcess = await spawnBackend(port, buildCorsOrigins(frontendOrigin));
      await waitForBackend(apiBaseUrl, frontendOrigin);
      return { port, apiBaseUrl, process: backendProcess };
    }

    try {
      await validateBackend(apiBaseUrl, frontendOrigin);
      console.log(`Porta ${port} ocupada por backend válido e com CORS compatível. Usando ${apiBaseUrl}.`);
      return { port, apiBaseUrl, process: null };
    } catch (error) {
      console.warn(`Porta ${port} ocupada, mas o backend não é válido para ${frontendOrigin}: ${(error instanceof Error ? error.message : String(error))}`);
      continue;
    }
  }

  throw new Error("Não foi possível encontrar uma porta de backend válida entre 8000, 8002, 8003 e 8004.");
}

async function chooseFrontend() {
  for (const port of FRONTEND_PORTS) {
    if (await isPortAvailable(port)) {
      return { port };
    }
  }
  throw new Error("Não foi possível encontrar uma porta de frontend livre entre 5174, 5175, 5176 e 5177.");
}

function buildCorsOrigins(frontendOrigin) {
  const origins = new Set([
    "http://localhost:1420",
    "tauri://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5176",
    "http://localhost:5177",
    "http://127.0.0.1:5177",
  ]);
  origins.add(frontendOrigin);
  try {
    const url = new URL(frontendOrigin);
    origins.add(`${url.protocol}//${url.hostname}:${url.port}`);
  } catch {
    // ignore invalid runtime value
  }
  return Array.from(origins).join(",");
}

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port }, () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", (error) => {
      const code = error?.code?.toString();
      resolve(code === "ECONNREFUSED" || code === "EHOSTUNREACH" || code === "ENOTFOUND" || code === "ECONNRESET");
    });
  });
}

async function spawnBackend(port, corsOrigins) {
  let pythonPath = process.platform === "win32"
    ? path.join(ROOT, "backend", ".venv", "Scripts", "python.exe")
    : path.join(ROOT, "backend", ".venv", "bin", "python");

  try {
    await fs.access(pythonPath);
  } catch {
    pythonPath = "python";
  }

  const env = {
    ...process.env,
    ENVIRONMENT: "development",
    CORS_ORIGINS: corsOrigins,
  };

  const child = spawn(
    pythonPath,
    ["-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", String(port), "--no-access-log"],
    {
      cwd: path.join(ROOT, "backend"),
      env,
      stdio: ["ignore", "inherit", "inherit"],
    },
  );

  child.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`backend finalizou com código ${code}`);
      process.exit(code);
    }
  });

  return child;
}

async function waitForBackend(apiBaseUrl, frontendOrigin) {
  const timeoutMs = 30000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await validateBackend(apiBaseUrl, frontendOrigin);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`Backend não respondeu em ${apiBaseUrl} dentro de ${timeoutMs}ms`);
}

async function validateBackend(apiBaseUrl, frontendOrigin) {
  const healthUrl = `${apiBaseUrl}/api/health`;
  const openapiUrl = `${apiBaseUrl}/openapi.json`;

  const healthResponse = await fetch(healthUrl, { method: "GET" });
  if (!healthResponse.ok) {
    throw new Error(`Falha em /api/health: HTTP ${healthResponse.status}`);
  }

  const healthPayload = await healthResponse.json();
  if (healthPayload.status !== "ok") {
    throw new Error(`Health inválido: ${JSON.stringify(healthPayload)}`);
  }

  const openapiResponse = await fetch(openapiUrl, { method: "GET" });
  if (!openapiResponse.ok) {
    throw new Error(`Falha em /openapi.json: HTTP ${openapiResponse.status}`);
  }

  const openapiPayload = await openapiResponse.json();
  const availablePaths = Object.keys(openapiPayload.paths ?? {});
  const missingPaths = REQUIRED_OPENAPI_PATHS.filter((path) => !availablePaths.includes(path));
  if (missingPaths.length > 0) {
    throw new Error(`OpenAPI faltando rotas esperadas: ${missingPaths.join(", ")}`);
  }

  await validateBackendCors(apiBaseUrl, frontendOrigin);
}

async function validateBackendCors(apiBaseUrl, frontendOrigin) {
  const corsUrl = `${apiBaseUrl}/api/auth/login`;
  const response = await fetch(corsUrl, {
    method: "OPTIONS",
    headers: {
      Origin: frontendOrigin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type,authorization",
    },
  });

  const allowedOrigin = response.headers.get("access-control-allow-origin");
  if (!allowedOrigin || (allowedOrigin !== "*" && allowedOrigin !== frontendOrigin)) {
    throw new Error(`CORS inválido para ${frontendOrigin}. access-control-allow-origin=${allowedOrigin}`);
  }
}
