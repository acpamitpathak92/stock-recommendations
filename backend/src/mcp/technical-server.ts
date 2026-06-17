#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getDailySeries } from "../services/alphaVantage.js";
import { getYahooSeries } from "../services/yahoo.js";
import { resolveSymbol, yahooSymbol } from "../services/symbol.js";
import {
  sma,
  ema,
  rsi,
  macd,
  supportResistance,
  annualisedVolatility,
} from "../services/indicators.js";
import { jsonResult } from "./util.js";
import { DATA_UNAVAILABLE } from "../models/types.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("mcp:technical");

const server = new McpServer({ name: "technical-server", version: "1.0.0" });

server.registerTool(
  "getTechnicalIndicators",
  {
    title: "Get Technical Indicators",
    description:
      "Computes SMA(20/50/200), EMA20, RSI(14), MACD(12,26,9), trend, support, " +
      "resistance and annualised volatility from the real daily closing-price series.",
    inputSchema: { symbol: z.string().describe("Ticker, e.g. TATAMOTORS or AAPL") },
  },
  async ({ symbol }) => {
    const resolved = resolveSymbol(symbol);
    // Alpha Vantage first (verified for US); fall back to Yahoo when AV has no
    // data or is rate-limited, which is the common case for NSE/BSE tickers.
    let series = await getDailySeries(resolved, true);
    if (!series || series.closes.length < 30) {
      const ys = await getYahooSeries(yahooSymbol(symbol));
      if (ys && ys.closes.length >= 30) {
        series = { closes: ys.closes, points: ys.points };
      }
    }

    if (!series || series.closes.length < 30) {
      log.warn("technical data unavailable", { symbol: resolved });
      return jsonResult({
        symbol: resolved,
        sma20: null,
        sma50: null,
        sma200: null,
        ema20: null,
        rsi: null,
        macd: null,
        macdSignal: null,
        macdHistogram: null,
        trend: DATA_UNAVAILABLE,
        support: null,
        resistance: null,
        volatility: null,
        history: [],
        available: false,
      });
    }

    const closes = series.closes;
    const price = closes[closes.length - 1] as number;
    const s20 = sma(closes, 20);
    const s50 = sma(closes, 50);
    const s200 = sma(closes, 200);
    const macdRes = macd(closes);

    // Trend logic from real moving-average relationships.
    let trend: "Bullish" | "Bearish" | "Neutral" = "Neutral";
    if (s50 !== null && s200 !== null) {
      if (price > s50 && s50 > s200) trend = "Bullish";
      else if (price < s50 && s50 < s200) trend = "Bearish";
    } else if (s50 !== null) {
      trend = price > s50 ? "Bullish" : "Bearish";
    }

    const { support, resistance } = supportResistance(closes, 60);

    log.info("getTechnicalIndicators", { symbol: resolved, points: closes.length });
    return jsonResult({
      symbol: resolved,
      sma20: s20,
      sma50: s50,
      sma200: s200,
      ema20: ema(closes, 20),
      rsi: rsi(closes, 14),
      macd: macdRes.macd,
      macdSignal: macdRes.signal,
      macdHistogram: macdRes.histogram,
      trend,
      support,
      resistance,
      volatility: annualisedVolatility(closes),
      // Last 120 points keep the payload light while filling the chart.
      history: series.points.slice(Math.max(0, series.points.length - 120)),
      available: true,
    });
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
log.info("technical-server ready (stdio)");
