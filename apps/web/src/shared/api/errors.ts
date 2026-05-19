import { ApiRequestError } from "./client";

export type FormattedApiError = {
  message: string;
  details?: string[];
  status?: number;
  url?: string;
  method?: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "mesma origem do frontend";

export function formatApiError(error: unknown, fallback = "Não foi possível carregar este recurso."): FormattedApiError {
  if (error instanceof ApiRequestError) {
    const details = import.meta.env.DEV
      ? [
          `Endpoint: ${error.url}`,
          `Status: HTTP ${error.status}`,
          `Base configurada: ${apiBaseUrl}`,
          "Sugestão: reinicie o backend atual, confira VITE_API_BASE_URL, verifique /api/docs e confirme se a porta 8000 não está presa por um processo antigo.",
        ]
      : undefined;

    if (error.status === 404) {
      return {
        message:
          "Não foi possível carregar este recurso. A rota da API não foi encontrada. Verifique se o backend ativo está atualizado e se /api/docs lista esta rota.",
        details,
        status: error.status,
        url: error.url,
      };
    }
    return {
      message: error.message || fallback,
      details,
      status: error.status,
      url: error.url,
    };
  }
  if (error instanceof Error) return { message: error.message || fallback };
  return { message: fallback };
}

export function getApiErrorMessage(error: unknown, fallback = "Não foi possível carregar este recurso.") {
  const formatted = formatApiError(error, fallback);
  const devDetails = import.meta.env.DEV && formatted.details?.length ? ` ${formatted.details.join(" ")}` : "";
  return `${formatted.message}${devDetails}`;
}
