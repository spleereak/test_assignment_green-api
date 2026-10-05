import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Credentials } from "@/api/types";
import { clearCredentials, loadCredentials, saveCredentials } from "@/lib/storage";

type Session = {
    credentials: Credentials | null;
    login: (credentials: Credentials) => void;
    logout: () => void;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [credentials, setCredentials] = useState<Credentials | null>(() => loadCredentials());
    const session = useMemo<Session>(
        () => ({
            credentials,
            login(next) {
                saveCredentials(next);
                setCredentials(next);
            },
            logout() {
                clearCredentials();
                setCredentials(null);
            },
        }),
        [credentials],
    );
    return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
    const session = useContext(SessionContext);
    if (!session) throw new Error("useSession используется вне SessionProvider");
    return session;
}
