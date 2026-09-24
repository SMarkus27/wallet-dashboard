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

export function detailOf(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";

  const detail = (payload as { detail?: unknown }).detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        item && typeof item === "object" && "msg" in item
          ? withoutPydanticPrefix(String((item as { msg: unknown }).msg))
          : "",
      )
      .filter(Boolean)
      .join(" ");
  }

  if (detail && typeof detail === "object" && "message" in detail) {
    return String((detail as { message: unknown }).message);
  }

  const message = (payload as { message?: unknown }).message;
  return typeof message === "string" ? message : "";
}

function withoutPydanticPrefix(message: string) {
  return message.replace(/^Value error,\s*/, "");
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
  const payload = parse(raw);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      detailOf(payload) || `Falha na requisição (${response.status}).`,
    );
  }

  return ((payload as ApiEnvelope<T> | null)?.data ?? null) as T;
}

function parse(raw: string): unknown {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
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
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
