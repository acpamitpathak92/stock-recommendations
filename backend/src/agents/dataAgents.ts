import { mcp } from "../mcp/clientManager.js";
import { scoreTechnical, scoreFinancial } from "../scoring/score.js";
import { createLogger } from "../utils/logger.js";
import type { GraphStateType } from "../graph/state.js";
import type { MarketData, TechnicalData, FinancialData } from "../models/types.js";

const log = createLogger("agent");

/** Market Agent — quote + company profile via market-server. */
export async function marketAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const market = await mcp.callTool<MarketData>("market", "getMarketData", { symbol: state.symbol });
  log.info("marketAgent done", { available: market.available });
  return { market };
}

/** Technical Agent — indicators via technical-server; score computed in code. */
export async function technicalAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const raw = await mcp.callTool<Omit<TechnicalData, "technicalScore">>(
    "technical",
    "getTechnicalIndicators",
    { symbol: state.symbol },
  );
  const technical: TechnicalData = { ...raw, technicalScore: scoreTechnical(raw) };
  log.info("technicalAgent done", { score: technical.technicalScore, trend: technical.trend });
  return { technical };
}

/** Financial Agent — fundamentals via financial-server; score computed in code. */
export async function financialAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const raw = await mcp.callTool<Omit<FinancialData, "financialScore">>(
    "financial",
    "getFinancialData",
    { symbol: state.symbol },
  );
  const financial: FinancialData = { ...raw, financialScore: scoreFinancial(raw) };
  log.info("financialAgent done", { score: financial.financialScore });
  return { financial };
}
