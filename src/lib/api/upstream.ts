import { walletApiPrefix, walletApiUrl } from "@/lib/env";
import {
  UPSTREAM_ACCESS_TOKEN_COOKIE,
  UPSTREAM_REFRESH_TOKEN_COOKIE,
  type SessionTokens,
} from "@/lib/auth/session";
import type { ApiEnvelope } from "@/lib/api/types";

export type UpstreamRequest = {
  path: string;
  method?: string;
  search?: string;
  body?: BodyInit | null;
  contentType?: string | null;
  tokens?: SessionTokens;
};

export class UpstreamError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "UpstreamError";
    this.status = status;
  }
}

export function buildUpstreamUrl(path: string, search = "") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${walletApiUrl}${walletApiPrefix}${normalized}${search}`;
}

export function buildCookieHeader(tokens: SessionTokens | undefined) {
  if (!tokens) return undefined;

  const pairs: string[] = [];
  if (tokens.accessToken) {
    pairs.push(`${UPSTREAM_ACCESS_TOKEN_COOKIE}=${tokens.accessToken}`);
  }
  if (tokens.refreshToken) {
    pairs.push(`${UPSTREAM_REFRESH_TOKEN_COOKIE}=${tokens.refreshToken}`);
  }

  return pairs.length > 0 ? pairs.join("; ") : undefined;
}

export async function upstreamFetch({
  path,
  method = "GET",
  search = "",
  body = null,
  contentType,
  tokens,
}: UpstreamRequest) {
  const headers = new Headers({ accept: "application/json" });
  const cookie = buildCookieHeader(tokens);

  if (cookie) headers.set("cookie", cookie);
  if (contentType) headers.set("content-type", contentType);

  return fetch(buildUpstreamUrl(path, search), {
    method,
    headers,
    body,
    cache: "no-store",
    redirect: "manual",
  });
}

export function extractTokensFromSetCookie(response: Response): SessionTokens {
  const raw =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];

  const tokens: SessionTokens = {};

  for (const entry of raw) {
    const [pair] = entry.split(";");
    if (!pair) continue;

    const separator = pair.indexOf("=");
    if (separator < 0) continue;

    const name = pair.slice(0, separator).trim();
    const value = decodeURIComponent(pair.slice(separator + 1).trim());

    if (!value) continue;
    if (name === UPSTREAM_ACCESS_TOKEN_COOKIE) tokens.accessToken = value;
    if (name === UPSTREAM_REFRESH_TOKEN_COOKIE) tokens.refreshToken = value;
  }

  return tokens;
}

export function extractTokensFromBody(payload: unknown): SessionTokens {
  if (!payload || typeof payload !== "object") return {};

  const data = (payload as ApiEnvelope<unknown>).data;
  if (!data || typeof data !== "object") return {};

  const candidate = data as Record<string, unknown>;
  const accessToken = candidate.access_token;
  const refreshToken = candidate.refresh_token;

  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    return {};
  }

  return { accessToken, refreshToken };
}
