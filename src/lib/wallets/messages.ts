const EXCEEDED_MARKER = "cannot exceed";
const DUPLICATE_MARKER = "more than once";
const MISSING_ASSET_CLASS_MARKER = "asset class allocation";

export const WALLET_MESSAGES = {
  exceeded: "A soma dos percentuais não pode passar de 100%.",
  duplicate: "Essa alocação já está na lista.",
  missingAssetClass:
    "Defina a meta da classe antes de distribuir os setores dela, porque o percentual do setor é uma fatia da classe.",
  emptyName: "Dê um nome à carteira.",
  unavailable: "Não foi possível falar com o servidor. Tente novamente.",
  unexpected: "Algo deu errado. Tente novamente em instantes.",
} as const;

export function walletMessage(status: number, detail: string) {
  const normalized = detail.toLowerCase();

  if (normalized.includes(MISSING_ASSET_CLASS_MARKER)) {
    return WALLET_MESSAGES.missingAssetClass;
  }

  if (normalized.includes(EXCEEDED_MARKER)) return WALLET_MESSAGES.exceeded;

  if (normalized.includes(DUPLICATE_MARKER)) return WALLET_MESSAGES.duplicate;

  if (status === 422 && detail) return detail;

  return WALLET_MESSAGES.unexpected;
}
