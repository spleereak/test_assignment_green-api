import { useEffect, useState } from "react";
import { ensureIncomingHttpApi, pollNotifications, resolveRecipient, sendMessage } from "@/api/green";
import type { Chat, ChatMessage, Credentials, ReceiveState } from "@/api/types";
import { texts } from "@/app/texts";
import { useSession } from "@/app/session";
import { addChat, appendOutgoing, applyNotice, patchMessage } from "@/lib/chats";
import { formatPhone, normalizePhone } from "@/lib/phone";
import { loadChats, saveChats } from "@/lib/storage";

export const MESSAGE_LIMIT = 4000;

export function useChat(credentials: Credentials) {
    const { logout } = useSession();

    const [chats, setChats] = useState<Chat[]>(() => loadChats(credentials.idInstance));
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [pane, setPane] = useState<"list" | "chat">("list");
    const [draft, setDraft] = useState("");
    const [banner, setBanner] = useState<string | null>(null);
    const [receiveState, setReceiveState] = useState<ReceiveState>("connecting");
    const [creating, setCreating] = useState(false);
    const [sending, setSending] = useState(false);

    const activeChat = chats.find((chat) => chat.chatId === activeChatId) ?? null;

    useEffect(() => {
        saveChats(credentials.idInstance, chats);
    }, [chats, credentials.idInstance]);

    useEffect(() => {
        const controller = new AbortController();
        void ensureIncomingHttpApi(credentials)
            .then((mode) => {
                if (controller.signal.aborted) return;
                if (mode === "restarting") {
                    setReceiveState("restarting");
                    setBanner(texts.chat.restarting);
                    return;
                }
                setReceiveState("ready");
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return;
                setReceiveState("error");
                setBanner(error instanceof Error ? error.message : texts.chat.settingsFailed);
            });
        return () => controller.abort();
    }, [credentials]);

    useEffect(() => {
        const controller = new AbortController();
        void pollNotifications(credentials, controller.signal, {
            onNotice: (notice) => setChats((current) => applyNotice(current, notice)),
            onAlive: () => {
                setReceiveState("ready");
                setBanner((current) => (current === texts.chat.restarting ? null : current));
            },
            onError: (error) => {
                setReceiveState((current) => (current === "restarting" ? current : "error"));
                setBanner((current) => (current === texts.chat.restarting ? current : error.message));
            },
        });
        return () => controller.abort();
    }, [credentials]);

    function openChat(chatId: string): void {
        setActiveChatId(chatId);
        setPane("chat");
        setDraft("");
    }

    async function createChat(phoneInput: string): Promise<void> {
        const phone = normalizePhone(phoneInput);
        if (!phone) throw new Error(texts.chat.phoneInvalid);
        const existing = chats.find((chat) => chat.phone === phone);
        if (existing) {
            openChat(existing.chatId);
            setCreating(false);
            return;
        }
        const account = await resolveRecipient(credentials, phone);
        if (!account.exist) throw new Error(account.reason);
        const already = chats.find((chat) => chat.chatId === account.chatId);
        if (already) {
            openChat(already.chatId);
            setCreating(false);
            return;
        }
        const chat: Chat = {
            chatId: account.chatId,
            phone,
            title: formatPhone(phone),
            messages: [],
            updatedAt: Date.now(),
        };
        setChats((current) => addChat(current, chat));
        openChat(chat.chatId);
        setCreating(false);
    }

    async function submitMessage(text: string, retryId?: string): Promise<void> {
        const messageText = text.trim();
        if (!activeChat || messageText === "" || sending) return;
        if (messageText.length > MESSAGE_LIMIT) {
            setBanner(texts.chat.tooLong(MESSAGE_LIMIT));
            return;
        }
        const localId = retryId ?? `local-${crypto.randomUUID()}`;
        if (!retryId) {
            const message: ChatMessage = {
                id: localId,
                text: messageText,
                direction: "out",
                timestamp: Date.now(),
                status: "pending",
            };
            setChats((current) => appendOutgoing(current, activeChat.chatId, message));
            setDraft("");
        } else {
            setChats((current) => patchMessage(current, localId, { status: "pending" }));
        }
        setSending(true);
        try {
            const idMessage = await sendMessage(credentials, activeChat.chatId, messageText);
            setChats((current) => patchMessage(current, localId, { id: idMessage, status: "sent", timestamp: Date.now() }));
        } catch (error) {
            setChats((current) => patchMessage(current, localId, { status: "failed" }));
            setBanner(error instanceof Error ? error.message : texts.chat.sendFailed);
        } finally {
            setSending(false);
        }
    }

    return {
        credentials,
        logout,
        chats,
        activeChat,
        pane,
        setPane,
        draft,
        setDraft,
        banner,
        receiveState,
        creating,
        setCreating,
        sending,
        openChat,
        createChat,
        submitMessage,
    };
}
