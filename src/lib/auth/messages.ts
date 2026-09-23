const MFA_TOKEN_MARKER = "login token";
const RETRY_LIMIT_MARKER = "effort limit";
const ACCOUNT_EXISTS_MARKER = "already exists";

export const AUTH_MESSAGES = {
  credentials: "E-mail ou senha incorretos. Verifique e tente novamente.",
  inactive: "Esta conta está desativada. Fale com o suporte para reativá-la.",
  invalidEmail: "Informe um e-mail válido.",
  invalidCode: "Código inválido. Confira o aplicativo autenticador.",
  expiredChallenge:
    "A confirmação expirou. Entre com e-mail e senha novamente.",
  unavailable: "Não foi possível falar com o servidor. Tente novamente.",
  unexpected: "Algo deu errado. Tente novamente em instantes.",
  recoverySent:
    "Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha. O link vale por uma hora.",
  recoveryExpired:
    "Este link de redefinição expirou ou já foi usado. Peça um novo para continuar.",
  passwordMismatch: "As senhas não conferem.",
  sessionExpired: "Sua sessão expirou. Entre novamente para continuar.",
  signupEmailTaken:
    "Já existe uma conta com esse e-mail. Entre em vez de criar outra.",
  signupCodeSent:
    "Enviamos um código de 6 dígitos para o seu e-mail. Ele vale por duas horas.",
  signupCodeResent:
    "O código anterior expirou. Enviamos um novo para o seu e-mail.",
  signupInvalidCode: "Código inválido. Confira o e-mail e tente novamente.",
  signupRetryLimit:
    "Tentativas demais. Aguarde alguns minutos antes de tentar de novo.",
} as const;

export function recoveryMessage(status: number) {
  if (status === 422) return AUTH_MESSAGES.invalidEmail;
  return AUTH_MESSAGES.unexpected;
}

export function resetMessage(status: number, detail: string) {
  if (status === 409) return AUTH_MESSAGES.recoveryExpired;
  if (status === 422 && detail) return detail;
  if (status === 422) return AUTH_MESSAGES.unexpected;
  if (status === 403) return AUTH_MESSAGES.inactive;
  return AUTH_MESSAGES.unexpected;
}

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

export function signupMessage(status: number, detail: string) {
  if (status === 409) return AUTH_MESSAGES.signupEmailTaken;
  if (status === 403) return AUTH_MESSAGES.inactive;
  if (status === 422 && detail) return detail;
  return AUTH_MESSAGES.unexpected;
}

export function confirmSignupMessage(status: number, detail: string) {
  const normalized = detail.toLowerCase();

  if (status === 409 && normalized.includes(RETRY_LIMIT_MARKER)) {
    return AUTH_MESSAGES.signupRetryLimit;
  }

  if (status === 409 && normalized.includes(ACCOUNT_EXISTS_MARKER)) {
    return AUTH_MESSAGES.signupEmailTaken;
  }

  if (status === 409 || status === 422) return AUTH_MESSAGES.signupInvalidCode;

  return AUTH_MESSAGES.unexpected;
}
