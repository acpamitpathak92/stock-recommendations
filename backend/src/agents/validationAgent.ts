import { DATA_UNAVAILABLE } from "../models/types.js";
import { createLogger } from "../utils/logger.js";
import type { GraphStateType } from "../graph/state.js";
import type { ValidationResult } from "../models/types.js";

const log = createLogger("agent");

/**
 * Validation Agent — audits the collected data: counts missing/unavailable
 * fields, flags contradictions, and produces a data-quality percentage plus a
 * confidence-adjustment multiplier (0..1). No LLM, no scoring of the stock.
 */
export async function validationAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const missing: string[] = [];
  const contradictions: string[] = [];

  let total = 0;
  let present = 0;

  const checkNum = (label: string, v: number | null | undefined) => {
    total += 1;
    if (v === null || v === undefined) missing.push(label);
    else present += 1;
  };
  const checkStr = (label: string, v: string | undefined) => {
    total += 1;
    if (!v || v === DATA_UNAVAILABLE) missing.push(label);
    else present += 1;
  };

  const m = state.market;
  checkStr("market.companyName", m?.companyName);
  checkNum("market.currentPrice", m?.currentPrice);
  checkNum("market.marketCap", m?.marketCap);
  checkNum("market.peRatio", m?.peRatio);

  const t = state.technical;
  checkNum("technical.sma50", t?.sma50);
  checkNum("technical.rsi", t?.rsi);
  checkNum("technical.macd", t?.macd);

  const f = state.financial;
  checkNum("financial.revenueGrowth", f?.revenueGrowth);
  checkNum("financial.roe", f?.roe);
  checkNum("financial.netMargin", f?.netMargin);
  checkNum("financial.debtToEquity", f?.debtToEquity);

  const n = state.news;
  total += 1;
  if (n && n.articles.length > 0) present += 1;
  else missing.push("news.articles");

  const s = state.sentiment;
  checkNum("sentiment.newsSentiment", s?.newsSentiment);

  // Contradiction checks against real data.
  if (m?.currentPrice != null && m.week52High != null && m.currentPrice > m.week52High * 1.02) {
    contradictions.push("Current price exceeds reported 52-week high");
  }
  if (m?.currentPrice != null && m.week52Low != null && m.currentPrice < m.week52Low * 0.98) {
    contradictions.push("Current price is below reported 52-week low");
  }
  if (t?.trend === "Bullish" && s?.sentimentLabel === "Bearish") {
    contradictions.push("Bullish technical trend conflicts with bearish sentiment");
  }

  const dataQuality = total > 0 ? Math.round((present / total) * 100) : 0;
  // Each contradiction trims confidence; quality scales it linearly.
  const penalty = Math.min(0.3, contradictions.length * 0.1);
  const confidenceAdjustment = Math.max(0, Math.min(1, dataQuality / 100 - penalty));

  const validation: ValidationResult = {
    dataQuality,
    confidenceAdjustment,
    missingFields: missing,
    contradictions,
  };
  log.info("validationAgent done", { dataQuality, missing: missing.length, contradictions: contradictions.length });
  return { validation };
}
