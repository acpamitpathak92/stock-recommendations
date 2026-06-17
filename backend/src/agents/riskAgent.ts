import { scoreRisk } from "../scoring/score.js";
import { createLogger } from "../utils/logger.js";
import { DATA_UNAVAILABLE, type RiskData, type TechnicalData, type FinancialData, type MarketData } from "../models/types.js";
import type { GraphStateType } from "../graph/state.js";

const log = createLogger("agent");

const EMPTY_MARKET = (symbol: string): MarketData => ({
  symbol,
  companyName: DATA_UNAVAILABLE,
  sector: DATA_UNAVAILABLE,
  industry: DATA_UNAVAILABLE,
  currentPrice: null,
  marketCap: null,
  peRatio: null,
  eps: null,
  dividendYield: null,
  week52High: null,
  week52Low: null,
  volume: null,
  beta: null,
  available: false,
});

/**
 * Risk Agent — analytical (no dedicated MCP server, matching the 5-server
 * spec). Derives company/industry/market/macro risk from already-fetched
 * market, technical and financial data. All numbers computed in code.
 */
export async function riskAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const market = state.market ?? EMPTY_MARKET(state.resolvedSymbol);
  const technical = state.technical;
  const financial = state.financial;

  if (!technical || !financial) {
    const risk: RiskData = {
      symbol: state.resolvedSymbol,
      companyRisk: null,
      industryRisk: null,
      marketRisk: null,
      macroRisk: null,
      volatility: null,
      riskScore: 5,
      available: false,
    };
    return { risk };
  }

  const { riskScore, components } = scoreRisk(market, technical, financial);
  const risk: RiskData = {
    symbol: state.resolvedSymbol,
    ...components,
    riskScore,
    available: market.available || technical.available || financial.available,
  };
  log.info("riskAgent done", { riskScore });
  return { risk };
}
