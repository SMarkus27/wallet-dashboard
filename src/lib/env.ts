import "server-only";

const DEVELOPMENT_WALLET_API_URL = "http://127.0.0.1:8000";

const DEFAULT_WALLET_API_PREFIX = "/api/v1";

const MISSING_WALLET_API_URL =
  "WALLET_API_URL não configurada: defina a origem da API do Wallet no ambiente.";

export function walletApiUrl() {
  const configured = process.env.WALLET_API_URL?.trim();

  if (configured) return withoutTrailingSlash(configured);

  if (process.env.NODE_ENV === "production") {
    throw new Error(MISSING_WALLET_API_URL);
  }

  return DEVELOPMENT_WALLET_API_URL;
}

export function walletApiPrefix() {
  const configured = process.env.WALLET_API_PREFIX;

  if (configured === undefined) return DEFAULT_WALLET_API_PREFIX;

  return asPrefix(configured.trim());
}

function withoutTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function asPrefix(value: string) {
  const trimmed = withoutTrailingSlash(value);

  if (!trimmed) return "";

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
