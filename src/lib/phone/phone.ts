export function normalizePhone(input: string): string | null {
    let digits = input.replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
    if (digits.length === 10) digits = `7${digits}`;
    if (digits.length >= 11 && digits.length <= 16) return digits;
    return null;
}

export function formatPhone(phone: string): string {
    if (/^7\d{10}$/.test(phone)) {
        return `+7 ${phone.slice(1, 4)} ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9)}`;
    }
    if (/^375\d{9}$/.test(phone)) {
        return `+375 ${phone.slice(3, 5)} ${phone.slice(5, 8)}-${phone.slice(8, 10)}-${phone.slice(10)}`;
    }
    return phone ? `+${phone}` : phone;
}

export function initials(title: string): string {
    const words = title.trim().split(/\s+/).filter(Boolean);
    const letters = words
        .map((part) => Array.from(part).find((char) => /\p{L}/u.test(char)) ?? "")
        .filter(Boolean)
        .slice(0, 2)
        .join("");
    if (letters) return letters.toUpperCase();
    const digits = title.replace(/\D/g, "");
    if (digits.length >= 2) return digits.slice(-2);
    return "?";
}

const AVATAR_COLORS = ["#3d7eff", "#7c5cff", "#1aa6a6", "#e07a3d", "#d4527a", "#3fa36a"];

export function avatarColor(seed: string): string {
    let hash = 0;
    for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? "#3d7eff";
}
