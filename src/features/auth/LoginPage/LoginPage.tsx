import { useState, type FormEvent, type ReactNode } from "react";
import { Button, Input, Segmented, Typography } from "@maxhub/max-ui";
import { getStateInstance, messengerName, normalizeCredentials, stateHint, type Messenger } from "@/api";
import { texts } from "@/app/texts";
import { useSession } from "@/app/session";
import { EyeIcon, EyeOffIcon } from "@/components/Icons";
import { Logo } from "@/components/Logo";
import { ThemeButton } from "@/components/ThemeButton";

const MESSENGERS = [
    { id: "whatsapp", title: texts.auth.whatsapp },
    { id: "telegram", title: texts.auth.telegram },
] as const;

export function LoginPage() {
    const { login } = useSession();
    const [apiUrl, setApiUrl] = useState("");
    const [idInstance, setIdInstance] = useState("");
    const [apiTokenInstance, setApiTokenInstance] = useState("");
    const [messenger, setMessenger] = useState<Messenger>("whatsapp");
    const [showToken, setShowToken] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setError(null);
        setPending(true);
        try {
            const credentials = normalizeCredentials({ apiUrl, idInstance, apiTokenInstance, messenger });
            const state = await getStateInstance(credentials);
            if (state !== "authorized") {
                setError(stateHint(state));
                return;
            }
            login(credentials);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : texts.auth.failed);
        } finally {
            setPending(false);
        }
    }

    return (
        <main className="login-wallpaper grid min-h-dvh place-items-center overflow-y-auto p-24 max-[480px]:p-12">
            <form className="grid w-full min-w-0 max-w-440 gap-14 rounded-24 border border-line bg-panel/95 p-28 shadow-[0_18px_50px_rgb(0_0_0/0.35)] max-[480px]:gap-12 max-[480px]:p-16" onSubmit={(event) => void onSubmit(event)}>
                <div className="mb-6 flex items-start justify-between gap-12 max-[480px]:flex-col max-[480px]:items-stretch">
                    <div className="flex min-w-0 items-center gap-14">
                        <Logo />
                        <div className="min-w-0">
                            <Typography.Title variant="medium-strong" asChild>
                                <h1 className="m-0">{messengerName(messenger)}</h1>
                            </Typography.Title>
                            <Typography.Body variant="small" className="mt-4 block text-muted">
                                Вход через GREEN-API
                            </Typography.Body>
                        </div>
                    </div>
                    <div className="max-[480px]:self-end">
                        <ThemeButton />
                    </div>
                </div>

                <Segmented
                    items={[...MESSENGERS]}
                    activeItem={messenger}
                    onClick={(id) => {
                        if (id === "whatsapp" || id === "telegram") setMessenger(id);
                    }}
                />

                <Field label={texts.auth.apiUrl}>
                    <Input
                        name="apiUrl"
                        inputMode="url"
                        autoComplete="off"
                        value={apiUrl}
                        placeholder="https://api.green-api.com"
                        required
                        withClearButton={false}
                        onChange={(event) => setApiUrl(event.target.value)}
                    />
                </Field>
                <Field label={texts.auth.idInstance}>
                    <Input
                        name="idInstance"
                        inputMode="numeric"
                        autoComplete="off"
                        value={idInstance}
                        placeholder="1101000001"
                        required
                        withClearButton={false}
                        onChange={(event) => setIdInstance(event.target.value)}
                    />
                </Field>
                <Field label={texts.auth.token}>
                    <div className="flex min-w-0 items-center gap-8 max-[480px]:flex-col max-[480px]:items-stretch">
                        <div className="min-w-0 flex-1">
                            <Input
                                name="apiTokenInstance"
                                type={showToken ? "text" : "password"}
                                autoComplete="off"
                                value={apiTokenInstance}
                                required
                                withClearButton={false}
                                onChange={(event) => setApiTokenInstance(event.target.value)}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            size="small"
                            className="max-[480px]:self-end"
                            iconBefore={showToken ? <EyeOffIcon /> : <EyeIcon />}
                            onClick={() => setShowToken((value) => !value)}
                        >
                            {showToken ? texts.auth.hideToken : texts.auth.showToken}
                        </Button>
                    </div>
                </Field>

                {error ? (
                    <Typography.Body variant="small" className="block rounded-12 bg-danger/12 px-12 py-10 leading-snug text-danger" role="alert">
                        {error}
                    </Typography.Body>
                ) : (
                    <Typography.Body variant="small" className="block text-muted">
                        {texts.auth.hint}
                    </Typography.Body>
                )}

                <Button type="submit" variant="primary" size="large" stretched loading={pending}>
                    {pending ? texts.auth.pending : texts.auth.submit}
                </Button>
            </form>
        </main>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid gap-6">
            <Typography.Label variant="medium">{label}</Typography.Label>
            {children}
        </div>
    );
}
