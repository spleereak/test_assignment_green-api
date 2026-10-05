import type { ReactNode } from "react";

function Icon({ className = "size-18", children }: { className?: string; children: ReactNode }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            {children}
        </svg>
    );
}

export function SunIcon() {
    return (
        <Icon>
            <path fill="currentColor" d="M11 2h2v3h-2V2Zm0 17h2v3h-2v-3ZM2 11h3v2H2v-2Zm17 0h3v2h-3v-2ZM5.1 6.5l1.4-1.4 2.1 2.1-1.4 1.4-2.1-2.1Zm10.3 10.3 1.4-1.4 2.1 2.1-1.4 1.4-2.1-2.1ZM6.5 18.9l-1.4-1.4 2.1-2.1 1.4 1.4-2.1 2.1ZM18.9 6.5l-2.1 2.1-1.4-1.4 2.1-2.1 1.4 1.4ZM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
        </Icon>
    );
}

export function MoonIcon() {
    return (
        <Icon>
            <path fill="currentColor" d="M14.2 2.4a9 9 0 1 0 7.4 12.6 7 7 0 0 1-7.4-12.6Z" />
        </Icon>
    );
}

export function LogoutIcon() {
    return (
        <Icon>
            <path fill="currentColor" d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10v-2H6.5a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H10V4Zm5.3 3.3 4.2 4.2a.7.7 0 0 1 0 1l-4.2 4.2-1.4-1.4 2.3-2.3H9v-2h7.2l-2.3-2.3 1.4-1.4Z" />
        </Icon>
    );
}

export function PlusIcon() {
    return (
        <Icon>
            <path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" />
        </Icon>
    );
}

export function SendIcon({ className }: { className?: string }) {
    return (
        <Icon className={className}>
            <path fill="currentColor" d="M3.4 11.2 20 4.2c.7-.3 1.4.4 1.1 1.1l-7 16.6c-.3.8-1.5.7-1.7-.1l-1.8-6.4-6.4-1.8c-.8-.2-.9-1.4-.1-1.7l.3-.1Zm8.2 2.5 1.2 4.3 4.6-10.9-10.9 4.6 4.3 1.2.8.8Z" />
        </Icon>
    );
}

export function MenuIcon() {
    return (
        <Icon>
            <path fill="currentColor" d="M4 7h16v2H4V7Zm0 4h16v2H4v-2Zm0 4h16v2H4v-2Z" />
        </Icon>
    );
}

export function BackIcon({ className }: { className?: string }) {
    return (
        <Icon className={className}>
            <path fill="currentColor" d="M14.8 5.2 8.1 12l6.7 6.8-1.4 1.4L5.2 12l8.2-8.2 1.4 1.4Z" />
        </Icon>
    );
}

export function EyeIcon() {
    return (
        <Icon>
            <path fill="currentColor" d="M12 6c4.6 0 8.2 3.2 9.5 6-1.3 2.8-4.9 6-9.5 6S3.8 14.8 2.5 12C3.8 9.2 7.4 6 12 6Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
        </Icon>
    );
}

export function EyeOffIcon() {
    return (
        <Icon>
            <path fill="currentColor" d="M3.3 2.3 21.7 20.7l-1.4 1.4-3.1-3.1A12 12 0 0 1 12 20C7.4 20 3.8 16.8 2.5 14a12.6 12.6 0 0 1 3.2-4.4L1.9 3.7l1.4-1.4ZM12 8c.4 0 .8.1 1.2.2L9.2 10.2A4 4 0 0 0 12 16c.7 0 1.3-.2 1.8-.5l-1.5-1.5a2 2 0 0 1-2.3-2.3L8.2 9.8A6 6 0 0 0 12 8Zm7.6 1.2 1.9 1.8c-1.3 2.8-4.9 6-9.5 6-.8 0-1.5-.1-2.2-.3l1.7-1.7c.2 0 .3.1.5.1a4 4 0 0 0 3.7-5.5l2-2c.7.5 1.3 1.1 1.9 1.6Z" />
        </Icon>
    );
}
