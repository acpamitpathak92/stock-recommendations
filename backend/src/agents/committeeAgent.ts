import {
  computeOverall,
  decideRecommendation,
  computeConfidence,
} from "../scoring/score.js";
import { generateNarrative } from "../services/gemini.js";
import { DATA_UNAVAILABLE } from "../models/types.js";
import { createLogger } from "../utils/logger.js";
import type { GraphStateType } from "../graph/state.js";

const log = createLogger("agent");

function fmtNum(v: number | null, suffix = ""): string {
  return v === null ? DATA_UNAVAILABLE : `${v}${suffix}`;
}
function fmtPct(v: number | null): string {
  return v === null ? DATA_UNAVAILABLE : `${(v * 100).toFixed(1)}%`;
}

/**
 * Investment Committee Agent.
 *
 * Computes the overall score, recommendation and confidence IN CODE, then asks
 * Gemini ONLY to phrase the bull case, bear case, thesis and analysis from the
 * verified fact sheet. Evidence is assembled from real data, not the LLM.
 */
export async function committeeAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const t = state.technical;
  const f = state.financial;
  const n = state.news;
  const s = state.sentiment;
  const r = state.risk;
  const m = state.market;
  const v = state.validation;

  const scores = computeOverall({
    technicalScore: t?.technicalScore ?? 5,
    financialScore: f?.financialScore ?? 5,
    sentimentScore: s?.sentimentScore ?? 5,
    newsScore: n?.newsScore ?? 5,
    riskScore: r?.riskScore ?? 5,
  });

  const recommendation = decideRecommendation(scores.overallScore);
  const dataQuality = v?.dataQuality ?? 0;
  const confidence = computeConfidence(scores.overallScore, dataQuality);

  // Evidence drawn strictly from real, sourced data.
  const evidence: string[] = [];
  if (m?.currentPrice != null) evidence.push(`Current price: ${m.currentPrice}`);
  if (m?.marketCap != null) evidence.push(`Market cap: ${m.marketCap}`);
  if (m?.peRatio != null) evidence.push(`P/E ratio: ${m.peRatio}`);
  if (t?.trend && t.trend !== DATA_UNAVAILABLE) evidence.push(`Technical trend: ${t.trend}`);
  if (t?.rsi != null) evidence.push(`RSI(14): ${t.rsi}`);
  if (f?.roe != null) evidence.push(`ROE: ${fmtPct(f.roe)}`);
  if (f?.revenueGrowth != null) evidence.push(`Revenue growth YoY: ${fmtPct(f.revenueGrowth)}`);
  if (r?.volatility != null) evidence.push(`Annualised volatility: ${fmtPct(r.volatility)}`);
  if (n && n.articles.length) evidence.push(`${n.articles.length} recent news items analysed`);
  if (v) evidence.push(`Data quality: ${v.dataQuality}%`);

  // Compact fact sheet for Gemini (prose only).
  const factSheet = [
    `Symbol: ${state.resolvedSymbol}`,
    `Recommendation (computed): ${recommendation}`,
    `Overall score (computed): ${scores.overallScore}/10`,
    `Confidence (computed): ${confidence}%`,
    `Scores -> technical:${scores.technicalScore} financial:${scores.financialScore} sentiment:${scores.sentimentScore} news:${scores.newsScore} risk-safety:${scores.riskScore}`,
    `Company: ${m?.companyName ?? DATA_UNAVAILABLE} | Sector: ${m?.sector ?? DATA_UNAVAILABLE}`,
    `Price: ${fmtNum(m?.currentPrice ?? null)} | PE: ${fmtNum(m?.peRatio ?? null)} | MktCap: ${fmtNum(m?.marketCap ?? null)}`,
    `Trend: ${t?.trend ?? DATA_UNAVAILABLE} | RSI: ${fmtNum(t?.rsi ?? null)} | MACD hist: ${fmtNum(t?.macdHistogram ?? null)}`,
    `RevGrowth: ${fmtPct(f?.revenueGrowth ?? null)} | ProfitGrowth: ${fmtPct(f?.profitGrowth ?? null)} | ROE: ${fmtPct(f?.roe ?? null)} | D/E: ${fmtNum(f?.debtToEquity ?? null)}`,
    `Sentiment: ${s?.sentimentLabel ?? DATA_UNAVAILABLE} | NewsItems: ${n?.articles.length ?? 0}`,
    `Positive catalysts: ${(n?.positiveCatalysts ?? []).join("; ") || DATA_UNAVAILABLE}`,
    `Negative catalysts: ${(n?.negativeCatalysts ?? []).join("; ") || DATA_UNAVAILABLE}`,
    `Risk safety -> company:${fmtNum(r?.companyRisk ?? null)} industry:${fmtNum(r?.industryRisk ?? null)} market:${fmtNum(r?.marketRisk ?? null)} macro:${fmtNum(r?.macroRisk ?? null)}`,
  ].join("\n");

  const narrative = await generateNarrative(factSheet, state.skipNarrative ?? false);
  log.info("committeeAgent done", { recommendation, overall: scores.overallScore, confidence });

  return { scores, recommendation, confidence, narrative };
}
