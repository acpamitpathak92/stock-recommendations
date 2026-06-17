#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getOverview } from "../services/alphaVantage.js";
import { getFinancials } from "../services/fmp.js";
import { getYahooFundamentals } from "../services/yahoo.js";
import { resolveSymbol, baseSymbol, yahooSymbol } from "../services/symbol.js";
import { jsonResult } from "./util.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("mcp:financial");

const server = new McpServer({ name: "financial-server", version: "1.0.0" });

/** Prefer the first non-null value across sources. */
function pick(...vals: (number | null | undefined)[]): number | null {
  for (const v of vals) if (v !== null && v !== undefined) return v;
  return null;
}

server.registerTool(
  "getFinancialData",
  {
    title: "Get Financial Data",
    description:
      "Returns fundamentals: revenue growth, profit growth, debt/equity, operating " +
      "cash flow, ROE, ROCE, net margin and operating margin, sourced from company " +
      "filings via Alpha Vantage and Financial Modeling Prep.",
    inputSchema: { symbol: z.string().describe("Ticker, e.g. TATAMOTORS or AAPL") },
  },
  async ({ symbol }) => {
    const resolved = resolveSymbol(symbol);
    const base = baseSymbol(symbol);
    // Yahoo's quoteSummary covers NSE/BSE fundamentals that FMP gates behind a
    // paid plan, so it's the primary fundamentals source; Alpha Vantage OVERVIEW
    // and FMP fill any remaining gaps (mainly for US names).
    const [overview, yahoo, fmp] = await Promise.all([
      getOverview(resolved),
      getYahooFundamentals(yahooSymbol(symbol)),
      getFinancials(base),
    ]);

    const available = Boolean(overview || yahoo || fmp);
    const data = {
      symbol: resolved,
      revenueGrowth: pick(yahoo?.revenueGrowth, overview?.revenueGrowthYoY, fmp?.revenueGrowth),
      profitGrowth: pick(yahoo?.profitGrowth, overview?.earningsGrowthYoY, fmp?.profitGrowth),
      debtToEquity: pick(yahoo?.debtToEquity, fmp?.debtToEquity),
      operatingCashFlow: pick(yahoo?.operatingCashFlow, fmp?.operatingCashFlow),
      roe: pick(yahoo?.roe, overview?.roe, fmp?.roe),
      roce: pick(fmp?.roce),
      netMargin: pick(yahoo?.netMargin, overview?.profitMargin, fmp?.netMargin),
      operatingMargin: pick(yahoo?.operatingMargin, overview?.operatingMargin, fmp?.operatingMargin),
      available,
    };
    log.info("getFinancialData", { symbol: resolved, available });
    return jsonResult(data);
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
log.info("financial-server ready (stdio)");
