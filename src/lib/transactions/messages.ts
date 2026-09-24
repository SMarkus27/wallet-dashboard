const NO_POSITION_MARKER = "no position";
const INSUFFICIENT_MARKER = "insufficient position";

export const TRANSACTION_MESSAGES = {
  assetNotFound: "Ativo não encontrado. Escolha um da lista.",
  noPosition: "Você não tem esse ativo na carteira para vender.",
  insufficient: "Quantidade maior do que a posição que você tem.",
  futureDate: "A data da negociação não pode estar no futuro.",
  missingAsset: "Escolha o ativo.",
  unavailable: "Não foi possível falar com o servidor. Tente novamente.",
  unexpected: "Algo deu errado. Tente novamente em instantes.",
} as const;

export function transactionMessage(status: number, detail: string) {
  const normalized = detail.toLowerCase();

  if (normalized.includes(INSUFFICIENT_MARKER)) {
    return TRANSACTION_MESSAGES.insufficient;
  }

  if (normalized.includes(NO_POSITION_MARKER)) return TRANSACTION_MESSAGES.noPosition;

  if (status === 404) return TRANSACTION_MESSAGES.assetNotFound;

  if (status === 422 && detail) return detail;

  return TRANSACTION_MESSAGES.unexpected;
}
