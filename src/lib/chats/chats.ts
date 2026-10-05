import { formatPhone } from "@/lib/phone";
import type { Chat, ChatMessage, Notice, TextNotice } from "@/api/types";

export function addChat(chats: Chat[], chat: Chat): Chat[] {
    const exists = chats.some((item) => item.chatId === chat.chatId || (chat.phone !== "" && item.phone === chat.phone));
    if (exists) return chats;
    return [chat, ...chats].sort(byRecent);
}

export function appendOutgoing(chats: Chat[], chatId: string, message: ChatMessage): Chat[] {
    return chats
        .map((chat) =>
            chat.chatId === chatId
                ? { ...chat, messages: [...chat.messages, message], updatedAt: message.timestamp }
                : chat,
        )
        .sort(byRecent);
}

export function patchMessage(
    chats: Chat[],
    messageId: string,
    patch: Partial<Pick<ChatMessage, "id" | "status" | "timestamp">>,
): Chat[] {
    return chats.map((chat) => ({
        ...chat,
        messages: chat.messages.map((message) => (message.id === messageId ? { ...message, ...patch } : message)),
    }));
}

export function applyNotice(chats: Chat[], notice: Notice): Chat[] {
    if (notice.kind === "ignored") return chats;
    if (notice.kind === "status") return patchMessage(chats, notice.idMessage, { status: notice.status });
    return applyText(chats, notice);
}

function applyText(chats: Chat[], notice: TextNotice): Chat[] {
    const index = chats.findIndex(
        (chat) => chat.chatId === notice.chatId || (notice.phone !== "" && chat.phone === notice.phone),
    );
    if (index === -1) {
        const created: Chat = {
            chatId: notice.chatId,
            phone: notice.phone,
            title: notice.title || formatPhone(notice.phone) || "Чат",
            updatedAt: notice.timestamp,
            messages: [toMessage(notice)],
        };
        return [created, ...chats].sort(byRecent);
    }
    return chats.map((chat, chatIndex) => (chatIndex === index ? mergeIntoChat(chat, notice) : chat)).sort(byRecent);
}

function mergeIntoChat(chat: Chat, notice: TextNotice): Chat {
    const title = pickTitle(chat, notice);
    const phone = chat.phone || notice.phone;
    const chatId = notice.chatId || chat.chatId;
    if (chat.messages.some((message) => message.id === notice.idMessage)) {
        return { ...chat, chatId, phone, title };
    }
    const pendingIndex =
        notice.direction === "out"
            ? chat.messages.findIndex(
                  (message) =>
                      message.id.startsWith("local-") &&
                      message.status === "pending" &&
                      message.direction === "out" &&
                      message.text === notice.text,
              )
            : -1;
    if (pendingIndex === -1) {
        return { ...chat, chatId, phone, title, updatedAt: notice.timestamp, messages: [...chat.messages, toMessage(notice)] };
    }
    return {
        ...chat,
        chatId,
        phone,
        title,
        updatedAt: notice.timestamp,
        messages: chat.messages.map((message, messageIndex) =>
            messageIndex === pendingIndex
                ? { ...message, id: notice.idMessage, status: "sent", timestamp: notice.timestamp }
                : message,
        ),
    };
}

function pickTitle(chat: Chat, notice: TextNotice): string {
    if (notice.title === "") return chat.title;
    const phoneTitle = formatPhone(chat.phone);
    if (chat.title === "" || chat.title === chat.phone || chat.title === phoneTitle || chat.title === "Чат") return notice.title;
    return chat.title;
}

function toMessage(notice: TextNotice): ChatMessage {
    return {
        id: notice.idMessage,
        text: notice.text,
        direction: notice.direction,
        timestamp: notice.timestamp,
        status: "sent",
    };
}

function byRecent(left: Chat, right: Chat): number {
    return right.updatedAt - left.updatedAt;
}
