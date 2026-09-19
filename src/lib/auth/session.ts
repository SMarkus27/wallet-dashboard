import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
} from "@/lib/auth/cookies";

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };

export const UPSTREAM_ACCESS_TOKEN_COOKIE =
  process.env.WALLET_ACCESS_TOKEN_COOKIE_NAME ?? "access_token";

export const UPSTREAM_REFRESH_TOKEN_COOKIE =
  process.env.WALLET_REFRESH_TOKEN_COOKIE_NAME ?? "refresh_token";

export type SessionTokens = {
  accessToken?: string;
  refreshToken?: string;
};

export async function readSessionTokens(): Promise<SessionTokens> {
  const store = await cookies();
  return {
    accessToken: store.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: store.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}

export async function hasSession(): Promise<boolean> {
  const { accessToken, refreshToken } = await readSessionTokens();
  return Boolean(accessToken || refreshToken);
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function writeSessionTokens(response: Response, tokens: SessionTokens) {
  if (tokens.accessToken) {
    appendCookie(
      response,
      ACCESS_TOKEN_COOKIE,
      tokens.accessToken,
      ACCESS_TOKEN_MAX_AGE,
    );
  }

  if (tokens.refreshToken) {
    appendCookie(
      response,
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      REFRESH_TOKEN_MAX_AGE,
    );
  }
}

export function clearSessionTokens(response: Response) {
  appendCookie(response, ACCESS_TOKEN_COOKIE, "", 0);
  appendCookie(response, REFRESH_TOKEN_COOKIE, "", 0);
}

function appendCookie(
  response: Response,
  name: string,
  value: string,
  maxAge: number,
) {
  const options = sessionCookieOptions(maxAge);
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
    `SameSite=Lax`,
    "HttpOnly",
  ];

  if (options.secure) parts.push("Secure");

  response.headers.append("set-cookie", parts.join("; "));
}
