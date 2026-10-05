import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "max-chat-theme";

export type Theme = "light" | "dark";

type ThemeContextValue = {
    theme: Theme;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function readTheme(): Theme {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark") return stored;
    } catch {
        return "dark";
    }
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme: Theme): void {
    document.documentElement.dataset.theme = theme;
}

applyTheme(readTheme());

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(readTheme);

    useEffect(() => {
        applyTheme(theme);
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // Тема останется на текущий заход.
        }
    }, [theme]);

    function toggleTheme(): void {
        setTheme((current) => (current === "dark" ? "light" : "dark"));
    }

    return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const value = useContext(ThemeContext);
    if (!value) throw new Error("useTheme вызывается вне ThemeProvider");
    return value;
}
