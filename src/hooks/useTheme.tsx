import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = "diario.theme";
const THEME_COLOR_LIGHT = "#f2f2f7";
const THEME_COLOR_DARK = "#000000";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark") return raw;
  } catch {
    // localStorage unavailable — silent fallback.
  }
  return null;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = resolved;

  // Keep the mobile browser chrome in sync with the active theme.
  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"][data-dynamic="true"]',
  );
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.setAttribute("data-dynamic", "true");
    document.head.appendChild(meta);
  }
  meta.content = resolved === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Track whether the user has made an explicit choice.
  // While unset, we mirror the OS preference live; after the first click we lock in.
  const [hasExplicitChoice, setHasExplicitChoice] = useState<boolean>(
    () => readStoredMode() !== null,
  );
  const [mode, setModeState] = useState<ThemeMode>(
    () => readStoredMode() ?? getSystemTheme(),
  );

  useEffect(() => {
    if (hasExplicitChoice) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => {
      setModeState(e.matches ? "dark" : "light");
    };
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, [hasExplicitChoice]);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    setHasExplicitChoice(true);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore write failures
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved: mode, setMode }),
    [mode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme deve essere usato dentro <ThemeProvider>.");
  }
  return ctx;
}
