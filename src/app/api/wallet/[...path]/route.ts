import type { NextRequest } from "next/server";

import {
  extractTokensFromBody,
  extractTokensFromSetCookie,
  upstreamFetch,
} from "@/lib/api/upstream";
import {
  clearSessionTokens,
  readSessionTokens,
  writeSessionTokens,
  type SessionTokens,
} from "@/lib/auth/session";

type RouteContext = { params: Promise<{ path: string[] }> };

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const targetPath = `/${path.join("/")}`;
  const tokens = await readSessionTokens();

  const body = METHODS_WITHOUT_BODY.has(request.method)
    ? null
    : await request.text();

  const upstream = await upstreamFetch({
    path: targetPath,
    method: request.method,
    search: request.nextUrl.search,
    body: body && body.length > 0 ? body : null,
    contentType: request.headers.get("content-type"),
    tokens,
  });

  const rawBody = await upstream.text();
  const payload = parseJson(rawBody);

  const issued: SessionTokens = {
    ...extractTokensFromSetCookie(upstream),
    ...extractTokensFromBody(payload),
  };

  const response = new Response(bodyFor(payload, rawBody, issued), {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });

  if (isLogout(targetPath) || upstream.status === 401) {
    clearSessionTokens(response);
    return response;
  }

  writeSessionTokens(response, issued);
  return response;
}

function parseJson(raw: string): unknown {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function bodyFor(payload: unknown, raw: string, issued: SessionTokens) {
  if (!issued.accessToken || payload === null) return raw || "null";

  return JSON.stringify({
    ...(payload as Record<string, unknown>),
    data: { authenticated: true },
  });
}

function isLogout(path: string) {
  return path === "/investor/auth/logout";
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;

export const dynamic = "force-dynamic";
