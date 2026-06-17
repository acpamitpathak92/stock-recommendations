import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { AnalysisResult } from "../types";
import SectionCard from "./SectionCard";
import { scoreColor } from "../services/format";
import { FONTS } from "../theme/theme";

interface Props {
  result: AnalysisResult;
  dark: boolean;
}

export default function ScoreBreakdownChart({ result, dark }: Props) {
  const data = [
    { name: "Technical", score: result.technicalScore, weight: "25%" },
    { name: "Financial", score: result.financialScore, weight: "35%" },
    { name: "Sentiment", score: result.sentimentScore, weight: "15%" },
    { name: "News", score: result.newsScore, weight: "10%" },
    { name: "Risk", score: result.riskScore, weight: "15%" },
  ];
  const axis = dark ? "#7C8DA8" : "#7A879C";
  const gridText = dark ? "#9DB0CC" : "#48566E";

  return (
    <SectionCard title="Score breakdown" eyebrow="Weighted components" dark={dark}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 18, right: 8, left: -18, bottom: 0 }} barCategoryGap="28%">
          <XAxis
            dataKey="name"
            tick={{ fill: gridText, fontSize: 12, fontFamily: FONTS.bodyFont }}
            axisLine={{ stroke: dark ? "#23314A" : "#E2E8F1" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            tick={{ fill: axis, fontSize: 11, fontFamily: FONTS.monoFont }}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={56} isAnimationActive>
            {data.map((d) => (
              <Cell key={d.name} fill={scoreColor(d.score)} />
            ))}
            <LabelList
              dataKey="score"
              position="top"
              formatter={(v: number) => v.toFixed(1)}
              style={{ fill: gridText, fontFamily: FONTS.monoFont, fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", justifyContent: "space-around", marginTop: 4 }}>
        {data.map((d) => (
          <span
            key={d.name}
            className="mono"
            style={{ fontFamily: FONTS.monoFont, fontSize: 10.5, color: axis }}
          >
            {d.weight}
          </span>
        ))}
      </div>
    </SectionCard>
  );
}
