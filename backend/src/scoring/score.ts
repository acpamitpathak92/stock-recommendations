import type {
  TechnicalData,
  FinancialData,
  NewsData,
  SentimentData,
  RiskData,
  MarketData,
  ScoreBreakdown,
  Recommendation,
} from "../models/types.js";

/** Weights from the specification. */
export const WEIGHTS = {
  technical: 0.25,
  financial: 0.35,
  sentiment: 0.15,
  news: 0.1,
  risk: 0.15,
} as const;

const clamp = (n: number, lo = 0, hi = 10): number => Math.max(lo, Math.min(hi, n));
const r1 = (n: number): number => Math.round(n * 10) / 10;

/* --------------------------- Technical --------------------------- */
export function scoreTechnical(t: Omit<TechnicalData, "technicalScore">): number {
  if (!t.available) return 5;
  let score = 5;
  const price = t.history.at(-1)?.close ?? null;

  if (price !== null) {
    if (t.sma20 !== null) score += price > t.sma20 ? 0.8 : -0.8;
    if (t.sma50 !== null) score += price > t.sma50 ? 0.8 : -0.8;
    if (t.sma200 !== null) score += price > t.sma200 ? 0.8 : -0.8;
  }
  if (t.trend === "Bullish") score += 1.2;
  else if (t.trend === "Bearish") score -= 1.2;

  if (t.rsi !== null) {
    if (t.rsi >= 70) score -= 1.0; // overbought
    else if (t.rsi <= 30) score += 0.6; // oversold bounce potential
    else if (t.rsi >= 50) score += 0.6;
  }
  if (t.macdHistogram !== null) score += t.macdHistogram > 0 ? 0.8 : -0.8;

  return r1(clamp(score));
}

/* --------------------------- Financial --------------------------- */
export function scoreFinancial(f: Omit<FinancialData, "financialScore">): number {
  if (!f.available) return 5;
  let score = 5;
  if (f.revenueGrowth !== null) score += f.revenueGrowth > 0.1 ? 1 : f.revenueGrowth > 0 ? 0.4 : -0.8;
  if (f.profitGrowth !== null) score += f.profitGrowth > 0.1 ? 1 : f.profitGrowth > 0 ? 0.4 : -0.8;
  if (f.roe !== null) score += f.roe > 0.15 ? 1 : f.roe > 0.08 ? 0.4 : -0.4;
  if (f.roce !== null) score += f.roce > 0.15 ? 0.6 : f.roce > 0.08 ? 0.2 : -0.2;
  if (f.netMargin !== null) score += f.netMargin > 0.12 ? 0.6 : f.netMargin > 0 ? 0.2 : -0.6;
  if (f.operatingMargin !== null) score += f.operatingMargin > 0.15 ? 0.4 : f.operatingMargin > 0 ? 0.1 : -0.4;
  if (f.debtToEquity !== null) score += f.debtToEquity < 1 ? 0.6 : f.debtToEquity < 2 ? 0 : -0.8;
  if (f.operatingCashFlow !== null) score += f.operatingCashFlow > 0 ? 0.4 : -0.6;
  return r1(clamp(score));
}

/* --------------------------- News --------------------------- */
export function scoreNews(n: Omit<NewsData, "newsScore">): number {
  if (!n.available || n.articles.length === 0) return 5;
  const pos = n.articles.filter((a) => a.sentiment === "positive").length;
  const neg = n.articles.filter((a) => a.sentiment === "negative").length;
  const total = n.articles.length;
  const net = (pos - neg) / total; // -1..1
  return r1(clamp(5 + net * 5));
}

/* --------------------------- Sentiment --------------------------- */
export function scoreSentiment(s: Omit<SentimentData, "sentimentScore">): number {
  if (!s.available) return 5;
  const parts: number[] = [];
  if (s.newsSentiment !== null) parts.push(s.newsSentiment);
  if (s.analystSentiment !== null) parts.push(s.analystSentiment);
  if (parts.length === 0) return 5;
  const avg = parts.reduce((a, b) => a + b, 0) / parts.length; // -1..1
  return r1(clamp(5 + avg * 5));
}

/* --------------------------- Risk (safety) --------------------------- */
/**
 * Risk safety score: 10 = lowest risk, 0 = highest risk. Derived from real
 * volatility, beta, leverage, profitability and proximity to 52-week extremes.
 * Sub-components are each 0-10 safety scores.
 */
export function scoreRisk(
  market: MarketData,
  technical: Omit<TechnicalData, "technicalScore">,
  financial: Omit<FinancialData, "financialScore">,
): { riskScore: number; components: Pick<RiskData, "companyRisk" | "industryRisk" | "marketRisk" | "macroRisk" | "volatility"> } {
  // Company risk: leverage + profitability.
  let company = 5;
  if (financial.debtToEquity !== null) company += financial.debtToEquity < 1 ? 2 : financial.debtToEquity < 2 ? 0 : -2.5;
  if (financial.netMargin !== null) company += financial.netMargin > 0.1 ? 1.5 : financial.netMargin > 0 ? 0.5 : -1.5;
  company = clamp(company);

  // Industry risk proxy: beta (1 ~ market). Lower beta -> safer.
  let industry = 5;
  if (market.beta !== null) {
    if (market.beta < 0.8) industry = 8;
    else if (market.beta < 1.1) industry = 6.5;
    else if (market.beta < 1.5) industry = 4.5;
    else industry = 3;
  }

  // Market risk: annualised volatility.
  let marketRisk = 5;
  const vol = technical.history.length ? annualisedVolFromHistory(technical) : null;
  if (vol !== null) {
    if (vol < 0.2) marketRisk = 8;
    else if (vol < 0.35) marketRisk = 6;
    else if (vol < 0.5) marketRisk = 4;
    else marketRisk = 2.5;
  }

  // Macro risk: blend of beta and volatility (systemic exposure).
  let macro = 5;
  const macroInputs: number[] = [];
  if (market.beta !== null) macroInputs.push(market.beta < 1 ? 7 : market.beta < 1.4 ? 5 : 3.5);
  if (vol !== null) macroInputs.push(vol < 0.3 ? 7 : vol < 0.45 ? 5 : 3.5);
  if (macroInputs.length) macro = macroInputs.reduce((a, b) => a + b, 0) / macroInputs.length;

  const riskScore = r1(clamp((company + industry + marketRisk + macro) / 4));
  return {
    riskScore,
    components: {
      companyRisk: r1(company),
      industryRisk: r1(industry),
      marketRisk: r1(marketRisk),
      macroRisk: r1(macro),
      volatility: vol,
    },
  };
}

function annualisedVolFromHistory(t: Omit<TechnicalData, "technicalScore">): number | null {
  const closes = t.history.map((p) => p.close);
  if (closes.length < 21) return null;
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1] as number;
    const cur = closes[i] as number;
    if (prev > 0) returns.push(Math.log(cur / prev));
  }
  if (returns.length < 2) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, x) => a + (x - mean) ** 2, 0) / (returns.length - 1);
  return Math.round(Math.sqrt(variance) * Math.sqrt(252) * 10000) / 10000;
}

/* --------------------------- Overall --------------------------- */
export function computeOverall(scores: {
  technicalScore: number;
  financialScore: number;
  sentimentScore: number;
  newsScore: number;
  riskScore: number;
}): ScoreBreakdown {
  const overall =
    scores.technicalScore * WEIGHTS.technical +
    scores.financialScore * WEIGHTS.financial +
    scores.sentimentScore * WEIGHTS.sentiment +
    scores.newsScore * WEIGHTS.news +
    scores.riskScore * WEIGHTS.risk;
  return { ...scores, overallScore: r1(overall) };
}

export function decideRecommendation(overall: number): Recommendation {
  if (overall >= 7) return "BUY";
  if (overall >= 5) return "HOLD";
  return "AVOID";
}

/** Confidence (0-100): score extremity scaled by data quality. */
export function computeConfidence(overall: number, dataQualityPct: number): number {
  const extremity = Math.abs(overall - 5) / 5; // 0..1, how decisive
  const base = 55 + extremity * 35; // 55..90
  const confidence = base * (dataQualityPct / 100);
  return Math.round(Math.max(0, Math.min(100, confidence)));
}
