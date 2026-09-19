const DEFAULT_WALLET_API_URL = "http://127.0.0.1:8000";

export const walletApiUrl = (
  process.env.WALLET_API_URL ?? DEFAULT_WALLET_API_URL
).replace(/\/+$/, "");

export const walletApiPrefix = "/api/v1";
