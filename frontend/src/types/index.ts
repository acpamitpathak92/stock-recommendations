// Domain types mirroring the backend contract (backend/src/models/types.ts).
// Kept in sync by hand; the shapes are the JSON returned by /api/analyze.

export const DATA_UNAVAILABLE = "Data unavailable";

export type Num = number | null;
export type Recommendation = "BUY" | "HOLD" | "AVOID";
export type Trend = "Bullish" | "Bearish" | "Neutral" | "Data unavailable";

export interface MarketData {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
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
  trend: Trend;
  support: Num;
  resistance: Num;
  history: PricePoint[];
  technicalScore: number;
  available: boolean;
}

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
  financialScore: number;
  available: boolean;
}

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
  newsScore: number;
  available: boolean;
}

export interface SentimentData {
  symbol: string;
  newsSentiment: Num;
  analystSentiment: Num;
  sentimentLabel: Trend;
  sentimentScore: number;
  available: boolean;
}

export interface RiskData {
  symbol: string;
  companyRisk: Num;
  industryRisk: Num;
  marketRisk: Num;
  macroRisk: Num;
  volatility: Num;
  riskScore: number;
  available: boolean;
}

export interface ValidationResult {
  dataQuality: number;
  confidenceAdjustment: number;
  missingFields: string[];
  contradictions: string[];
}

export interface AnalysisResult {
  symbol: string;
  resolvedSymbol: string;
  overallScore: number;
  recommendation: Recommendation;
  confidence: number;
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

export interface Pick extends AnalysisResult {
  rank: number;
}

export interface TopPicksResponse {
  market: string;
  asOf: string;
  screened: number;
  universeSize: number;
  minScore: number;
  qualified: number;
  picks: Pick[];
  board: { symbol: string; score: number; recommendation: Recommendation }[];
}
