import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookies";

const LOGIN_ROUTE = "/login";
const RESET_ROUTE = "/reset-password";
const PUBLIC_ROUTES = [LOGIN_ROUTE, "/forgot-password"];
const DEFAULT_ROUTE = "/resumo";
const REDIRECT_PARAM = "next";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = Boolean(
    request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ??
      request.cookies.get(REFRESH_TOKEN_COOKIE)?.value,
  );

  if (!authenticated && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_ROUTE;
    url.search = "";

    if (pathname !== "/") url.searchParams.set(REDIRECT_PARAM, pathname);

    return NextResponse.redirect(url);
  }

  if (authenticated && pathname === LOGIN_ROUTE) {
    const url = request.nextUrl.clone();
    url.pathname = DEFAULT_ROUTE;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

function isPublic(pathname: string) {
  return (
    PUBLIC_ROUTES.includes(pathname) || pathname.startsWith(`${RESET_ROUTE}/`)
  );
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
