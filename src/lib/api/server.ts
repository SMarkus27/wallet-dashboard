import "server-only";

import { redirect } from "next/navigation";

import type { ApiEnvelope } from "@/lib/api/types";
import { UpstreamError, upstreamFetch } from "@/lib/api/upstream";
import { readSessionTokens } from "@/lib/auth/session";

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export function toSearch(params: QueryParams = {}) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.set(key, String(value));
  }

  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}

export async function apiGet<T>(path: string, params?: QueryParams): Promise<T> {
  const tokens = await readSessionTokens();
  const response = await upstreamFetch({
    path,
    search: toSearch(params),
    tokens,
  });

  if (response.status === 401) redirect("/login");

  const raw = await response.text();

  if (!response.ok) {
    throw new UpstreamError(response.status, messageFrom(raw, response.status));
  }

  const payload = JSON.parse(raw) as ApiEnvelope<T>;
  return payload.data;
}

function messageFrom(raw: string, status: number) {
  try {
    const payload = JSON.parse(raw) as { detail?: string; message?: string };
    return payload.detail ?? payload.message ?? `Falha na API (${status}).`;
  } catch {
    return `Falha na API (${status}).`;
  }
}
