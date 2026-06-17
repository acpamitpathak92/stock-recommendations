#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getQuote, getOverview } from "../services/alphaVantage.js";
import { getYahooQuote, getYahooValuation } from "../services/yahoo.js";
import { resolveSymbol, yahooSymbol } from "../services/symbol.js";
import { jsonResult } from "./util.js";
import { DATA_UNAVAILABLE, type MarketData } from "../models/types.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("mcp:market");

const server = new McpServer({ name: "market-server", version: "1.0.0" });

server.registerTool(
  "getMarketData",
  {
    title: "Get Market Data",
    description:
      "Returns real-time quote and company profile (price, market cap, PE, EPS, " +
      "dividend yield, 52-week range, volume) for a stock symbol.",
    inputSchema: { symbol: z.string().describe("Ticker, e.g. TATAMOTORS or AAPL") },
  },
  async ({ symbol }) => {
    const resolved = resolveSymbol(symbol);
    // Alpha Vantage for profile (sector/PE/EPS/etc.), Yahoo for reliable price,
    // 52-week range, and valuation (market cap / P/E / EPS / dividend) —
    // especially on NSE/BSE where Alpha Vantage's OVERVIEW is empty.
    const [quote, overview, yquote, yval] = await Promise.all([
      getQuote(resolved),
      getOverview(resolved),
      getYahooQuote(yahooSymbol(symbol)),
      getYahooValuation(yahooSymbol(symbol)),
    ]);

    const available = Boolean(quote || overview || yquote || yval);
    const data: MarketData = {
      symbol: resolved,
      companyName: overview?.name ?? yval?.name ?? yquote?.name ?? DATA_UNAVAILABLE,
      sector: overview?.sector ?? DATA_UNAVAILABLE,
      industry: overview?.industry ?? DATA_UNAVAILABLE,
      currentPrice: quote?.price ?? yval?.price ?? yquote?.price ?? null,
      marketCap: overview?.marketCap ?? yval?.marketCap ?? null,
      peRatio: overview?.peRatio ?? yval?.peRatio ?? null,
      eps: overview?.eps ?? yval?.eps ?? null,
      dividendYield: overview?.dividendYield ?? yval?.dividendYield ?? null,
      week52High: overview?.week52High ?? yval?.week52High ?? yquote?.week52High ?? null,
      week52Low: overview?.week52Low ?? yval?.week52Low ?? yquote?.week52Low ?? null,
      volume: quote?.volume ?? yval?.volume ?? yquote?.volume ?? null,
      beta: overview?.beta ?? null,
      available,
    };
    log.info("getMarketData", { symbol: resolved, available });
    return jsonResult(data);
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
log.info("market-server ready (stdio)");
