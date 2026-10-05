import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { Button, IconButton, Textarea, Typography } from "@maxhub/max-ui";
import type { ChatMessage, MessageStatus } from "@/api/types";
import { texts } from "@/app/texts";
import { SendIcon } from "@/components/Icons";
import { formatStamp } from "@/lib/dates";

export function Composer({
    value,
    disabled,
    maxLength,
    onChange,
    onSubmit,
}: {
    value: string;
    disabled: boolean;
    maxLength: number;
    onChange: (value: string) => void;
    onSubmit: () => void;
}) {
    function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
        }
    }

    function onFormSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        onSubmit();
    }

    return (
        <form className="flex items-end gap-10 px-16 pt-12 pb-16" onSubmit={onFormSubmit}>
            <Textarea
                mode="secondary"
                rows={1}
                value={value}
                placeholder={texts.chat.message}
                maxLength={maxLength}
                className="max-h-140 min-w-0 flex-1"
                innerClassNames={{ textarea: "composer-input" }}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={onKeyDown}
            />
            <IconButton type="submit" variant="primary" size="medium" aria-label={texts.chat.send} disabled={disabled || value.trim() === ""}>
                <SendIcon className="size-22" />
            </IconButton>
        </form>
    );
}

export function MessageList({ messages, onRetry }: { messages: ChatMessage[]; onRetry: (message: ChatMessage) => void }) {
    const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: "end" });
    }, [messages]);

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-auto px-16 py-18">
            {messages.length === 0 ? (
                <Typography.Body variant="medium" className="block text-muted">
                    {texts.chat.emptyThread}
                </Typography.Body>
            ) : null}
            {messages.map((message) => (
                <article
                    key={message.id}
                    className={`max-w-[min(68%,560px)] rounded-16 px-12 pt-10 pb-8 max-[860px]:max-w-[86%] ${
                        message.direction === "out"
                            ? "self-end rounded-br-6 bg-bubble-out text-white"
                            : "self-start rounded-bl-6 bg-bubble-in"
                    }`}
                >
                    <Typography.Body
                        variant="medium"
                        className={`block whitespace-pre-wrap leading-snug [overflow-wrap:anywhere] ${message.direction === "out" ? "text-white" : ""}`}
                    >
                        {message.text}
                    </Typography.Body>
                    <footer className={`mt-4 flex items-center justify-end gap-6 text-[12px] ${message.direction === "out" ? "text-white/78" : "text-muted"}`}>
                        <time>{formatStamp(message.timestamp)}</time>
                        {message.direction === "out" ? <StatusMark status={message.status} /> : null}
                    </footer>
                    {message.status === "failed" ? (
                        <Button type="button" variant="ghost" size="xsmall" className="mt-4" onClick={() => onRetry(message)}>
                            {texts.chat.retry}
                        </Button>
                    ) : null}
                </article>
            ))}
            <div ref={bottomRef} />
        </div>
    );
}

function StatusMark({ status }: { status: MessageStatus }) {
    if (status === "pending") return <span>…</span>;
    if (status === "failed") return <span>!</span>;
    if (status === "read") return <span className="text-[#d7e6ff]">✓✓</span>;
    if (status === "delivered") return <span>✓✓</span>;
    return <span>✓</span>;
}

