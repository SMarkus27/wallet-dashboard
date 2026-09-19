const MFA_TOKEN_MARKER = "login token";

export const AUTH_MESSAGES = {
  credentials: "E-mail ou senha incorretos. Verifique e tente novamente.",
  inactive: "Esta conta está desativada. Fale com o suporte para reativá-la.",
  invalidEmail: "Informe um e-mail válido.",
  invalidCode: "Código inválido. Confira o aplicativo autenticador.",
  expiredChallenge:
    "A confirmação expirou. Entre com e-mail e senha novamente.",
  unavailable: "Não foi possível falar com o servidor. Tente novamente.",
  unexpected: "Algo deu errado. Tente novamente em instantes.",
} as const;

export function signinMessage(status: number) {
  if (status === 401) return AUTH_MESSAGES.credentials;
  if (status === 403) return AUTH_MESSAGES.inactive;
  if (status === 422) return AUTH_MESSAGES.invalidEmail;
  return AUTH_MESSAGES.unexpected;
}

export function challengeExpired(status: number, detail: string) {
  return status === 400 && detail.toLowerCase().includes(MFA_TOKEN_MARKER);
}

export function mfaMessage(status: number, detail: string) {
  if (challengeExpired(status, detail)) return AUTH_MESSAGES.expiredChallenge;
  if (status === 400) return AUTH_MESSAGES.invalidCode;
  if (status === 403) return AUTH_MESSAGES.inactive;
  if (status === 422) return AUTH_MESSAGES.invalidCode;
  return AUTH_MESSAGES.unexpected;
}
