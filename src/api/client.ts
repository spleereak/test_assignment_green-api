import type { Credentials } from "@/api/types";

const ALLOWED_HOST = /(^|\.)green-api\.com$|(^|\.)greenapi\.com$/i;

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === "AbortError";
}

export function normalizeCredentials(input: {
    apiUrl: string;
    idInstance: string;
    apiTokenInstance: string;
    messenger: Credentials["messenger"];
}): Credentials {
    const idInstance = input.idInstance.trim();
    const apiTokenInstance = input.apiTokenInstance.trim();
    let origin: string;
    try {
        const url = new URL(input.apiUrl.trim());
        if (url.protocol !== "https:") {
            throw new Error("apiUrl должен начинаться с https://");
        }
        if (!ALLOWED_HOST.test(url.hostname)) {
            throw new Error("apiUrl должен быть хостом из личного кабинета GREEN-API, например https://api.green-api.com");
        }
        origin = url.origin;
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error("Некорректный apiUrl");
        }
        throw error;
    }
    if (!/^\d+$/.test(idInstance)) {
        throw new Error("idInstance должен состоять из цифр");
    }
    if (apiTokenInstance.length < 8) {
        throw new Error("Укажите apiTokenInstance из личного кабинета");
    }
    return { apiUrl: origin, idInstance, apiTokenInstance, messenger: input.messenger };
}

type CallInit = {
    method: "GET" | "POST" | "DELETE";
    body?: unknown;
    signal?: AbortSignal;
    query?: string;
    suffix?: string;
};

export async function call(credentials: Credentials, methodName: string, init: CallInit): Promise<Response> {
    const id = encodeURIComponent(credentials.idInstance);
    const token = encodeURIComponent(credentials.apiTokenInstance);
    const suffix = init.suffix ? `/${encodeURIComponent(init.suffix)}` : "";
    const query = init.query ? `?${init.query}` : "";
    const path = `/waInstance${id}/${methodName}/${token}${suffix}${query}`;
    const url = import.meta.env.DEV ? `/green-api${path}` : `${credentials.apiUrl}${path}`;
    const headers = new Headers();
    if (import.meta.env.DEV) {
        headers.set("x-api-base", credentials.apiUrl);
    }
    if (init.body !== undefined) {
        headers.set("content-type", "application/json");
    }

    try {
        return await fetch(url, {
            method: init.method,
            headers,
            body: init.body === undefined ? undefined : JSON.stringify(init.body),
            signal: init.signal,
        });
    } catch (error) {
        if (isAbortError(error)) throw error;
        throw new Error(
            "Не удалось связаться с GREEN-API. Проверьте apiUrl из личного кабинета и что приложение запущено через npm run dev.",
        );
    }
}

export async function readJson(response: Response): Promise<unknown> {
    if (!response.ok) throw await errorFromResponse(response);
    const text = await response.text();
    if (text.trim() === "") return null;
    try {
        return JSON.parse(text) as unknown;
    } catch {
        throw new Error("GREEN-API вернул не JSON");
    }
}

export async function errorFromResponse(response: Response): Promise<Error> {
    const text = await response.text();
    let raw = text.trim();
    try {
        const data = JSON.parse(text) as unknown;
        if (isRecord(data)) {
            if (typeof data.message === "string") raw = data.message;
            else if (typeof data.error === "string") raw = data.error;
            else if (typeof data.reason === "string") raw = data.reason;
        }
    } catch {
        raw = text.trim();
    }
    return new Error(translateReason(raw || `Ошибка GREEN-API (${response.status})`));
}

export function translateReason(raw: string): string {
    if (raw.includes("custom webhook url")) {
        return "В личном кабинете указан webhook. Очистите его и подождите около минуты: получение по HTTP API работает только с пустым webhook.";
    }
    if (raw.includes("suspended")) {
        return "На аккаунте временные ограничения: отправка возможна только на номера, которые сохранили вас в контактах.";
    }
    if (raw.includes("not an integer") || raw.includes("apiTokenInstance not define")) {
        return "Проверьте idInstance и apiTokenInstance.";
    }
    if (raw.includes("User get contact info limit")) {
        return "Сервис временно ограничил проверки номеров. Подождите и попробуйте снова.";
    }
    if (raw.includes("bad phone number")) {
        return "Номер должен содержать 11 или 12 цифр, для РФ и Беларуси.";
    }
    if (raw === "fetch failed" || raw.includes("Connect Timeout") || raw.includes("ENOTFOUND")) {
        return "Не удалось подключиться к apiUrl. Проверьте хост из личного кабинета GREEN-API.";
    }
    return raw;
}

export function delay(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
        if (signal.aborted) {
            resolve();
            return;
        }
        const timer = setTimeout(finish, ms);
        signal.addEventListener("abort", finish, { once: true });
        function finish(): void {
            clearTimeout(timer);
            resolve();
        }
    });
}
