import { theme, type ThemeConfig } from "antd";

// Brand identity: a calm "research terminal". Primary is a confident teal/cyan
// that reads as data/instrumentation, deliberately distinct from the semantic
// BUY-green so a teal accent is never mistaken for a buy signal.
const BRAND = {
  primary: "#0FB5B0",
  primaryHover: "#13C9C3",
  displayFont: "'Space Grotesk', system-ui, sans-serif",
  bodyFont: "'Inter', system-ui, -apple-system, sans-serif",
  monoFont: "'IBM Plex Mono', ui-monospace, monospace",
};

export const FONTS = BRAND;

const sharedToken: ThemeConfig["token"] = {
  colorPrimary: BRAND.primary,
  colorInfo: BRAND.primary,
  colorSuccess: "#16A34A",
  colorWarning: "#D97706",
  colorError: "#DC2626",
  borderRadius: 12,
  fontFamily: BRAND.bodyFont,
  fontSize: 14,
  wireframe: false,
};

export const lightTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    ...sharedToken,
    colorBgLayout: "#EEF1F6",
    colorBgContainer: "#FFFFFF",
    colorBorderSecondary: "#E6EAF1",
  },
  components: {
    Layout: { headerBg: "#FFFFFF", bodyBg: "#EEF1F6" },
    Card: { paddingLG: 20 },
  },
};

export const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    ...sharedToken,
    colorBgLayout: "#080D17",
    colorBgContainer: "#101828",
    colorBgElevated: "#162033",
    colorBorderSecondary: "#1F2A3D",
    colorText: "#E5EAF2",
  },
  components: {
    Layout: { headerBg: "#0B1220", bodyBg: "#080D17" },
    Card: { colorBgContainer: "#101828", paddingLG: 20 },
  },
};
