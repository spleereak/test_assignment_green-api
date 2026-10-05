import { isRecord } from "@/api/client";
import type { Notice, StatusNotice, TextNotice } from "@/api/types";

export function parseNotification(body: unknown): Notice {
    if (!isRecord(body) || typeof body.typeWebhook !== "string") return { kind: "ignored" };
    if (body.typeWebhook === "outgoingMessageStatus") return parseStatus(body);
    if (body.typeWebhook === "incomingMessageReceived") return parseText(body, "in");
    if (body.typeWebhook === "outgoingMessageReceived" || body.typeWebhook === "outgoingAPIMessageReceived") {
        return parseText(body, "out");
    }
    return { kind: "ignored" };
}

function parseStatus(body: Record<string, unknown>): Notice {
    if (typeof body.idMessage !== "string" || body.idMessage === "") return { kind: "ignored" };
    if (!isDeliveryStatus(body.status)) return { kind: "ignored" };
    const notice: StatusNotice = { kind: "status", idMessage: body.idMessage, status: body.status };
    return notice;
}

function parseText(body: Record<string, unknown>, direction: "in" | "out"): Notice {
    if (typeof body.idMessage !== "string" || body.idMessage === "") return { kind: "ignored" };
    if (!isRecord(body.senderData) || typeof body.senderData.chatId !== "string") return { kind: "ignored" };
    const chatId = body.senderData.chatId;
    if (chatId.startsWith("-") || body.senderData.chatType === "group") return { kind: "ignored" };
    const text = readText(body.messageData);
    if (text === null || text === "") return { kind: "ignored" };
    const notice: TextNotice = {
        kind: "text",
        direction,
        idMessage: body.idMessage,
        chatId,
        title: readTitle(body.senderData),
        phone: readPhone(body.senderData.senderPhoneNumber) || phoneFromChatId(chatId),
        text,
        timestamp: toMillis(body.timestamp),
    };
    return notice;
}

function readText(messageData: unknown): string | null {
    if (!isRecord(messageData) || typeof messageData.typeMessage !== "string") return null;
    if (messageData.typeMessage === "textMessage" && isRecord(messageData.textMessageData)) {
        return typeof messageData.textMessageData.textMessage === "string" ? messageData.textMessageData.textMessage : null;
    }
    if (
        (messageData.typeMessage === "extendedTextMessage" || messageData.typeMessage === "quotedMessage") &&
        isRecord(messageData.extendedTextMessageData)
    ) {
        return typeof messageData.extendedTextMessageData.text === "string" ? messageData.extendedTextMessageData.text : null;
    }
    return null;
}

function readTitle(senderData: Record<string, unknown>): string {
    for (const key of ["chatName", "senderContactName", "senderName"] as const) {
        const value = senderData[key];
        if (typeof value === "string" && value.trim() !== "") return value.trim();
    }
    return "";
}

function phoneFromChatId(chatId: string): string {
    return /^(\d+)@c\.us$/.exec(chatId)?.[1] ?? "";
}

function readPhone(value: unknown): string {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return String(Math.trunc(value));
    if (typeof value === "string" && /^\d{10,15}$/.test(value)) return value;
    return "";
}

function toMillis(value: unknown): number {
    if (typeof value !== "number" || !Number.isFinite(value)) return Date.now();
    return value < 1e12 ? value * 1000 : value;
}

function isDeliveryStatus(value: unknown): value is StatusNotice["status"] {
    return value === "sent" || value === "delivered" || value === "read" || value === "failed";
}
