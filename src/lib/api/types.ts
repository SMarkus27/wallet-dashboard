export type ApiDecimal = string | number;

export type ApiEnvelope<T> = {
  data: T;
  message: string | null;
};

export const ASSET_TYPES = [
  { name: "STOCKS", value: "AÇÃO", label: "Ações" },
  { name: "FII", value: "FII", label: "Fundos imobiliários" },
  { name: "INCOME_FIXED", value: "RENDA FIXA", label: "Renda fixa" },
  { name: "COOPERATIVE_DEBT", value: "DÍVIDA COPERATIVA", label: "Dívida cooperativa" },
  { name: "ALTERNATIVES", value: "ALTERNATIVOS", label: "Alternativos" },
  { name: "INTERNATIONAL", value: "INTERNACIONAL", label: "Internacional" },
  {
    name: "MULTIMARKET_FUNDS",
    value: "FUNDOS MULTIMERCADO",
    label: "Fundos multimercado",
  },
] as const;

export const SECTORS = [
  "Bancos",
  "Energia",
  "Telecomunicações",
  "Seguradora",
  "Saneamento",
  "Shoppings",
  "Papel",
  "Logística",
  "Escritórios",
  "Híbrido",
  "Infraestrutura",
  "FOFS",
  "Outros",
] as const;

export type SectorName = (typeof SECTORS)[number];

export type AssetTypeName = (typeof ASSET_TYPES)[number]["name"];

export type AssetType = (typeof ASSET_TYPES)[number]["value"];

const BY_NAME = new Map(ASSET_TYPES.map((item) => [item.name as string, item]));

const BY_VALUE = new Map(ASSET_TYPES.map((item) => [item.value as string, item]));

export function assetTypeQueryValue(key: string): AssetType | undefined {
  return entryOf(key)?.value;
}

export function assetTypeLabel(key: string, fallback?: string | null): string {
  return entryOf(key)?.label ?? fallback ?? key;
}

function entryOf(key: string) {
  return BY_NAME.get(key) ?? BY_VALUE.get(key);
}

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
  distributions: ApiDecimal;
  total: ApiDecimal;
};

export type EarningKind = "DIVIDEND" | "JCP" | "DISTRIBUTION";

export type EarningAsset = {
  ticker: string;
  name: string | null;
  asset_type: AssetType;
  sector: string | null;
  sector_label: string | null;
  dividends: ApiDecimal;
  interest_on_equity: ApiDecimal;
  distributions: ApiDecimal;
  total: ApiDecimal;
};

export type EarningPayment = {
  external_id_str: string;
  reference: string;
  ticker: string;
  name: string | null;
  asset_type: AssetType;
  sector: string | null;
  sector_label: string | null;
  type: EarningKind;
  quantity: number;
  price: ApiDecimal;
  gross: ApiDecimal;
  fees: ApiDecimal;
  net: ApiDecimal;
  traded_at: string;
};

export type PortfolioEarnings = {
  period: PortfolioPeriod;
  asset_type: AssetType | null;
  ticker: string | null;
  start: string;
  end: string;
  total: ApiDecimal;
  last_12_months: ApiDecimal;
  months: MonthlyEarning[];
  assets: EarningAsset[];
  payments: EarningPayment[];
};

export type ScheduledEarning = {
  external_id_str: string;
  reference: string;
  ticker: string;
  name: string | null;
  asset_type: AssetType;
  sector: string | null;
  sector_label: string | null;
  type: EarningKind;
  quantity: number;
  price: ApiDecimal;
  amount: ApiDecimal;
  ex_date: string;
  payment_date: string;
};

export type PortfolioScheduledEarnings = {
  reference: string;
  asset_type: AssetType | null;
  ticker: string | null;
  total: ApiDecimal;
  months: MonthlyEarning[];
  payments: ScheduledEarning[];
};

export type RebalanceGroup = {
  name: string;
  label: string;
  asset_type: string;
  target_percentage: ApiDecimal;
  current_value: ApiDecimal;
  current_percentage: ApiDecimal;
  amount: ApiDecimal;
  projected_value: ApiDecimal;
  projected_percentage: ApiDecimal;
};

export type RebalanceAsset = {
  external_id_str: string;
  ticker: string;
  name: string | null;
  asset_type: string;
  sector: string | null;
  price: ApiDecimal;
  quantity: number;
  amount: ApiDecimal;
  current_value: ApiDecimal;
  projected_value: ApiDecimal;
  projected_percentage: ApiDecimal;
};

export type RebalanceDimension = "ASSET_TYPE" | "SECTOR";

export type MissingTarget = {
  dimension: RebalanceDimension;
  name: string;
  label: string;
  asset_type: string;
  target_percentage: ApiDecimal;
};

export type PortfolioRebalance = {
  reference: string;
  amount: ApiDecimal;
  asset_type: AssetType | null;
  total_equity: ApiDecimal;
  projected_equity: ApiDecimal;
  allocated_amount: ApiDecimal;
  leftover_amount: ApiDecimal;
  asset_types: RebalanceGroup[];
  sectors: RebalanceGroup[];
  assets: RebalanceAsset[];
  missing_targets: MissingTarget[];
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

export type CatalogAsset = {
  external_id: string;
  ticker: string;
  name: string | null;
  type: AssetType;
  sector: string | null;
};

export type CatalogAssetPage = {
  items: CatalogAsset[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
};

export const TRADED_TYPES = ["BUY", "SELL"] as const;

export type TradedType = (typeof TRADED_TYPES)[number];

export type SigninMfaChallenge = { mfa_signin_token: string };

export type AuthTokens = { access_token: string; refresh_token: string };

export type EquityPoint = {
  reference: string;
  year: number;
  month: number;
  total_equity: ApiDecimal;
  invested_amount: ApiDecimal;
  capital_gain: ApiDecimal;
  realized_gain: ApiDecimal;
  earnings: ApiDecimal;
};

export type PortfolioEquityHistory = {
  period: PortfolioPeriod;
  asset_type: AssetType | null;
  start: string;
  end: string;
  months: EquityPoint[];
};
