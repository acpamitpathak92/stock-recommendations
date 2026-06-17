import { mcp } from "../mcp/clientManager.js";
import { scoreNews, scoreSentiment } from "../scoring/score.js";
import { createLogger } from "../utils/logger.js";
import type { GraphStateType } from "../graph/state.js";
import type { NewsData, SentimentData } from "../models/types.js";

const log = createLogger("agent");

/** News Agent — latest news + catalysts via news-server; score in code. */
export async function newsAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const raw = await mcp.callTool<Omit<NewsData, "newsScore">>("news", "getNews", {
    symbol: state.symbol,
  });
  const news: NewsData = { ...raw, newsScore: scoreNews(raw) };
  log.info("newsAgent done", { articles: news.articles.length, score: news.newsScore });
  return { news };
}

/** Sentiment Agent — quantified sentiment via sentiment-server; score in code. */
export async function sentimentAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const raw = await mcp.callTool<Omit<SentimentData, "sentimentScore">>(
    "sentiment",
    "getSentiment",
    { symbol: state.symbol },
  );
  const sentiment: SentimentData = { ...raw, sentimentScore: scoreSentiment(raw) };
  log.info("sentimentAgent done", { score: sentiment.sentimentScore, label: sentiment.sentimentLabel });
  return { sentiment };
}
