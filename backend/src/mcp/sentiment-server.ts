#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getNewsSentiment } from "../services/alphaVantage.js";
import { getEverything, scoreHeadline } from "../services/newsApi.js";
import { resolveSymbol, baseSymbol } from "../services/symbol.js";
import { jsonResult } from "./util.js";
import { DATA_UNAVAILABLE } from "../models/types.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("mcp:sentiment");

const server = new McpServer({ name: "sentiment-server", version: "1.0.0" });

server.registerTool(
  "getSentiment",
  {
    title: "Get Sentiment",
    description:
      "Returns quantified news sentiment (-1..1) from Alpha Vantage's news-sentiment " +
      "model and an analyst-proxy sentiment derived from the distribution of recent " +
      "headline sentiment.",
    inputSchema: { symbol: z.string().describe("Ticker, e.g. TATAMOTORS or AAPL") },
  },
  async ({ symbol }) => {
    const resolved = resolveSymbol(symbol);
    const base = baseSymbol(symbol);

    // News sentiment: prefer Alpha Vantage's quantified score.
    const av = await getNewsSentiment(resolved);
    let newsSentiment: number | null = av?.overallSentiment ?? null;

    // Analyst-proxy: positive/negative balance of recent headlines (real data).
    let analystSentiment: number | null = null;
    const raw = await getEverything(base);
    if (raw && raw.length > 0) {
      let acc = 0;
      for (const a of raw) acc += scoreHeadline(`${a.title} ${a.description}`).score;
      analystSentiment = Math.max(-1, Math.min(1, acc / raw.length));
      if (newsSentiment === null) newsSentiment = analystSentiment;
    }

    const blended =
      newsSentiment !== null && analystSentiment !== null
        ? (newsSentiment + analystSentiment) / 2
        : (newsSentiment ?? analystSentiment);

    const label =
      blended === null
        ? DATA_UNAVAILABLE
        : blended > 0.1
          ? "Bullish"
          : blended < -0.1
            ? "Bearish"
            : "Neutral";

    log.info("getSentiment", { symbol: resolved, newsSentiment, analystSentiment });
    return jsonResult({
      symbol: resolved,
      newsSentiment,
      analystSentiment,
      sentimentLabel: label,
      available: blended !== null,
    });
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
log.info("sentiment-server ready (stdio)");
