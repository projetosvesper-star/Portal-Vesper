import { useAuthStore } from "../auth/store";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type RequestOptions = RequestInit & {
  auth?: boolean;
  retry?: boolean;
};

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

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401 && options.auth !== false && requestOptions.retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retry: false });
    }
    useAuthStore.getState().clearSession();
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "Erro inesperado" }));
    throw new Error(typeof payload.detail === "string" ? payload.detail : "Requisicao invalida");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function refreshAccessToken(): Promise<boolean> {
  const { refreshToken, user, setSession } = useAuthStore.getState();
  if (!refreshToken || !user) return false;
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
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
