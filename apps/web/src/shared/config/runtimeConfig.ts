export type RuntimeConfig = {
  apiBaseUrl: string;
  wsBaseUrl: string;
  frontendUrl: string;
  environment: "development" | "staging" | "production";
  backendPort: number;
  frontendPort: number;
  generatedAt: string;
};

let cachedRuntimeConfig: RuntimeConfig | null = null;

const defaultRuntimeConfig: RuntimeConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.trim() || "",
  frontendUrl: typeof window !== "undefined" ? window.location.origin : "",
  wsBaseUrl: "",
  environment: (import.meta.env.MODE as RuntimeConfig["environment"]) ?? "development",
  backendPort: 0,
  frontendPort: 0,
  generatedAt: new Date().toISOString(),
};

function buildWebSocketUrl(apiBaseUrl: string) {
  if (apiBaseUrl.startsWith("ws:") || apiBaseUrl.startsWith("wss:")) {
    return apiBaseUrl;
  }

  if (!apiBaseUrl) {
    return "ws://localhost/ws";
  }

  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  return url.toString();
}

function normalizeRuntimeConfig(value: Partial<RuntimeConfig>): RuntimeConfig {
  const apiBaseUrl = value.apiBaseUrl?.trim() ?? defaultRuntimeConfig.apiBaseUrl;
  const frontendUrl = value.frontendUrl?.trim() || defaultRuntimeConfig.frontendUrl;
  const environment = (value.environment as RuntimeConfig["environment"]) ?? defaultRuntimeConfig.environment;
  const backendPort = value.backendPort ?? (apiBaseUrl ? Number(new URL(apiBaseUrl).port || 0) : 0);
  const frontendPort = value.frontendPort ?? (frontendUrl ? Number(new URL(frontendUrl).port || 0) : 0);
  const wsBaseUrl = value.wsBaseUrl?.trim() || buildWebSocketUrl(apiBaseUrl || frontendUrl);

  return {
    apiBaseUrl,
    wsBaseUrl,
    frontendUrl,
    environment,
    backendPort,
    frontendPort,
    generatedAt: value.generatedAt ?? new Date().toISOString(),
  };
}

export async function initializeRuntimeConfig(): Promise<RuntimeConfig> {
  if (cachedRuntimeConfig) return cachedRuntimeConfig;
  try {
    const response = await fetch("/runtime-config.json", { cache: "no-store" });
    if (!response.ok) throw new Error("runtime-config not found");
    const payload = (await response.json()) as Partial<RuntimeConfig>;
    cachedRuntimeConfig = normalizeRuntimeConfig(payload);
    return cachedRuntimeConfig;
  } catch {
    cachedRuntimeConfig = normalizeRuntimeConfig(defaultRuntimeConfig);
    return cachedRuntimeConfig;
  }
}

export function getRuntimeConfig(): RuntimeConfig {
  return cachedRuntimeConfig ?? normalizeRuntimeConfig(defaultRuntimeConfig);
}
