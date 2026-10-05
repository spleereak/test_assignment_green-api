import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Input, Typography } from "@maxhub/max-ui";
import { texts } from "@/app/texts";
import { usePresence } from "@/lib/presence";

export function NewChatDialog({
    open,
    messenger,
    onClose,
    onCreate,
}: {
    open: boolean;
    messenger: string;
    onClose: () => void;
    onCreate: (phone: string) => Promise<void>;
}) {
    const [phone, setPhone] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { mounted, shown } = usePresence(open);

    useEffect(() => {
        if (!open) return;
        inputRef.current?.focus();
        function onKey(event: KeyboardEvent): void {
            if (event.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!mounted) return null;

    async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setPending(true);
        setError(null);
        try {
            await onCreate(phone);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : texts.chat.createFailed);
            setPending(false);
        }
    }

    return (
        <div className="motion-fade fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/75 p-20 max-[480px]:p-12" data-shown={shown} role="presentation" onMouseDown={onClose}>
            <form
                className="motion-dialog relative z-10 grid w-full min-w-0 max-w-440 gap-14 rounded-24 border border-line bg-panel p-28 shadow-[0_18px_50px_rgb(0_0_0/0.35)] max-[480px]:gap-12 max-[480px]:p-16"
                data-shown={shown}
                role="dialog"
                aria-modal="true"
                aria-labelledby="new-chat-title"
                onMouseDown={(event) => event.stopPropagation()}
                onSubmit={(event) => void onSubmit(event)}
            >
                <Typography.Title variant="medium-strong" asChild>
                    <h2 id="new-chat-title" className="m-0">{texts.chat.newChat}</h2>
                </Typography.Title>
                <Typography.Body variant="medium" className="block text-muted">
                    {texts.chat.phoneHint(messenger)}
                </Typography.Body>
                <div className="grid gap-6">
                    <Typography.Label variant="medium">{texts.chat.phone}</Typography.Label>
                    <Input
                        ref={inputRef}
                        value={phone}
                        inputMode="tel"
                        autoComplete="off"
                        placeholder="79991234567"
                        required
                        withClearButton={false}
                        onChange={(event) => setPhone(event.target.value)}
                    />
                </div>
                {error ? (
                    <Typography.Body variant="small" className="block rounded-12 bg-danger/12 px-12 py-10 text-danger" role="alert">
                        {error}
                    </Typography.Body>
                ) : null}
                <div className="flex items-center justify-end gap-8">
                    <Button type="button" variant="ghost" size="large" onClick={onClose}>
                        {texts.app.cancel}
                    </Button>
                    <Button type="submit" variant="primary" size="large" loading={pending}>
                        {pending ? texts.chat.checking : texts.chat.create}
                    </Button>
                </div>
            </form>
        </div>
    );
}
