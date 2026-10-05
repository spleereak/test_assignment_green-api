import { call, delay, errorFromResponse, isAbortError, isRecord, readJson, translateReason } from "@/api/client";
import type { AccountCheck, Credentials, Notice } from "@/api/types";
import { parseNotification } from "@/lib/notifications";

const settingsInflight = new Map<string, Promise<"ready" | "restarting">>();
const settingsConfigured = new Set<string>();

export async function getStateInstance(credentials: Credentials): Promise<string> {
    const data = await readJson(await call(credentials, "getStateInstance", { method: "GET" }));
    if (isRecord(data) && typeof data.stateInstance === "string") return data.stateInstance;
    throw new Error("Не удалось прочитать состояние инстанса");
}

export function stateHint(state: string): string {
    switch (state) {
        case "authorized":
            return "";
        case "notAuthorized":
            return "Инстанс не авторизован. Получите QR-код в личном кабинете GREEN-API и отсканируйте его в WhatsApp или Telegram.";
        case "blocked":
            return "Аккаунт заблокирован.";
        case "starting":
            return "Инстанс запускается. Подождите до 5 минут и войдите снова.";
        case "suspended":
            return "На аккаунте временные ограничения: сообщения уходят только тем, кто сохранил ваш номер в контактах.";
        case "pendingPassword":
            return "Для завершения авторизации нужен пароль двухфакторной аутентификации. Отправьте его в личном кабинете методом SendAuthorizationPassword.";
        default:
            return `Инстанс в состоянии «${state}». Для чата нужен статус authorized.`;
    }
}

export function ensureIncomingHttpApi(credentials: Credentials): Promise<"ready" | "restarting"> {
    if (settingsConfigured.has(credentials.idInstance)) return Promise.resolve("ready");
    const existing = settingsInflight.get(credentials.idInstance);
    if (existing) return existing;
    const promise = configureIncoming(credentials)
        .then((mode) => {
            settingsConfigured.add(credentials.idInstance);
            return mode;
        })
        .catch((error: unknown) => {
            settingsInflight.delete(credentials.idInstance);
            throw error;
        });
    settingsInflight.set(credentials.idInstance, promise);
    return promise;
}

async function configureIncoming(credentials: Credentials): Promise<"ready" | "restarting"> {
    const settings = await readJson(await call(credentials, "getSettings", { method: "GET" }));
    if (!isRecord(settings)) throw new Error("Не удалось прочитать настройки инстанса");
    const webhookUrl = typeof settings.webhookUrl === "string" ? settings.webhookUrl : "";
    if (webhookUrl === "" && settings.incomingWebhook === "yes") return "ready";
    const saved = await readJson(
        await call(credentials, "setSettings", {
            method: "POST",
            body: {
                webhookUrl: "",
                incomingWebhook: "yes",
                outgoingWebhook: "yes",
                outgoingAPIMessageWebhook: "yes",
            },
        }),
    );
    if (!isRecord(saved) || saved.saveSettings !== true) {
        throw new Error("Не удалось включить получение сообщений по HTTP API");
    }
    return "restarting";
}

export async function resolveRecipient(credentials: Credentials, phone: string): Promise<AccountCheck> {
    if (credentials.messenger === "whatsapp") return checkWhatsapp(credentials, phone);
    return checkTelegram(credentials, phone);
}

async function checkTelegram(credentials: Credentials, phone: string): Promise<AccountCheck> {
    const data = await readJson(
        await call(credentials, "checkAccount", {
            method: "POST",
            body: { phoneNumber: Number(phone) },
        }),
    );
    return readAccountCheck(data, "Telegram", `${phone}@c.us`);
}

async function checkWhatsapp(credentials: Credentials, phone: string): Promise<AccountCheck> {
    const data = await readJson(
        await call(credentials, "checkWhatsapp", {
            method: "POST",
            body: { phoneNumber: Number(phone) },
        }),
    );
    if (!isRecord(data)) return { exist: false, reason: "Не удалось проверить номер" };
    if (data.existsWhatsapp === true) {
        const chatId = typeof data.chatId === "string" && data.chatId !== "" ? data.chatId : `${phone}@c.us`;
        return { exist: true, chatId };
    }
    if (data.existsWhatsapp === false) return { exist: false, reason: "На этом номере нет аккаунта WhatsApp" };
    return readAccountCheck(data, "WhatsApp", `${phone}@c.us`);
}

function readAccountCheck(data: unknown, messenger: string, fallbackChatId: string): AccountCheck {
    if (!isRecord(data)) return { exist: false, reason: "Не удалось проверить номер" };
    if (data.exist === true) {
        const chatId = typeof data.chatId === "string" && data.chatId !== "" ? data.chatId : fallbackChatId;
        return { exist: true, chatId };
    }
    if (data.exist === false) return { exist: false, reason: `На этом номере нет аккаунта ${messenger}` };
    if (typeof data.reason === "string" && data.reason !== "") return { exist: false, reason: translateReason(data.reason) };
    return { exist: false, reason: "Не удалось проверить номер" };
}

export async function sendMessage(credentials: Credentials, chatId: string, message: string): Promise<string> {
    const data = await readJson(
        await call(credentials, "sendMessage", {
            method: "POST",
            body: { chatId, message },
        }),
    );
    if (isRecord(data) && typeof data.idMessage === "string") return data.idMessage;
    throw new Error("GREEN-API не вернул идентификатор сообщения");
}

export async function pollNotifications(
    credentials: Credentials,
    signal: AbortSignal,
    handlers: {
        onNotice: (notice: Notice) => void;
        onError: (error: Error) => void;
        onAlive: () => void;
    },
): Promise<void> {
    while (!signal.aborted) {
        try {
            const notification = await receiveNotification(credentials, signal);
            if (signal.aborted) return;
            handlers.onAlive();
            if (notification) {
                handlers.onNotice(notification.notice);
                await deleteNotification(credentials, notification.receiptId, signal);
            }
        } catch (error) {
            if (signal.aborted || isAbortError(error)) return;
            handlers.onError(error instanceof Error ? error : new Error("Ошибка получения сообщений"));
            await delay(3000, signal);
        }
    }
}

async function receiveNotification(
    credentials: Credentials,
    signal: AbortSignal,
): Promise<{ receiptId: string; notice: Notice } | null> {
    const response = await call(credentials, "receiveNotification", {
        method: "GET",
        query: "receiveTimeout=20",
        signal,
    });
    // Пустая очередь: сервер обрывает ожидание кодом 408 без тела. Это не обрыв связи.
    if (response.status === 408) return null;
    if (!response.ok) throw await errorFromResponse(response);
    const text = await response.text();
    if (text.trim() === "" || text.trim() === "null") return null;
    let data: unknown;
    try {
        data = JSON.parse(text) as unknown;
    } catch {
        throw new Error("Не удалось разобрать уведомление");
    }
    if (data === null) return null;
    if (!isRecord(data)) throw new Error("Неожиданный ответ ReceiveNotification");
    const receiptId = readReceiptId(data.receiptId);
    if (!receiptId) throw new Error("В уведомлении нет receiptId");
    return { receiptId, notice: parseNotification(data.body) };
}

async function deleteNotification(credentials: Credentials, receiptId: string, signal: AbortSignal): Promise<void> {
    const response = await call(credentials, "deleteNotification", {
        method: "DELETE",
        suffix: receiptId,
        signal,
    });
    if (!response.ok) throw await errorFromResponse(response);
}

function readReceiptId(value: unknown): string | null {
    if (typeof value === "number" && Number.isFinite(value)) return String(Math.trunc(value));
    if (typeof value === "string" && /^\d+$/.test(value)) return value;
    return null;
}
