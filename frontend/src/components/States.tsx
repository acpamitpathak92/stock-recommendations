import { useEffect, useState } from "react";
import { Card, Result, Button } from "antd";
import { FONTS } from "../theme/theme";

const AGENTS = [
  "Market agent",
  "Technical agent",
  "Financial agent",
  "News agent",
  "Sentiment agent",
  "Risk agent",
  "Validation agent",
  "Investment committee",
];

export function AnalysisLoading({ symbol, dark }: { symbol: string; dark: boolean }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % AGENTS.length), 650);
    return () => clearInterval(id);
  }, []);

  return (
    <Card styles={{ body: { padding: "40px 28px" } }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div className="eyebrow" style={{ color: dark ? "#7FE3DF" : "#0E8F8B", marginBottom: 8 }}>
          Researching
        </div>
        <div
          className="display"
          style={{
            fontFamily: FONTS.displayFont,
            fontWeight: 700,
            fontSize: 24,
            color: dark ? "#F2F5FA" : "#0B1220",
          }}
        >
          The desk is analyzing {symbol}
        </div>
        <div style={{ fontSize: 13.5, color: dark ? "#93A4BF" : "#54627B", marginTop: 6 }}>
          Agents are gathering data through MCP tools and scoring the evidence.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 10,
          maxWidth: 680,
          margin: "0 auto",
        }}
      >
        {AGENTS.map((name, i) => {
          const done = i < active;
          const running = i === active;
          const color = done ? "#16A34A" : running ? "#0FB5B0" : dark ? "#33415A" : "#CBD5E1";
          return (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "9px 12px",
                borderRadius: 10,
                border: `1px solid ${dark ? "#1C2840" : "#E6EAF1"}`,
                background: running ? (dark ? "#0F2230" : "#ECFAF9") : "transparent",
                transition: "background 0.3s ease",
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  background: color,
                  boxShadow: running ? `0 0 0 4px ${dark ? "rgba(15,181,176,0.18)" : "rgba(15,181,176,0.16)"}` : "none",
                  transition: "all 0.3s ease",
                }}
              />
              <span
                className="mono"
                style={{ fontFamily: FONTS.monoFont, fontSize: 12, color: dark ? "#AFC0D8" : "#46556E" }}
              >
                {name}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function EmptyState({ dark }: { dark: boolean }) {
  return (
    <Card styles={{ body: { padding: "56px 28px" } }}>
      <div style={{ textAlign: "center", maxWidth: 460, margin: "0 auto" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
        <div
          className="display"
          style={{
            fontFamily: FONTS.displayFont,
            fontWeight: 700,
            fontSize: 20,
            color: dark ? "#EAF0F8" : "#16203A",
            marginBottom: 6,
          }}
        >
          Enter a symbol to begin
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.55, color: dark ? "#93A4BF" : "#54627B" }}>
          Type a ticker above and the desk will research it end to end — market data,
          technicals, fundamentals, news, sentiment and risk — then deliver a scored call.
        </div>
      </div>
    </Card>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card styles={{ body: { padding: "16px" } }}>
      <Result
        status="warning"
        title="Couldn't complete the analysis"
        subTitle={message}
        extra={onRetry ? <Button type="primary" onClick={onRetry}>Try again</Button> : undefined}
      />
    </Card>
  );
}
