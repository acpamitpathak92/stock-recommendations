import { Layout, Switch, Tooltip, Grid } from "antd";
import { MoonStarIcon, SunIcon, HelixMark } from "./icons";
import { FONTS } from "../theme/theme";

const { Header: AntHeader } = Layout;
const { useBreakpoint } = Grid;

interface HeaderProps {
  dark: boolean;
  onToggleTheme: (dark: boolean) => void;
}

export default function Header({ dark, onToggleTheme }: HeaderProps) {
  const screens = useBreakpoint();
  const compact = !screens.md;

  return (
    <AntHeader
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: compact ? "0 16px" : "0 28px",
        height: 64,
        borderBottom: `1px solid ${dark ? "#1F2A3D" : "#E6EAF1"}`,
        backdropFilter: "blur(8px)",
        backgroundColor: dark ? "rgba(11,18,32,0.82)" : "rgba(255,255,255,0.82)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <HelixMark size={34} />
        <div style={{ lineHeight: 1.05 }}>
          <div
            className="display"
            style={{
              fontFamily: FONTS.displayFont,
              fontWeight: 700,
              fontSize: compact ? 17 : 19,
              letterSpacing: "-0.01em",
              color: dark ? "#F2F5FA" : "#0B1220",
            }}
          >
            Helix
          </div>
          {!compact && (
            <div
              className="eyebrow"
              style={{ marginTop: 1, color: dark ? "#8CA0BD" : "#5B6B85" }}
            >
              Agentic Equity Research
            </div>
          )}
        </div>
      </div>

      <Tooltip title={dark ? "Switch to light" : "Switch to dark"}>
        <Switch
          checked={dark}
          onChange={onToggleTheme}
          checkedChildren={<MoonStarIcon />}
          unCheckedChildren={<SunIcon />}
          aria-label="Toggle color theme"
        />
      </Tooltip>
    </AntHeader>
  );
}
