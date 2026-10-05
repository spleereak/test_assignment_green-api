import { normalizeCredentials } from "@/api/client";
import type { Chat, ChatMessage, Credentials, MessageStatus, Messenger } from "@/api/types";

const CREDENTIALS_KEY = "max-chat-credentials";
const CHUNK_LIMIT = 3200;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

export function loadCredentials(): Credentials | null {
    const raw = readJson(CREDENTIALS_KEY, CREDENTIALS_KEY);
    if (!isRecord(raw)) return null;
    const { apiUrl, idInstance, apiTokenInstance, messenger } = raw;
    if (
        typeof apiUrl !== "string" ||
        typeof idInstance !== "string" ||
        typeof apiTokenInstance !== "string" ||
        !isMessenger(messenger)
    ) {
        return null;
    }
    try {
        return normalizeCredentials({ apiUrl, idInstance, apiTokenInstance, messenger });
    } catch {
        return null;
    }
}

export function saveCredentials(credentials: Credentials): void {
    writeJson(CREDENTIALS_KEY, CREDENTIALS_KEY, credentials);
}

export function clearCredentials(): void {
    deleteStored(CREDENTIALS_KEY, CREDENTIALS_KEY);
}

export function loadChats(idInstance: string): Chat[] {
    const raw = readJson(chatCookieKey(idInstance), chatLegacyKey(idInstance));
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((item) => {
        const chat = readChat(item);
        return chat ? [chat] : [];
    });
}

export function saveChats(idInstance: string, chats: Chat[]): void {
    writeJson(chatCookieKey(idInstance), chatLegacyKey(idInstance), chats);
}

function chatCookieKey(idInstance: string): string {
    return `max-chat-dialogs-${idInstance}`;
}

function chatLegacyKey(idInstance: string): string {
    return `max-chat-dialogs:${idInstance}`;
}

function readJson(cookieKey: string, legacyKey: string): unknown {
    const stored = readCookieValue(cookieKey);
    if (stored !== null) {
        removeLegacy(legacyKey);
        return parseJson(stored);
    }
    const legacy = readLegacy(legacyKey);
    if (legacy === null) return null;
    removeLegacy(legacyKey);
    writeCookieValue(cookieKey, legacy);
    return parseJson(legacy);
}

function writeJson(cookieKey: string, legacyKey: string, value: unknown): void {
    writeCookieValue(cookieKey, JSON.stringify(value));
    removeLegacy(legacyKey);
}

function deleteStored(cookieKey: string, legacyKey: string): void {
    deleteCookieValue(cookieKey);
    removeLegacy(legacyKey);
}

function parseJson(raw: string): unknown {
    try {
        return JSON.parse(raw) as unknown;
    } catch {
        return null;
    }
}

function readCookieValue(key: string): string | null {
    const jar = readCookies();
    const countRaw = jar[chunkCountName(key)];
    if (countRaw === undefined) return null;
    const count = Number(countRaw);
    if (!Number.isInteger(count) || count < 1) return null;
    let encoded = "";
    for (let index = 0; index < count; index += 1) {
        const chunk = jar[chunkName(key, index)];
        if (chunk === undefined) return null;
        encoded += chunk;
    }
    try {
        return decodeURIComponent(encoded);
    } catch {
        return null;
    }
}

function writeCookieValue(key: string, value: string): void {
    const chunks = encodeChunks(value);
    const previous = readChunkCount(key);
    for (let index = 0; index < chunks.length; index += 1) {
        const chunk = chunks[index];
        if (chunk !== undefined) writeCookie(chunkName(key, index), chunk);
    }
    for (let index = chunks.length; index < previous; index += 1) {
        deleteCookie(chunkName(key, index));
    }
    writeCookie(chunkCountName(key), String(chunks.length));
}

function deleteCookieValue(key: string): void {
    const count = readChunkCount(key);
    for (let index = 0; index < count; index += 1) deleteCookie(chunkName(key, index));
    deleteCookie(chunkCountName(key));
}

function readChunkCount(key: string): number {
    const raw = readCookies()[chunkCountName(key)];
    if (raw === undefined) return 0;
    const count = Number(raw);
    if (!Number.isInteger(count) || count < 0) return 0;
    return count;
}

function encodeChunks(value: string): string[] {
    const chunks: string[] = [];
    let current = "";
    for (const char of value) {
        const encoded = encodeURIComponent(char);
        if (current.length + encoded.length > CHUNK_LIMIT && current !== "") {
            chunks.push(current);
            current = "";
        }
        current += encoded;
    }
    chunks.push(current);
    return chunks;
}

function chunkCountName(key: string): string {
    return `${key}.n`;
}

function chunkName(key: string, index: number): string {
    return `${key}.${index}`;
}

function readCookies(): Record<string, string> {
    const jar: Record<string, string> = {};
    if (document.cookie === "") return jar;
    for (const part of document.cookie.split("; ")) {
        const separator = part.indexOf("=");
        if (separator === -1) continue;
        jar[part.slice(0, separator)] = part.slice(separator + 1);
    }
    return jar;
}

function writeCookie(name: string, value: string): void {
    document.cookie = `${name}=${value}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

function deleteCookie(name: string): void {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function readLegacy(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function removeLegacy(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch {
        return;
    }
}

function readChat(value: unknown): Chat | null {
    if (!isRecord(value)) return null;
    if (typeof value.chatId !== "string" || typeof value.phone !== "string" || typeof value.title !== "string") return null;
    if (typeof value.updatedAt !== "number" || !Array.isArray(value.messages)) return null;
    return {
        chatId: value.chatId,
        phone: value.phone,
        title: value.title,
        updatedAt: value.updatedAt,
        messages: value.messages.flatMap((item) => {
            const message = readMessage(item);
            return message ? [message] : [];
        }),
    };
}

function readMessage(value: unknown): ChatMessage | null {
    if (!isRecord(value)) return null;
    if (typeof value.id !== "string" || typeof value.text !== "string" || typeof value.timestamp !== "number") return null;
    if (value.direction !== "in" && value.direction !== "out") return null;
    if (!isStatus(value.status)) return null;
    return {
        id: value.id,
        text: value.text,
        direction: value.direction,
        timestamp: value.timestamp,
        status: value.status,
    };
}

function isStatus(value: unknown): value is MessageStatus {
    return value === "pending" || value === "sent" || value === "delivered" || value === "read" || value === "failed";
}

function isMessenger(value: unknown): value is Messenger {
    return value === "whatsapp" || value === "telegram";
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
