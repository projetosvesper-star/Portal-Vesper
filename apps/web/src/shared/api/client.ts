import { useAuthStore } from "../auth/store";
import { getRuntimeConfig } from "../config/runtimeConfig";

type RequestOptions = RequestInit & {
  auth?: boolean;
  retry?: boolean;
};

export class ApiRequestError extends Error {
  status?: number;
  url: string;
  method: string;

  constructor(message: string, args: { status?: number; url: string; method: string }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = args.status;
    this.url = args.url;
    this.method = args.method;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const requestOptions = { retry: true, ...options };
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (options.auth !== false) {
    const token = useAuthStore.getState().accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const apiBaseUrl = getRuntimeConfig().apiBaseUrl;
  const url = `${apiBaseUrl}${path}`;
  const method = (options.method ?? "GET").toString().toUpperCase();

  if (import.meta.env.DEV) {
    // Log leve apenas para desenvolvimento (útil para debug de CORS/Failed to fetch).
    // eslint-disable-next-line no-console
    console.debug("[apiRequest]", { method, url });
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    const apiBaseUrl = getRuntimeConfig().apiBaseUrl;
    const hint =
      `Falha de rede/CORS. Verifique se o backend está em ${apiBaseUrl || window.location.origin} e se CORS_ORIGINS inclui ${window.location.origin}.`;
    throw new ApiRequestError(hint, { url, method });
  }
  if (response.status === 401 && options.auth !== false && requestOptions.retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retry: false });
    }
    useAuthStore.getState().clearSession();
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "Erro inesperado" }));
    const detail = typeof payload.detail === "string" ? payload.detail : "Requisição inválida";
    const msg = `${detail} (HTTP ${response.status})`;
    throw new ApiRequestError(msg, { status: response.status, url, method });
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function refreshAccessToken(): Promise<boolean> {
  const { refreshToken, user, setSession } = useAuthStore.getState();
  if (!refreshToken || !user) return false;
  try {
    const apiBaseUrl = getRuntimeConfig().apiBaseUrl;
    const response = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) return false;
    const payload = (await response.json()) as {
      access_token: string;
      refresh_token: string;
    };
    setSession(payload.access_token, payload.refresh_token, user);
    return true;
  } catch {
    return false;
  }
}
