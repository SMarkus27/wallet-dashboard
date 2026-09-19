import type { ApiEnvelope } from "@/lib/api/types";

const BFF_PREFIX = "/api/wallet";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type ClientQueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export function clientSearch(params: ClientQueryParams = {}) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.set(key, String(value));
  }

  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}

async function request<T>(
  path: string,
  init: RequestInit & { params?: ClientQueryParams } = {},
): Promise<T> {
  const { params, ...options } = init;
  const response = await fetch(`${BFF_PREFIX}${path}${clientSearch(params)}`, {
    ...options,
    headers: {
      accept: "application/json",
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const raw = await response.text();
  const payload = raw ? (JSON.parse(raw) as ApiEnvelope<T> & { detail?: string }) : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.detail ?? payload?.message ?? `Falha na requisição (${response.status}).`,
    );
  }

  return (payload?.data ?? null) as T;
}

export const api = {
  get: <T>(path: string, params?: ClientQueryParams) =>
    request<T>(path, { method: "GET", params }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
};
