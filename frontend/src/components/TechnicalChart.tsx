import { useMemo } from "react";
import { Empty, Tag } from "antd";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalysisResult } from "../types";
import SectionCard from "./SectionCard";
import { recommendationColor } from "../services/format";
import { FONTS } from "../theme/theme";

interface Props {
  result: AnalysisResult;
  dark: boolean;
}

interface Row {
  date: string;
  close: number;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
}

/** Trailing simple moving average at index i over `period` closes. */
function smaAt(closes: number[], i: number, period: number): number | null {
  if (i + 1 < period) return null;
  let sum = 0;
  for (let k = i - period + 1; k <= i; k++) sum += closes[k]!;
  return sum / period;
}

export default function TechnicalChart({ result, dark }: Props) {
  const { technical } = result;

  const rows = useMemo<Row[]>(() => {
    const hist = technical.history ?? [];
    const closes = hist.map((p) => p.close);
    return hist.map((p, i) => ({
      date: p.date,
      close: p.close,
      sma20: smaAt(closes, i, 20),
      sma50: smaAt(closes, i, 50),
      sma200: smaAt(closes, i, 200),
    }));
  }, [technical.history]);

  const axis = dark ? "#7C8DA8" : "#7A879C";
  const grid = dark ? "#1C2840" : "#EDF1F7";
  const trend = technical.trend;
  const trendColor =
    trend === "Bullish" ? "#16A34A" : trend === "Bearish" ? "#DC2626" : "#D97706";

  const extra =
    trend && trend !== "Data unavailable" ? (
      <Tag color={trendColor} style={{ fontFamily: FONTS.monoFont, marginInlineEnd: 0 }}>
        {trend.toUpperCase()}
      </Tag>
    ) : null;

  return (
    <SectionCard title="Technical indicators" eyebrow="Price · SMA 20 / 50 / 200" extra={extra} dark={dark}>
      {rows.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No price history available" style={{ padding: "48px 0" }} />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={264}>
            <LineChart data={rows} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: axis, fontSize: 10, fontFamily: FONTS.monoFont }}
                axisLine={{ stroke: grid }}
                tickLine={false}
                minTickGap={48}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: axis, fontSize: 10, fontFamily: FONTS.monoFont }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <RTooltip
                contentStyle={{
                  background: dark ? "#0F1B2D" : "#FFFFFF",
                  border: `1px solid ${dark ? "#24344C" : "#E2E8F1"}`,
                  borderRadius: 10,
                  fontFamily: FONTS.monoFont,
                  fontSize: 12,
                }}
                labelStyle={{ color: dark ? "#9DB0CC" : "#48566E" }}
              />
              <Line type="monotone" dataKey="close" name="Close" stroke={recommendationColor(result.recommendation)} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="sma20" name="SMA20" stroke="#0FB5B0" strokeWidth={1.4} dot={false} connectNulls />
              <Line type="monotone" dataKey="sma50" name="SMA50" stroke="#7C8CF8" strokeWidth={1.4} dot={false} connectNulls />
              <Line type="monotone" dataKey="sma200" name="SMA200" stroke="#E0A53B" strokeWidth={1.4} dot={false} connectNulls strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
          <Legend dark={dark} />
        </>
      )}
    </SectionCard>
  );
}

function Legend({ dark }: { dark: boolean }) {
  const items = [
    { label: "Close", color: "#64748B" },
    { label: "SMA20", color: "#0FB5B0" },
    { label: "SMA50", color: "#7C8CF8" },
    { label: "SMA200", color: "#E0A53B" },
  ];
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10, paddingLeft: 8 }}>
      {items.map((it) => (
        <span key={it.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 3, borderRadius: 2, background: it.color }} />
          <span className="mono" style={{ fontFamily: FONTS.monoFont, fontSize: 11, color: dark ? "#93A4BF" : "#54627B" }}>
            {it.label}
          </span>
        </span>
      ))}
    </div>
  );
}
