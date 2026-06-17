import { buildWorkflow, type CompiledWorkflow } from "./workflow.js";
import { resolveSymbol } from "../services/symbol.js";
import { saveAnalysis } from "../services/db.js";
import { mcp } from "../mcp/clientManager.js";
import { createLogger } from "../utils/logger.js";
import {
  DATA_UNAVAILABLE,
  type AnalysisResult,
  type MarketData,
  type TechnicalData,
  type FinancialData,
  type NewsData,
  type SentimentData,
  type RiskData,
  type ValidationResult,
} from "../models/types.js";

const log = createLogger("coordinator");

let workflow: CompiledWorkflow | null = null;

function emptyMarket(symbol: string): MarketData {
  return {
    symbol, companyName: DATA_UNAVAILABLE, sector: DATA_UNAVAILABLE, industry: DATA_UNAVAILABLE,
    currentPrice: null, marketCap: null, peRatio: null, eps: null, dividendYield: null,
    week52High: null, week52Low: null, volume: null, beta: null, available: false,
  };
}
function emptyTechnical(symbol: string): TechnicalData {
  return {
    symbol, sma20: null, sma50: null, sma200: null, ema20: null, rsi: null, macd: null,
    macdSignal: null, macdHistogram: null, trend: DATA_UNAVAILABLE, support: null,
    resistance: null, history: [], technicalScore: 5, available: false,
  };
}
function emptyFinancial(symbol: string): FinancialData {
  return {
    symbol, revenueGrowth: null, profitGrowth: null, debtToEquity: null, operatingCashFlow: null,
    roe: null, roce: null, netMargin: null, operatingMargin: null, financialScore: 5, available: false,
  };
}
function emptyNews(symbol: string): NewsData {
  return { symbol, articles: [], positiveCatalysts: [], negativeCatalysts: [], keyEvents: [], newsScore: 5, available: false };
}
function emptySentiment(symbol: string): SentimentData {
  return { symbol, newsSentiment: null, analystSentiment: null, sentimentLabel: DATA_UNAVAILABLE, sentimentScore: 5, available: false };
}
function emptyRisk(symbol: string): RiskData {
  return { symbol, companyRisk: null, industryRisk: null, marketRisk: null, macroRisk: null, volatility: null, riskScore: 5, available: false };
}
function emptyValidation(): ValidationResult {
  return { dataQuality: 0, confidenceAdjustment: 0, missingFields: [], contradictions: [] };
}

export async function analyzeStock(
  rawSymbol: string,
  opts: { skipNarrative?: boolean } = {},
): Promise<AnalysisResult> {
  await mcp.init();
  if (!workflow) workflow = buildWorkflow();

  const symbol = rawSymbol.trim().toUpperCase();
  const resolvedSymbol = resolveSymbol(symbol);
  log.info("Analysis started", { symbol, resolvedSymbol, screening: opts.skipNarrative ?? false });

  const final = await workflow.invoke({
    symbol,
    resolvedSymbol,
    skipNarrative: opts.skipNarrative ?? false,
  });

  const market = final.market ?? emptyMarket(resolvedSymbol);
  const technical = final.technical ?? emptyTechnical(resolvedSymbol);
  const financial = final.financial ?? emptyFinancial(resolvedSymbol);
  const news = final.news ?? emptyNews(resolvedSymbol);
  const sentiment = final.sentiment ?? emptySentiment(resolvedSymbol);
  const risk = final.risk ?? emptyRisk(resolvedSymbol);
  const validation = final.validation ?? emptyValidation();
  const scores = final.scores ?? {
    technicalScore: technical.technicalScore,
    financialScore: financial.financialScore,
    sentimentScore: sentiment.sentimentScore,
    newsScore: news.newsScore,
    riskScore: risk.riskScore,
    overallScore: 5,
  };
  const narrative = final.narrative ?? {
    bullCase: [DATA_UNAVAILABLE],
    bearCase: [DATA_UNAVAILABLE],
    investmentThesis: DATA_UNAVAILABLE,
    analysis: DATA_UNAVAILABLE,
  };

  const evidence: string[] = [];
  if (market.currentPrice != null) evidence.push(`Current price: ${market.currentPrice}`);
  if (market.marketCap != null) evidence.push(`Market cap: ${market.marketCap}`);
  if (technical.trend !== DATA_UNAVAILABLE) evidence.push(`Technical trend: ${technical.trend}`);
  if (technical.rsi != null) evidence.push(`RSI(14): ${technical.rsi}`);
  if (financial.roe != null) evidence.push(`ROE: ${(financial.roe * 100).toFixed(1)}%`);
  if (news.articles.length) evidence.push(`${news.articles.length} news items analysed`);
  evidence.push(`Data quality: ${validation.dataQuality}%`);

  const result: AnalysisResult = {
    symbol,
    resolvedSymbol,
    overallScore: scores.overallScore,
    recommendation: final.recommendation ?? "HOLD",
    confidence: final.confidence ?? 0,
    technicalScore: scores.technicalScore,
    financialScore: scores.financialScore,
    sentimentScore: scores.sentimentScore,
    newsScore: scores.newsScore,
    riskScore: scores.riskScore,
    currentPrice: market.currentPrice,
    marketCap: market.marketCap,
    bullCase: narrative.bullCase,
    bearCase: narrative.bearCase,
    evidence,
    analysis: narrative.analysis,
    investmentThesis: narrative.investmentThesis,
    market,
    technical,
    financial,
    news,
    sentiment,
    risk,
    validation,
    generatedAt: new Date().toISOString(),
  };

  try {
    saveAnalysis(result);
  } catch (err) {
    log.warn("Failed to persist analysis", String(err));
  }

  log.info("Analysis complete", { symbol, recommendation: result.recommendation, overall: result.overallScore });
  return result;
}
