import { useEffect, useMemo, useState } from "react";
import { App as AntApp, ConfigProvider, Layout } from "antd";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import { useAnalysis } from "./hooks/useAnalysis";
import { darkTheme, lightTheme } from "./theme/theme";

const THEME_KEY = "helix-theme";

export default function App() {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  });
  const [lastSymbol, setLastSymbol] = useState("");

  const {
    result,
    loading,
    error,
    recommended,
    recommendedLoading,
    picks,
    picksAsOf,
    picksLoading,
    picksError,
    picksRan,
    picksScreened,
    analyze,
    loadTopPicks,
    reset,
  } = useAnalysis();

  useEffect(() => {
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  const onAnalyze = (symbol: string) => {
    setLastSymbol(symbol.trim().toUpperCase());
    void analyze(symbol);
  };

  const themeConfig = useMemo(() => (dark ? darkTheme : lightTheme), [dark]);

  return (
    <ConfigProvider theme={themeConfig}>
      <AntApp>
        <Layout className="app-shell" data-mode={dark ? "dark" : "light"} style={{ background: "transparent" }}>
          <Header dark={dark} onToggleTheme={setDark} />
          <Layout.Content style={{ background: "transparent" }}>
            <Dashboard
              result={result}
              loading={loading}
              error={error}
              lastSymbol={lastSymbol}
              recommended={recommended}
              recommendedLoading={recommendedLoading}
              picks={picks}
              picksAsOf={picksAsOf}
              picksLoading={picksLoading}
              picksError={picksError}
              picksRan={picksRan}
              picksScreened={picksScreened}
              onAnalyze={onAnalyze}
              onLoadTopPicks={loadTopPicks}
              onClearResult={reset}
              dark={dark}
            />
          </Layout.Content>
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}
