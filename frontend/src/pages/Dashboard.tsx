import { useRef } from "react";
import { Button, Card, Col, Row } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import type { AnalysisResult, Pick, RecommendedStock } from "../types";
import SearchSection from "../components/SearchSection";
import SummaryCards from "../components/SummaryCards";
import ScoreBreakdownChart from "../components/ScoreBreakdownChart";
import TechnicalChart from "../components/TechnicalChart";
import PriceTrendChart from "../components/PriceTrendChart";
import BullBearPanels, { ThesisPanel } from "../components/BullBearPanels";
import EvidencePanel from "../components/EvidencePanel";
import NewsPanel from "../components/NewsPanel";
import RecommendedStocks from "../components/RecommendedStocks";
import TopPicks from "../components/TopPicks";
import { AnalysisLoading, EmptyState, ErrorState } from "../components/States";
import { FONTS } from "../theme/theme";

interface DashboardProps {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  lastSymbol: string;
  recommended: RecommendedStock[];
  recommendedLoading: boolean;
  picks: Pick[];
  picksAsOf: string | null;
  picksLoading: boolean;
  picksError: string | null;
  picksRan: boolean;
  picksScreened: number;
  onAnalyze: (symbol: string) => void;
  onLoadTopPicks: (market: "in" | "us") => void;
  onClearResult: () => void;
  dark: boolean;
}

export default function Dashboard(props: DashboardProps) {
  const {
    result,
    loading,
    error,
    lastSymbol,
    recommended,
    recommendedLoading,
    picks,
    picksAsOf,
    picksLoading,
    picksError,
    picksRan,
    picksScreened,
    onAnalyze,
    onLoadTopPicks,
    onClearResult,
    dark,
  } = props;

  const resultRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = (symbol: string) => {
    onAnalyze(symbol);
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const hasPicks = picks.length > 0;
  const asOfText = picksAsOf
    ? new Date(picksAsOf).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <div className="content-wrap">
      <SearchSection
        onAnalyze={handleAnalyze}
        onLoadTopPicks={onLoadTopPicks}
        loading={loading}
        picksLoading={picksLoading}
        dark={dark}
      />

      <div ref={resultRef} style={{ scrollMarginTop: 80 }}>
        {loading ? (
          <AnalysisLoading symbol={lastSymbol} dark={dark} />
        ) : error ? (
          <ErrorState message={error} onRetry={lastSymbol ? () => handleAnalyze(lastSymbol) : undefined} />
        ) : result ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {hasPicks && (
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={onClearResult}
                style={{ alignSelf: "flex-start", paddingInline: 0, color: "#0FB5B0" }}
              >
                Back to top picks
              </Button>
            )}
            <SummaryCards result={result} dark={dark} />

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <ScoreBreakdownChart result={result} dark={dark} />
              </Col>
              <Col xs={24} lg={12}>
                <EvidencePanel result={result} dark={dark} />
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <TechnicalChart result={result} dark={dark} />
              </Col>
              <Col xs={24} lg={12}>
                <PriceTrendChart result={result} dark={dark} />
              </Col>
            </Row>

            <BullBearPanels bullCase={result.bullCase} bearCase={result.bearCase} dark={dark} />

            <ThesisPanel thesis={result.investmentThesis} analysis={result.analysis} dark={dark} />

            <NewsPanel news={result.news} dark={dark} />
          </div>
        ) : picksLoading ? (
          <AnalysisLoading symbol="the market" dark={dark} />
        ) : hasPicks || picksRan ? null : (
          <EmptyState dark={dark} />
        )}
      </div>

      {(hasPicks || picksError || picksRan) && !result && (
        <section style={{ marginTop: 28 }}>
          <div style={{ marginBottom: 14 }}>
            <div className="eyebrow" style={{ color: dark ? "#7E92B0" : "#73819A", marginBottom: 3 }}>
              Live screen{asOfText ? ` · as of ${asOfText}` : ""}
            </div>
            <h2
              className="display"
              style={{ fontFamily: FONTS.displayFont, fontWeight: 700, fontSize: 20, margin: 0, color: dark ? "#EAF0F8" : "#16203A" }}
            >
              {hasPicks ? `Top ${picks.length} to buy right now` : "Stocks to buy right now"}
            </h2>
          </div>
          {picksError ? (
            <ErrorState message={picksError} />
          ) : hasPicks ? (
            <TopPicks picks={picks} dark={dark} onOpenFull={handleAnalyze} />
          ) : (
            <Card styles={{ body: { padding: "40px 28px", textAlign: "center" } }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>🛡️</div>
              <div
                className="display"
                style={{ fontFamily: FONTS.displayFont, fontWeight: 700, fontSize: 18, color: dark ? "#EAF0F8" : "#16203A", marginBottom: 6 }}
              >
                No clear buys right now
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: dark ? "#93A4BF" : "#54627B", maxWidth: 460, margin: "0 auto" }}>
                Screened {picksScreened} stocks live — none currently clear the buy threshold (overall score ≥ 7).
                The desk won't surface a "buy" it doesn't stand behind. Markets move; try again later, or switch markets above.
              </div>
            </Card>
          )}
        </section>
      )}

      <div style={{ marginTop: 36 }}>
        <RecommendedStocks
          items={recommended}
          loading={recommendedLoading}
          dark={dark}
          onSelect={handleAnalyze}
        />
      </div>
    </div>
  );
}
