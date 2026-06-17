import { Progress, Tag } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import type { AnalysisResult } from "../types";
import SectionCard from "./SectionCard";
import { FONTS } from "../theme/theme";

interface Props {
  result: AnalysisResult;
  dark: boolean;
}

export default function EvidencePanel({ result, dark }: Props) {
  const quality = result.validation.dataQuality;
  const qualityColor = quality >= 70 ? "#16A34A" : quality >= 40 ? "#D97706" : "#DC2626";

  return (
    <SectionCard
      title="Evidence"
      eyebrow="What the call is built on"
      dark={dark}
      extra={
        <Tag
          color={qualityColor}
          style={{ fontFamily: FONTS.monoFont, marginInlineEnd: 0 }}
        >
          {quality}% data quality
        </Tag>
      }
    >
      <Progress
        percent={quality}
        showInfo={false}
        strokeColor={qualityColor}
        trailColor={dark ? "#1C2840" : "#EAEFF6"}
        style={{ marginBottom: 16 }}
      />
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {result.evidence.map((item, idx) => (
          <li key={idx} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
            <CheckCircleOutlined style={{ color: "#0FB5B0", marginTop: 3, fontSize: 13 }} />
            <span
              className="mono"
              style={{
                fontFamily: FONTS.monoFont,
                fontSize: 12.5,
                lineHeight: 1.45,
                color: dark ? "#BFCBDD" : "#3B475D",
              }}
            >
              {item}
            </span>
          </li>
        ))}
      </ul>

      {result.validation.contradictions.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="eyebrow" style={{ color: "#D97706", marginBottom: 6 }}>
            Contradictions flagged
          </div>
          {result.validation.contradictions.map((c, i) => (
            <div key={i} style={{ fontSize: 12.5, color: dark ? "#D9A05B" : "#9A6212", lineHeight: 1.5 }}>
              • {c}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
