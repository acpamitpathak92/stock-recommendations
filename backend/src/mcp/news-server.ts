#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getEverything, scoreHeadline, type RawArticle } from "../services/newsApi.js";
import { getNewsSentiment } from "../services/alphaVantage.js";
import { resolveSymbol, baseSymbol } from "../services/symbol.js";
import { jsonResult } from "./util.js";
import { createLogger } from "../utils/logger.js";
import type { NewsArticle } from "../models/types.js";

const log = createLogger("mcp:news");

const server = new McpServer({ name: "news-server", version: "1.0.0" });

server.registerTool(
  "getNews",
  {
    title: "Get News",
    description:
      "Collects the latest news for a stock and classifies positive catalysts, " +
      "negative catalysts and key events. Sources: NewsAPI and Alpha Vantage news.",
    inputSchema: { symbol: z.string().describe("Ticker, e.g. TATAMOTORS or AAPL") },
  },
  async ({ symbol }) => {
    const resolved = resolveSymbol(symbol);
    const base = baseSymbol(symbol);

    let articles: NewsArticle[] = [];

    // Primary source: NewsAPI.
    const raw = await getEverything(base);
    if (raw && raw.length > 0) {
      articles = raw.map((a: RawArticle) => {
        const { label } = scoreHeadline(`${a.title} ${a.description}`);
        return {
          title: a.title,
          source: a.source,
          url: a.url,
          publishedAt: a.publishedAt,
          sentiment: label,
        };
      });
    } else {
      // Fallback: Alpha Vantage news sentiment feed.
      const av = await getNewsSentiment(resolved);
      if (av) {
        articles = av.items.map((i) => ({
          title: i.title,
          source: i.source,
          url: i.url,
          publishedAt: i.publishedAt,
          sentiment:
            i.sentimentScore > 0.1 ? "positive" : i.sentimentScore < -0.1 ? "negative" : "neutral",
        }));
      }
    }

    const positiveCatalysts = articles.filter((a) => a.sentiment === "positive").map((a) => a.title).slice(0, 5);
    const negativeCatalysts = articles.filter((a) => a.sentiment === "negative").map((a) => a.title).slice(0, 5);
    const keyEvents = articles.slice(0, 5).map((a) => a.title);

    log.info("getNews", { symbol: resolved, count: articles.length });
    return jsonResult({
      symbol: resolved,
      articles: articles.slice(0, 12),
      positiveCatalysts,
      negativeCatalysts,
      keyEvents,
      available: articles.length > 0,
    });
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
log.info("news-server ready (stdio)");
