import { Card, Col, Empty, Row, Skeleton, Tag } from "antd";
import type { RecommendedStock } from "../types";
import { recommendationColor, scoreColor } from "../services/format";
import { FONTS } from "../theme/theme";

interface Props {
  items: RecommendedStock[];
  loading: boolean;
  dark: boolean;
  onSelect: (symbol: string) => void;
}

export default function RecommendedStocks({ items, loading, dark, onSelect }: Props) {
  return (
    <section style={{ marginTop: 8 }}>
      <div style={{ marginBottom: 14 }}>
        <div className="eyebrow" style={{ color: dark ? "#7E92B0" : "#73819A", marginBottom: 3 }}>
          From your analysis history
        </div>
        <h2
          className="display"
          style={{
            fontFamily: FONTS.displayFont,
            fontWeight: 700,
            fontSize: 20,
            margin: 0,
            color: dark ? "#EAF0F8" : "#16203A",
          }}
        >
          Top recommendations
        </h2>
      </div>

      {loading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={i}>
              <Card>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : items.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Analyze a few stocks to build your leaderboard"
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {items.map((stock) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={stock.symbol}>
              <Card
                hoverable
                className="hover-lift clickable"
                onClick={() => onSelect(stock.symbol)}
                styles={{ body: { padding: 18 } }}
                style={{ height: "100%", borderTop: `3px solid ${recommendationColor(stock.recommendation)}` }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span
                    className="mono"
                    style={{
                      fontFamily: FONTS.monoFont,
                      fontWeight: 600,
                      fontSize: 16,
                      letterSpacing: "0.03em",
                      color: dark ? "#F2F5FA" : "#0B1220",
                    }}
                  >
                    {stock.symbol}
                  </span>
                  <Tag color={recommendationColor(stock.recommendation)} style={{ marginInlineEnd: 0, fontFamily: FONTS.monoFont }}>
                    {stock.recommendation}
                  </Tag>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                  <span
                    className="mono"
                    style={{ fontFamily: FONTS.monoFont, fontWeight: 600, fontSize: 26, color: scoreColor(stock.score) }}
                  >
                    {stock.score.toFixed(1)}
                  </span>
                  <span className="eyebrow" style={{ color: dark ? "#7E92B0" : "#73819A" }}>
                    / 10
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    color: dark ? "#9DACC4" : "#54627B",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {stock.reason}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </section>
  );
}
