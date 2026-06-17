import { useState } from "react";
import { Input, Button, Space, Tag, Segmented } from "antd";
import { SearchOutlined, ThunderboltFilled, StarFilled } from "@ant-design/icons";
import { FONTS } from "../theme/theme";

interface SearchSectionProps {
  onAnalyze: (symbol: string) => void;
  onLoadTopPicks: (market: "in" | "us") => void;
  loading: boolean;
  picksLoading: boolean;
  dark: boolean;
}

const EXAMPLES = ["AAPL", "MSFT", "NVDA", "TATAMOTORS", "RELIANCE"];

export default function SearchSection({
  onAnalyze,
  onLoadTopPicks,
  loading,
  picksLoading,
  dark,
}: SearchSectionProps) {
  const [value, setValue] = useState("");
  const [market, setMarket] = useState<"in" | "us">("in");

  const submit = (sym?: string) => {
    const symbol = (sym ?? value).trim().toUpperCase();
    if (symbol) onAnalyze(symbol);
  };

  const busy = loading || picksLoading;

  return (
    <section style={{ marginBottom: 28 }}>
      <div className="eyebrow" style={{ color: dark ? "#7FE3DF" : "#0E8F8B", marginBottom: 10 }}>
        Research desk
      </div>
      <h1
        className="display"
        style={{
          fontFamily: FONTS.displayFont,
          fontWeight: 700,
          fontSize: "clamp(26px, 4vw, 40px)",
          lineHeight: 1.08,
          letterSpacing: "-0.02em",
          margin: "0 0 6px",
          color: dark ? "#F2F5FA" : "#0B1220",
        }}
      >
        Analyze any ticker with a desk of agents.
      </h1>
      <p
        style={{
          margin: "0 0 20px",
          maxWidth: 620,
          fontSize: 15,
          color: dark ? "#93A4BF" : "#54627B",
        }}
      >
        Six specialists research market, technicals, fundamentals, news, sentiment and
        risk in parallel — then a committee scores the evidence and writes the call.
      </p>

      <Space.Compact style={{ width: "100%", maxWidth: 560 }}>
        <Input
          size="large"
          allowClear
          value={value}
          placeholder="Enter a symbol, e.g. AAPL or RELIANCE.NS"
          prefix={<SearchOutlined style={{ opacity: 0.5 }} />}
          onChange={(e) => setValue(e.target.value)}
          onPressEnter={() => submit()}
          disabled={busy}
          style={{ fontFamily: FONTS.monoFont, letterSpacing: "0.04em" }}
        />
        <Button
          size="large"
          type="primary"
          icon={<ThunderboltFilled />}
          loading={loading}
          disabled={picksLoading}
          onClick={() => submit()}
        >
          Analyze
        </Button>
      </Space.Compact>

      <div
        style={{
          marginTop: 18,
          padding: 16,
          borderRadius: 14,
          border: `1px solid ${dark ? "#1C3A3C" : "#CDEBEA"}`,
          background: dark ? "#0C2024" : "#F0FBFA",
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 260px" }}>
          <div
            className="display"
            style={{
              fontFamily: FONTS.displayFont,
              fontWeight: 700,
              fontSize: 17,
              color: dark ? "#EAF0F8" : "#0B1220",
              marginBottom: 2,
            }}
          >
            Not sure what to buy?
          </div>
          <div style={{ fontSize: 13, color: dark ? "#9FC7C5" : "#3E6E6C" }}>
            Screens {market === "in" ? "Indian" : "US"} large-caps live and ranks the 5 best buys as of now.
          </div>
        </div>
        <Segmented
          value={market}
          onChange={(v) => setMarket(v as "in" | "us")}
          disabled={busy}
          options={[
            { label: "India (NSE)", value: "in" },
            { label: "US", value: "us" },
          ]}
        />
        <Button
          size="large"
          type="primary"
          icon={<StarFilled />}
          loading={picksLoading}
          disabled={loading}
          onClick={() => onLoadTopPicks(market)}
          style={{ fontWeight: 600 }}
        >
          {picksLoading ? "Screening the market…" : "Top 5 stocks to buy now"}
        </Button>
      </div>

      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: dark ? "#6B7C97" : "#7A879C" }}>Try</span>
        {EXAMPLES.map((ex) => (
          <Tag
            key={ex}
            className="clickable hover-lift"
            onClick={() => !busy && submit(ex)}
            style={{
              cursor: busy ? "not-allowed" : "pointer",
              fontFamily: FONTS.monoFont,
              fontSize: 12,
              padding: "2px 10px",
              borderRadius: 999,
              border: `1px solid ${dark ? "#24344C" : "#DCE3EE"}`,
              background: dark ? "#0F1B2D" : "#FFFFFF",
              color: dark ? "#9DB0CC" : "#48566E",
            }}
          >
            {ex}
          </Tag>
        ))}
      </div>
    </section>
  );
}
