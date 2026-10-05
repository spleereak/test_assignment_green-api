import type { ReactNode } from "react";
import { MaxUI } from "@maxhub/max-ui";
import { SessionProvider } from "@/app/session";
import { ThemeProvider, useTheme } from "@/app/theme";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            <ThemedShell>{children}</ThemedShell>
        </ThemeProvider>
    );
}

function ThemedShell({ children }: { children: ReactNode }) {
    const { theme } = useTheme();
    return (
        <MaxUI platform="ios" colorScheme={theme} className="h-full min-h-0 min-w-0">
            <SessionProvider>{children}</SessionProvider>
        </MaxUI>
    );
}
