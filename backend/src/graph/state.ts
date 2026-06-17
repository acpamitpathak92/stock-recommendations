import { Annotation } from "@langchain/langgraph";
import type {
  MarketData,
  TechnicalData,
  FinancialData,
  NewsData,
  SentimentData,
  RiskData,
  ValidationResult,
  ScoreBreakdown,
  Recommendation,
} from "../models/types.js";
import type { CommitteeNarrative } from "../services/gemini.js";

/**
 * Graph state. Each parallel agent writes to its own channel so the default
 * last-value reducer never sees a conflict during fan-out.
 */
export const GraphState = Annotation.Root({
  symbol: Annotation<string>(),
  resolvedSymbol: Annotation<string>(),
  skipNarrative: Annotation<boolean>({ value: (_, n) => n, default: () => false }),

  market: Annotation<MarketData | null>({ value: (_, n) => n, default: () => null }),
  technical: Annotation<TechnicalData | null>({ value: (_, n) => n, default: () => null }),
  financial: Annotation<FinancialData | null>({ value: (_, n) => n, default: () => null }),
  news: Annotation<NewsData | null>({ value: (_, n) => n, default: () => null }),
  sentiment: Annotation<SentimentData | null>({ value: (_, n) => n, default: () => null }),
  risk: Annotation<RiskData | null>({ value: (_, n) => n, default: () => null }),

  validation: Annotation<ValidationResult | null>({ value: (_, n) => n, default: () => null }),
  scores: Annotation<ScoreBreakdown | null>({ value: (_, n) => n, default: () => null }),
  recommendation: Annotation<Recommendation | null>({ value: (_, n) => n, default: () => null }),
  confidence: Annotation<number | null>({ value: (_, n) => n, default: () => null }),
  narrative: Annotation<CommitteeNarrative | null>({ value: (_, n) => n, default: () => null }),
});

export type GraphStateType = typeof GraphState.State;
