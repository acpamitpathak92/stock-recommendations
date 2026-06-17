import { useCallback, useEffect, useState } from "react";
import type { AnalysisResult, Pick, RecommendedStock } from "../types";
import { analyzeStock, fetchRecommended, fetchTopPicks } from "../services/api";

interface UseAnalysis {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  recommended: RecommendedStock[];
  recommendedLoading: boolean;
  picks: Pick[];
  picksAsOf: string | null;
  picksLoading: boolean;
  picksError: string | null;
  picksRan: boolean;
  picksScreened: number;
  analyze: (symbol: string) => Promise<void>;
  loadTopPicks: (market: "in" | "us") => Promise<void>;
  showResult: (result: AnalysisResult) => void;
  reloadRecommended: () => Promise<void>;
  reset: () => void;
}

export function useAnalysis(): UseAnalysis {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<RecommendedStock[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [picksAsOf, setPicksAsOf] = useState<string | null>(null);
  const [picksLoading, setPicksLoading] = useState(false);
  const [picksError, setPicksError] = useState<string | null>(null);
  const [picksRan, setPicksRan] = useState(false);
  const [picksScreened, setPicksScreened] = useState(0);

  const reloadRecommended = useCallback(async () => {
    setRecommendedLoading(true);
    try {
      const data = await fetchRecommended();
      setRecommended(data);
    } catch {
      // Recommendations are non-critical; keep whatever we had and stay quiet.
    } finally {
      setRecommendedLoading(false);
    }
  }, []);

  const analyze = useCallback(
    async (symbol: string) => {
      const trimmed = symbol.trim().toUpperCase();
      if (!trimmed) return;
      setLoading(true);
      setError(null);
      try {
        const data = await analyzeStock(trimmed);
        setResult(data);
        void reloadRecommended();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [reloadRecommended],
  );

  const loadTopPicks = useCallback(
    async (market: "in" | "us") => {
      setPicksLoading(true);
      setPicksError(null);
      setPicksRan(false);
      setResult(null);
      try {
        const data = await fetchTopPicks(market);
        setPicks(data.picks);
        setPicksAsOf(data.asOf);
        setPicksScreened(data.screened);
        setPicksRan(true);
        void reloadRecommended();
      } catch (err) {
        setPicksError(err instanceof Error ? err.message : "Failed to screen for top picks.");
        setPicks([]);
        setPicksRan(false);
      } finally {
        setPicksLoading(false);
      }
    },
    [reloadRecommended],
  );

  const showResult = useCallback((r: AnalysisResult) => {
    setResult(r);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  useEffect(() => {
    void reloadRecommended();
  }, [reloadRecommended]);

  return {
    result,
    loading,
    error,
    recommended,
    recommendedLoading,
    picks,
    picksAsOf,
    picksLoading,
    picksError,
    picksRan,
    picksScreened,
    analyze,
    loadTopPicks,
    showResult,
    reloadRecommended,
    reset,
  };
}
