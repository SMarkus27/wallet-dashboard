export type ApiDecimal = string | number;

export type ApiEnvelope<T> = {
  data: T;
  message: string | null;
};

export const ASSET_TYPES = [
  "AÇÃO",
  "FII",
  "RENDA FIXA",
  "DÍVIDA COPERATIVA",
  "ALTERNATIVOS",
  "INTERNACIONAL",
  "FUNDOS MULTIMERCADO",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export const PORTFOLIO_PERIODS = ["ALL", "12M", "2Y", "5Y", "10Y"] as const;

export type PortfolioPeriod = (typeof PORTFOLIO_PERIODS)[number];

export const PORTFOLIO_PERIOD_LABELS: Record<PortfolioPeriod, string> = {
  ALL: "Desde o início",
  "12M": "12 meses",
  "2Y": "2 anos",
  "5Y": "5 anos",
  "10Y": "10 anos",
};

export type TaxPeriodStatus = "PENDENTE" | "PAGO" | "ISENTO" | "SEM_IMPOSTO";

export type TransactionType = "BUY" | "SELL" | "DIVIDEND" | "JCP";

export type CapitalGain = {
  realized: ApiDecimal;
  unrealized: ApiDecimal;
  total: ApiDecimal;
};

export type PortfolioOverview = {
  reference: string;
  total_equity: ApiDecimal;
  invested_amount: ApiDecimal;
  capital_gain: CapitalGain;
  earnings: { total: ApiDecimal; last_12_months: ApiDecimal };
  total_profit: ApiDecimal;
  profitability: {
    total_percentage: ApiDecimal;
    last_12_months_percentage: ApiDecimal;
  };
};

export type AllocationSlice = {
  name: string;
  label: string;
  ideal_percentage: ApiDecimal;
  real_percentage: ApiDecimal;
  difference: ApiDecimal;
  market_value: ApiDecimal;
};

export type SectorAllocationSlice = AllocationSlice & {
  asset_type: string;
  wallet_ideal_percentage: ApiDecimal;
  wallet_real_percentage: ApiDecimal;
  wallet_difference: ApiDecimal;
};

export type AssetAllocation = {
  external_id_str: string;
  ticker: string;
  name: string | null;
  asset_type: string;
  sector: string | null;
  quantity: number;
  mean_price: ApiDecimal;
  price: ApiDecimal;
  invested: ApiDecimal;
  market_value: ApiDecimal;
  percentage: ApiDecimal;
};

export type PortfolioAllocation = {
  reference: string;
  total_equity: ApiDecimal;
  asset_types: AllocationSlice[];
  sectors: SectorAllocationSlice[];
  assets: AssetAllocation[];
};

export type PortfolioEquity = {
  period: PortfolioPeriod;
  start: string;
  end: string;
  total_equity: ApiDecimal;
  invested_amount: ApiDecimal;
  contributed_amount: ApiDecimal;
  earnings_amount: ApiDecimal;
  withdrawn_amount: ApiDecimal;
  begin_equity: ApiDecimal;
  capital_gain: ApiDecimal;
  profit: ApiDecimal;
  return_percentage: ApiDecimal;
};

export type MonthlyEarning = {
  reference: string;
  year: number;
  month: number;
  dividends: ApiDecimal;
  interest_on_equity: ApiDecimal;
  total: ApiDecimal;
};

export type PortfolioEarnings = {
  period: PortfolioPeriod;
  start: string;
  end: string;
  total: ApiDecimal;
  last_12_months: ApiDecimal;
  months: MonthlyEarning[];
};

export type TaxPeriod = {
  external_id_str: string;
  asset_type: AssetType;
  year: number;
  month: number;
  total_profit: ApiDecimal;
  total_loss: ApiDecimal;
  loss_compensation: ApiDecimal;
  taxable_amount: ApiDecimal;
  total_withholding_tax: ApiDecimal;
  total_tax_due: ApiDecimal;
  darf_amount: ApiDecimal;
  status: TaxPeriodStatus;
};

export type TaxPeriodList = {
  periods: TaxPeriod[];
  total_darf_amount: ApiDecimal;
};

export type TaxOperation = {
  external_id_str: string;
  transaction_external_id_str: string;
  ticker: string;
  asset_type: AssetType;
  transaction_type: string;
  quantity: number;
  price: ApiDecimal;
  traded_at: string;
  gross_profit_loss: ApiDecimal;
  deductible_fees: ApiDecimal;
  taxable_profit_loss: ApiDecimal;
  withholding_tax: ApiDecimal;
  tax_due: ApiDecimal;
};

export type TaxPeriodDetail = {
  year: number;
  month: number;
  periods: TaxPeriod[];
  operations: TaxOperation[];
  loss_balance: Record<string, ApiDecimal>;
  darf_amount: ApiDecimal;
  is_payable: boolean;
};

export type WalletAssetClassTarget = {
  external_id: string;
  name: AssetType;
  percentage: number;
};

export type WalletSectorTarget = {
  external_id: string | null;
  asset_type: AssetType;
  sector: string;
  percentage: number;
  wallet_percentage?: number;
};

export type WalletSummary = {
  name: string;
  external_id: string;
  asset_class: WalletAssetClassTarget[];
  sectors: WalletSectorTarget[];
};

export type WalletList = { wallet: WalletSummary[] };

export type SigninMfaChallenge = { mfa_signin_token: string };

export type AuthTokens = { access_token: string; refresh_token: string };
