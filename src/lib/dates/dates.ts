export function formatStamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(date);
    }
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(date);
}
