import { Button, Card, Col, Row, Tag } from "antd";
import { ArrowRightOutlined, CheckCircleOutlined } from "@ant-design/icons";
import type { Pick } from "../types";
import {
  formatLargeNumber,
  formatPrice,
  isUnavailable,
  recommendationColor,
  scoreColor,
} from "../services/format";
import { FONTS } from "../theme/theme";

interface Props {
  picks: Pick[];
  dark: boolean;
  onOpenFull: (symbol: string) => void;
}

const COMPONENTS: Array<{ key: keyof Pick; label: string }> = [
  { key: "technicalScore", label: "Tech" },
  { key: "financialScore", label: "Fin" },
  { key: "sentimentScore", label: "Sent" },
  { key: "newsScore", label: "News" },
  { key: "riskScore", label: "Risk" },
];

function MiniBar({ label, value, dark }: { label: string; value: number; dark: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span className="eyebrow" style={{ color: dark ? "#7E92B0" : "#73819A" }}>{label}</span>
        <span className="mono" style={{ fontFamily: FONTS.monoFont, fontSize: 11, fontWeight: 600, color: scoreColor(value) }}>
          {value.toFixed(1)}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: dark ? "#1C2840" : "#EAEFF6", overflow: "hidden" }}>
        <div style={{ width: `${Math.max(0, Math.min(100, value * 10))}%`, height: "100%", borderRadius: 3, background: scoreColor(value), transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function PickCard({ p, dark, onOpenFull }: { p: Pick; dark: boolean; onOpenFull: (s: string) => void }) {
  const recColor = recommendationColor(p.recommendation);
  const company = isUnavailable(p.market.companyName) ? p.symbol : p.market.companyName;
  const reasons = (p.evidence ?? []).filter((e) => !isUnavailable(e)).slice(0, 3);

  return (
    <Card
      className="hover-lift"
      style={{ height: "100%", borderTop: `3px solid ${recColor}` }}
      styles={{ body: { padding: 18, display: "flex", flexDirection: "column", height: "100%" } }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ display: "flex", gap: 11, minWidth: 0 }}>
          <span
            className="mono"
            style={{
              flex: "0 0 auto",
              width: 30,
              height: 30,
              borderRadius: 9,
              display: "grid",
              placeItems: "center",
              fontFamily: FONTS.monoFont,
              fontWeight: 700,
              fontSize: 14,
              color: "#fff",
              background: recColor,
            }}
          >
            {p.rank}
          </span>
          <div style={{ minWidth: 0 }}>
            <div
              className="display"
              style={{ fontFamily: FONTS.displayFont, fontWeight: 700, fontSize: 16, color: dark ? "#F2F5FA" : "#0B1220", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {company}
            </div>
            <div className="mono" style={{ fontFamily: FONTS.monoFont, fontSize: 11, color: dark ? "#7F93B1" : "#6B7A92" }}>
              {p.resolvedSymbol}
            </div>
          </div>
        </div>
        <Tag color={recColor} style={{ marginInlineEnd: 0, fontFamily: FONTS.monoFont, fontWeight: 600 }}>
          {p.recommendation}
        </Tag>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 14, margin: "14px 0 12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span className="mono" style={{ fontFamily: FONTS.monoFont, fontWeight: 600, fontSize: 30, color: scoreColor(p.overallScore) }}>
            {p.overallScore.toFixed(1)}
          </span>
          <span className="eyebrow" style={{ color: dark ? "#7E92B0" : "#73819A" }}>/ 10</span>
        </div>
        <div style={{ borderLeft: `1px solid ${dark ? "#1F2A3D" : "#E6EAF1"}`, paddingLeft: 14 }}>
          <div className="eyebrow" style={{ color: dark ? "#7E92B0" : "#73819A" }}>Confidence</div>
          <div className="mono" style={{ fontFamily: FONTS.monoFont, fontSize: 14, color: dark ? "#DCE5F1" : "#1F2A40" }}>{p.confidence}%</div>
        </div>
        <div>
          <div className="eyebrow" style={{ color: dark ? "#7E92B0" : "#73819A" }}>Price</div>
          <div className="mono" style={{ fontFamily: FONTS.monoFont, fontSize: 14, color: dark ? "#DCE5F1" : "#1F2A40" }}>{formatPrice(p.market.currentPrice)}</div>
        </div>
        <div>
          <div className="eyebrow" style={{ color: dark ? "#7E92B0" : "#73819A" }}>Mkt cap</div>
          <div className="mono" style={{ fontFamily: FONTS.monoFont, fontSize: 14, color: dark ? "#DCE5F1" : "#1F2A40" }}>{formatLargeNumber(p.market.marketCap)}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {COMPONENTS.map((c) => (
          <MiniBar key={String(c.key)} label={c.label} value={p[c.key] as number} dark={dark} />
        ))}
      </div>

      <div style={{ flex: 1, marginBottom: 14 }}>
        {reasons.length ? (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 7 }}>
            {reasons.map((r, i) => (
              <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <CheckCircleOutlined style={{ color: "#0FB5B0", marginTop: 3, fontSize: 12 }} />
                <span className="mono" style={{ fontFamily: FONTS.monoFont, fontSize: 11.5, lineHeight: 1.45, color: dark ? "#BFCBDD" : "#3B475D" }}>
                  {r}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <span style={{ fontSize: 12.5, color: dark ? "#7E92B0" : "#7A879C" }}>
            Ranked on the live score; open the full report for detail.
          </span>
        )}
      </div>

      <Button type="text" onClick={() => onOpenFull(p.resolvedSymbol)} style={{ alignSelf: "flex-start", paddingInline: 0, color: "#0FB5B0" }}>
        Full report &amp; narrative <ArrowRightOutlined />
      </Button>
    </Card>
  );
}

export default function TopPicks({ picks, dark, onOpenFull }: Props) {
  return (
    <Row gutter={[16, 16]}>
      {picks.map((p) => (
        <Col xs={24} md={12} xl={8} key={p.resolvedSymbol}>
          <PickCard p={p} dark={dark} onOpenFull={onOpenFull} />
        </Col>
      ))}
    </Row>
  );
}
