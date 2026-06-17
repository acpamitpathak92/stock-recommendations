import { Empty } from "antd";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
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

export default function PriceTrendChart({ result, dark }: Props) {
  const { technical } = result;
  const data = technical.history ?? [];
  const color = recommendationColor(result.recommendation);
  const axis = dark ? "#7C8DA8" : "#7A879C";
  const grid = dark ? "#1C2840" : "#EDF1F7";
  const gradId = "priceFill";

  return (
    <SectionCard title="Historical price trend" eyebrow="Trailing closes" dark={dark}>
      {data.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No price history available" style={{ padding: "48px 0" }} />
      ) : (
        <ResponsiveContainer width="100%" height={264}>
          <AreaChart data={data} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
            {technical.support != null && (
              <ReferenceLine y={technical.support} stroke="#16A34A" strokeDasharray="4 4" strokeOpacity={0.7} />
            )}
            {technical.resistance != null && (
              <ReferenceLine y={technical.resistance} stroke="#DC2626" strokeDasharray="4 4" strokeOpacity={0.7} />
            )}
            <Area type="monotone" dataKey="close" name="Close" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}
