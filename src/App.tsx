import { LoginPage } from "@/features/auth/LoginPage";
import { ChatPage } from "@/features/chat/ChatPage";
import { useSession } from "@/app/session";

export function App() {
    const { credentials } = useSession();
    if (!credentials) return <LoginPage />;
    return <ChatPage />;
}
