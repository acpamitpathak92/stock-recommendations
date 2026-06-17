import { Col, Row } from "antd";
import { RiseOutlined, FallOutlined } from "@ant-design/icons";
import SectionCard from "./SectionCard";
import { isUnavailable } from "../services/format";
import { FONTS } from "../theme/theme";

interface Props {
  bullCase: string[];
  bearCase: string[];
  dark: boolean;
}

function CaseList({ items, tone, dark }: { items: string[]; tone: "bull" | "bear"; dark: boolean }) {
  const accent = tone === "bull" ? "#16A34A" : "#DC2626";
  const clean = items.filter((i) => !isUnavailable(i));
  const display = clean.length ? clean : ["Data unavailable"];

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      {display.map((item, idx) => (
        <li key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span
            style={{
              marginTop: 7,
              flex: "0 0 auto",
              width: 7,
              height: 7,
              borderRadius: 999,
              background: clean.length ? accent : "#94A3B8",
            }}
          />
          <span
            style={{
              fontSize: 13.5,
              lineHeight: 1.5,
              color: clean.length ? (dark ? "#CBD6E6" : "#33415A") : dark ? "#5C6B84" : "#9AA6B8",
            }}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function BullBearPanels({ bullCase, bearCase, dark }: Props) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <SectionCard
          title="Bull case"
          eyebrow="Reasons to own"
          dark={dark}
          extra={<RiseOutlined style={{ color: "#16A34A", fontSize: 18 }} />}
        >
          <CaseList items={bullCase} tone="bull" dark={dark} />
        </SectionCard>
      </Col>
      <Col xs={24} md={12}>
        <SectionCard
          title="Bear case"
          eyebrow="Reasons for caution"
          dark={dark}
          extra={<FallOutlined style={{ color: "#DC2626", fontSize: 18 }} />}
        >
          <CaseList items={bearCase} tone="bear" dark={dark} />
        </SectionCard>
      </Col>
    </Row>
  );
}

export function ThesisPanel({ thesis, analysis, dark }: { thesis: string; analysis: string; dark: boolean }) {
  const body = dark ? "#C4D0E2" : "#384256";
  return (
    <SectionCard title="Investment thesis" eyebrow="Committee narrative" dark={dark}>
      {!isUnavailable(thesis) && (
        <p
          style={{
            margin: "0 0 14px",
            fontFamily: FONTS.displayFont,
            fontSize: 16,
            lineHeight: 1.5,
            fontWeight: 500,
            color: dark ? "#EAF0F8" : "#16203A",
          }}
        >
          {thesis}
        </p>
      )}
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: body, whiteSpace: "pre-line" }}>
        {isUnavailable(analysis) ? "Data unavailable" : analysis}
      </p>
    </SectionCard>
  );
}
