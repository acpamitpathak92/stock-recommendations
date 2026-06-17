/**
 * Shared domain types for the whole pipeline.
 *
 * Convention: any individual factual field that could not be sourced from an
 * MCP tool is represented by the literal string `"Data unavailable"`
 * (exported as DATA_UNAVAILABLE). Numeric fields use `number | null` where a
 * null means the value was not available. Scores are always real numbers
 * computed in code (never invented by the LLM).
 */
export const DATA_UNAVAILABLE = "Data unavailable" as const;
export type DataUnavailable = typeof DATA_UNAVAILABLE;

/** A numeric value that may be missing. */
export type Num = number | null;

/* ----------------------------- Market ----------------------------- */
export interface MarketData {
  symbol: string;
  companyName: string | DataUnavailable;
  sector: string | DataUnavailable;
  industry: string | DataUnavailable;
  currentPrice: Num;
  marketCap: Num;
  peRatio: Num;
  eps: Num;
  dividendYield: Num;
  week52High: Num;
  week52Low: Num;
  volume: Num;
  beta: Num;
  available: boolean;
}

/* ----------------------------- Technical ----------------------------- */
export interface PricePoint {
  date: string;
  close: number;
}

export interface TechnicalData {
  symbol: string;
  sma20: Num;
  sma50: Num;
  sma200: Num;
  ema20: Num;
  rsi: Num;
  macd: Num;
  macdSignal: Num;
  macdHistogram: Num;
  trend: "Bullish" | "Bearish" | "Neutral" | DataUnavailable;
  support: Num;
  resistance: Num;
  /** Trailing closing-price series for charting (oldest -> newest). */
  history: PricePoint[];
  technicalScore: number; // 0-10 computed in code
  available: boolean;
}

/* ----------------------------- Financial ----------------------------- */
export interface FinancialData {
  symbol: string;
  revenueGrowth: Num;
  profitGrowth: Num;
  debtToEquity: Num;
  operatingCashFlow: Num;
  roe: Num;
  roce: Num;
  netMargin: Num;
  operatingMargin: Num;
  financialScore: number; // 0-10 computed in code
  available: boolean;
}

/* ----------------------------- News ----------------------------- */
export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: "positive" | "negative" | "neutral";
}

export interface NewsData {
  symbol: string;
  articles: NewsArticle[];
  positiveCatalysts: string[];
  negativeCatalysts: string[];
  keyEvents: string[];
  newsScore: number; // 0-10 computed in code
  available: boolean;
}

/* ----------------------------- Sentiment ----------------------------- */
export interface SentimentData {
  symbol: string;
  newsSentiment: Num; // -1..1
  analystSentiment: Num; // -1..1 (derived)
  sentimentLabel: "Bullish" | "Bearish" | "Neutral" | DataUnavailable;
  sentimentScore: number; // 0-10 computed in code
  available: boolean;
}

/* ----------------------------- Risk ----------------------------- */
export interface RiskData {
  symbol: string;
  companyRisk: Num; // 0-10 (10 = safest)
  industryRisk: Num;
  marketRisk: Num;
  macroRisk: Num;
  volatility: Num; // annualised, fraction
  riskScore: number; // 0-10 safety score (10 = lowest risk)
  available: boolean;
}

/* ----------------------------- Validation ----------------------------- */
export interface ValidationResult {
  dataQuality: number; // 0-100 %
  confidenceAdjustment: number; // multiplier 0..1
  missingFields: string[];
  contradictions: string[];
}

/* ----------------------------- Scoring ----------------------------- */
export interface ScoreBreakdown {
  technicalScore: number;
  financialScore: number;
  sentimentScore: number;
  newsScore: number;
  riskScore: number;
  overallScore: number;
}

/* ----------------------------- Final output ----------------------------- */
export type Recommendation = "BUY" | "HOLD" | "AVOID";

export interface AnalysisResult {
  symbol: string;
  resolvedSymbol: string;
  overallScore: number;
  recommendation: Recommendation;
  confidence: number; // 0-100
  technicalScore: number;
  financialScore: number;
  sentimentScore: number;
  newsScore: number;
  riskScore: number;
  currentPrice: Num;
  marketCap: Num;
  bullCase: string[];
  bearCase: string[];
  evidence: string[];
  analysis: string;
  investmentThesis: string;
  market: MarketData;
  technical: TechnicalData;
  financial: FinancialData;
  news: NewsData;
  sentiment: SentimentData;
  risk: RiskData;
  validation: ValidationResult;
  generatedAt: string;
}

export interface RecommendedStock {
  symbol: string;
  score: number;
  recommendation: Recommendation;
  reason: string;
}
