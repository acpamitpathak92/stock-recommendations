import { Card, Col, Row, Tooltip } from "antd";
import type { AnalysisResult } from "../types";
import VerdictGauge from "./VerdictGauge";
import { formatLargeNumber, formatPrice, isUnavailable, UNAVAILABLE } from "../services/format";
import { FONTS } from "../theme/theme";

interface SummaryCardsProps {
  result: AnalysisResult;
  dark: boolean;
}

function Metric({
  label,
  value,
  hint,
  dark,
  mono = true,
}: {
  label: string;
  value: string;
  hint?: string;
  dark: boolean;
  mono?: boolean;
}) {
  const unavailable = value === UNAVAILABLE;
  return (
    <Card className="hover-lift" styles={{ body: { padding: 18 } }} style={{ height: "100%" }}>
      <div className="eyebrow" style={{ color: dark ? "#7E92B0" : "#73819A" }}>
        {label}
      </div>
      <Tooltip title={unavailable ? "No data from upstream provider" : hint}>
        <div
          className={mono ? "mono" : undefined}
          style={{
            marginTop: 8,
            fontFamily: mono ? FONTS.monoFont : FONTS.displayFont,
            fontWeight: 600,
            fontSize: unavailable ? 15 : 24,
            color: unavailable ? (dark ? "#5C6B84" : "#9AA6B8") : dark ? "#F2F5FA" : "#0B1220",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </div>
      </Tooltip>
    </Card>
  );
}

export default function SummaryCards({ result, dark }: SummaryCardsProps) {
  const { market } = result;
  const companyKnown = !isUnavailable(market.companyName);

  return (
    <Row gutter={[16, 16]} align="stretch">
      <Col xs={24} lg={9}>
        <Card
          style={{
            height: "100%",
            background: dark
              ? "linear-gradient(155deg, #0F1C30 0%, #101828 60%)"
              : "linear-gradient(155deg, #FFFFFF 0%, #F4F8FB 100%)",
          }}
          styles={{ body: { padding: 24 } }}
        >
          <div style={{ marginBottom: 16 }}>
            <div
              className="display"
              style={{
                fontFamily: FONTS.displayFont,
                fontWeight: 700,
                fontSize: 22,
                color: dark ? "#F2F5FA" : "#0B1220",
              }}
            >
              {companyKnown ? market.companyName : result.symbol}
            </div>
            <div
              className="mono"
              style={{
                fontFamily: FONTS.monoFont,
                fontSize: 12,
                marginTop: 2,
                color: dark ? "#7F93B1" : "#6B7A92",
              }}
            >
              {result.resolvedSymbol}
              {!isUnavailable(market.sector) ? ` · ${market.sector}` : ""}
            </div>
          </div>
          <VerdictGauge
            score={result.overallScore}
            recommendation={result.recommendation}
            confidence={result.confidence}
            dark={dark}
          />
        </Card>
      </Col>

      <Col xs={24} lg={15}>
        <Row gutter={[16, 16]}>
          <Col xs={12} md={8}>
            <Metric label="Current price" value={formatPrice(market.currentPrice)} dark={dark} />
          </Col>
          <Col xs={12} md={8}>
            <Metric label="Market cap" value={formatLargeNumber(market.marketCap)} dark={dark} />
          </Col>
          <Col xs={12} md={8}>
            <Metric label="P / E" value={formatPrice(market.peRatio)} dark={dark} />
          </Col>
          <Col xs={12} md={8}>
            <Metric label="EPS" value={formatPrice(market.eps)} dark={dark} />
          </Col>
          <Col xs={12} md={8}>
            <Metric label="52W high" value={formatPrice(market.week52High)} dark={dark} />
          </Col>
          <Col xs={12} md={8}>
            <Metric label="52W low" value={formatPrice(market.week52Low)} dark={dark} />
          </Col>
          <Col xs={12} md={8}>
            <Metric
              label="Dividend yield"
              value={
                isUnavailable(market.dividendYield)
                  ? UNAVAILABLE
                  : `${((market.dividendYield as number) * 100).toFixed(2)}%`
              }
              dark={dark}
            />
          </Col>
          <Col xs={12} md={8}>
            <Metric label="Volume" value={formatLargeNumber(market.volume)} dark={dark} />
          </Col>
          <Col xs={12} md={8}>
            <Metric label="Beta" value={formatPrice(market.beta)} dark={dark} />
          </Col>
        </Row>
      </Col>
    </Row>
  );
}
