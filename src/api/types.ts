export type Messenger = "whatsapp" | "telegram";

export type Credentials = {
    apiUrl: string;
    idInstance: string;
    apiTokenInstance: string;
    messenger: Messenger;
};

export function messengerName(messenger: Messenger): string {
    return messenger === "whatsapp" ? "WhatsApp" : "Telegram";
}

export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";

export type ChatMessage = {
    id: string;
    text: string;
    direction: "in" | "out";
    timestamp: number;
    status: MessageStatus;
};

export type Chat = {
    chatId: string;
    phone: string;
    title: string;
    messages: ChatMessage[];
    updatedAt: number;
};

export type TextNotice = {
    kind: "text";
    direction: "in" | "out";
    idMessage: string;
    chatId: string;
    title: string;
    phone: string;
    text: string;
    timestamp: number;
};

export type StatusNotice = {
    kind: "status";
    idMessage: string;
    status: Exclude<MessageStatus, "pending">;
};

export type Notice = TextNotice | StatusNotice | { kind: "ignored" };

export type ReceiveState = "connecting" | "ready" | "restarting" | "error";

export type AccountCheck = { exist: true; chatId: string } | { exist: false; reason: string };
