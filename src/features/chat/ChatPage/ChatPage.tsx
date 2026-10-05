import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Button, Typography } from "@maxhub/max-ui";
import { messengerName, type Credentials, type ReceiveState } from "@/api/types";
import { texts } from "@/app/texts";
import { useSession } from "@/app/session";
import { Avatar } from "@/components/Avatar";
import { BackIcon, LogoutIcon, MenuIcon, PlusIcon } from "@/components/Icons";
import { Sheet } from "@/components/Sheet";
import { ThemeButton } from "@/components/ThemeButton";
import { ChatList } from "@/features/chat/ChatList";
import { Composer, MessageList } from "@/features/chat/Conversation";
import { NewChatDialog } from "@/features/chat/NewChatDialog";
import { formatPhone } from "@/lib/phone";
import { MESSAGE_LIMIT, useChat } from "./ChatPage.model";

const SIDEBAR_KEY = "max-chat-sidebar";
const COMPACT_WIDTH = 72;
const FULL_WIDTH = 340;
const SNAP_WIDTH = (COMPACT_WIDTH + FULL_WIDTH) / 2;

function readCompact(): boolean {
    try {
        return localStorage.getItem(SIDEBAR_KEY) === "compact";
    } catch {
        return false;
    }
}

function saveCompact(compact: boolean): void {
    try {
        localStorage.setItem(SIDEBAR_KEY, compact ? "compact" : "full");
    } catch {
        // Ширина списка останется до перезагрузки.
    }
}

function useDesktop(): boolean {
    const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 861px)").matches);
    useEffect(() => {
        const media = window.matchMedia("(min-width: 861px)");
        const onChange = () => setDesktop(media.matches);
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, []);
    return desktop;
}

export function ChatPage() {
    const { credentials } = useSession();
    if (!credentials) return null;
    return <ChatWorkspace credentials={credentials} />;
}

function ChatWorkspace({ credentials }: { credentials: Credentials }) {
    const chat = useChat(credentials);
    const desktop = useDesktop();
    const [compact, setCompact] = useState(readCompact);
    const [menu, setMenu] = useState(false);
    const [dragWidth, setDragWidth] = useState<number | null>(null);
    const drag = useRef<{ startX: number; startWidth: number } | null>(null);
    const collapsed = desktop && (dragWidth !== null ? dragWidth < SNAP_WIDTH : compact);
    const column = dragWidth ?? (collapsed ? COMPACT_WIDTH : FULL_WIDTH);

    useEffect(() => {
        if (desktop) setMenu(false);
    }, [desktop]);

    function applyCompact(next: boolean): void {
        setCompact(next);
        saveCompact(next);
    }

    function onEdgeDown(event: ReactPointerEvent<HTMLDivElement>): void {
        if (!desktop) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { startX: event.clientX, startWidth: collapsed ? COMPACT_WIDTH : FULL_WIDTH };
        setDragWidth(collapsed ? COMPACT_WIDTH : FULL_WIDTH);
    }

    function onEdgeMove(event: ReactPointerEvent<HTMLDivElement>): void {
        if (!drag.current) return;
        const next = drag.current.startWidth + event.clientX - drag.current.startX;
        setDragWidth(Math.min(FULL_WIDTH, Math.max(COMPACT_WIDTH, next)));
    }

    function onEdgeUp(event: ReactPointerEvent<HTMLDivElement>): void {
        if (!drag.current) return;
        const moved = event.clientX - drag.current.startX;
        const width = Math.min(FULL_WIDTH, Math.max(COMPACT_WIDTH, drag.current.startWidth + moved));
        drag.current = null;
        setDragWidth(null);
        applyCompact(Math.abs(moved) < 8 ? !compact : width < SNAP_WIDTH);
    }

    return (
        <div className={`flex h-dvh min-h-0 flex-col overflow-hidden bg-bg ${dragWidth !== null ? "select-none" : ""}`}>
            <header className="flex min-w-0 flex-wrap items-center justify-between gap-12 border-b border-line bg-panel px-16 py-12">
                <div className="min-w-0">
                    <Typography.Headline variant="medium" asChild>
                        <h2 className="m-0">{texts.app.chats}</h2>
                    </Typography.Headline>
                    <Typography.Body variant="small" className={`mt-4 block ${statusClass(chat.receiveState)}`}>
                        {texts.chat.status[chat.receiveState]}
                    </Typography.Body>
                </div>
                <div className="hidden min-w-0 flex-wrap items-center gap-8 min-[861px]:flex">
                    <ThemeButton />
                    <Button type="button" variant="secondary" size="small" iconBefore={<LogoutIcon />} onClick={chat.logout}>
                        {texts.app.logout}
                    </Button>
                    <Button type="button" variant="primary" size="small" iconBefore={<PlusIcon />} onClick={() => chat.setCreating(true)}>
                        {texts.chat.newChat}
                    </Button>
                </div>
                <div className="min-[861px]:hidden">
                    <Button type="button" variant="secondary" size="small" iconBefore={<MenuIcon />} aria-expanded={menu} onClick={() => setMenu(true)}>
                        {texts.app.menu}
                    </Button>
                </div>
            </header>
            <Sheet open={menu} label={texts.app.menu} onClose={() => setMenu(false)}>
                <ThemeButton stretched />
                <Button type="button" variant="secondary" size="medium" stretched iconBefore={<LogoutIcon />} onClick={chat.logout}>
                    {texts.app.logout}
                </Button>
                <Button
                    type="button"
                    variant="primary"
                    size="medium"
                    stretched
                    iconBefore={<PlusIcon />}
                    onClick={() => {
                        setMenu(false);
                        chat.setCreating(true);
                    }}
                >
                    {texts.chat.newChat}
                </Button>
            </Sheet>

            <div
                className="grid min-h-0 flex-1 grid-cols-[340px_minmax(0,1fr)] overflow-hidden max-[860px]:grid-cols-1"
                style={desktop ? { gridTemplateColumns: `${column}px minmax(0, 1fr)` } : undefined}
                data-pane={chat.pane}
            >
                <div className={`relative min-h-0 min-w-0 ${chat.pane === "chat" ? "max-[860px]:hidden" : ""}`}>
                    <ChatList
                        chats={chat.chats}
                        activeChatId={chat.activeChat?.chatId ?? null}
                        banner={collapsed ? null : chat.banner}
                        onOpen={chat.openChat}
                        compact={collapsed}
                    />
                    <div
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={texts.app.resizeSidebar}
                        aria-valuemin={COMPACT_WIDTH}
                        aria-valuemax={FULL_WIDTH}
                        aria-valuenow={column}
                        tabIndex={0}
                        className="absolute inset-y-0 right-0 z-20 w-12 cursor-col-resize touch-none max-[860px]:hidden"
                        onPointerDown={onEdgeDown}
                        onPointerMove={onEdgeMove}
                        onPointerUp={onEdgeUp}
                        onPointerCancel={onEdgeUp}
                        onKeyDown={(event) => {
                            if (event.key === "ArrowLeft") applyCompact(true);
                            if (event.key === "ArrowRight") applyCompact(false);
                        }}
                    />
                </div>

                <section
                    className={`wallpaper flex min-h-0 min-w-0 flex-col ${chat.pane === "list" ? "max-[860px]:hidden" : ""}`}
                    aria-label={texts.chat.dialog}
                >
                    {collapsed && chat.banner ? (
                        <Typography.Body variant="small" className="m-12 block rounded-12 bg-danger/12 px-12 py-10 leading-snug text-danger" role="status">
                            {chat.banner}
                        </Typography.Body>
                    ) : null}
                    {chat.activeChat ? (
                        <>
                            <header className="flex min-h-72 min-w-0 items-center gap-12 border-b border-line py-12 pr-16 pl-16 max-[860px]:pl-4">
                                <div className="hidden shrink-0 max-[860px]:-mr-8 max-[860px]:block">
                                    <button
                                        type="button"
                                        aria-label={texts.app.back}
                                        className="grid size-44 place-items-center bg-transparent text-ink"
                                        onClick={() => chat.setPane("list")}
                                    >
                                        <BackIcon className="size-26" />
                                    </button>
                                </div>
                                <Avatar title={chat.activeChat.title} seed={chat.activeChat.chatId} />
                                <div className="min-w-0">
                                    <Typography.Title variant="large-strong" asChild>
                                        <h2 className="m-0 truncate">{chat.activeChat.title}</h2>
                                    </Typography.Title>
                                    <Typography.Body variant="small" className="block text-muted">
                                        {chatSubtitle(chat.activeChat.title, chat.activeChat.phone, messengerName(credentials.messenger))}
                                    </Typography.Body>
                                </div>
                            </header>
                            <MessageList
                                messages={chat.activeChat.messages}
                                onRetry={(message) => void chat.submitMessage(message.text, message.id)}
                            />
                            <Composer
                                value={chat.draft}
                                disabled={chat.sending}
                                maxLength={MESSAGE_LIMIT}
                                onChange={chat.setDraft}
                                onSubmit={() => void chat.submitMessage(chat.draft)}
                            />
                        </>
                    ) : (
                        <Typography.Body variant="medium" className="m-auto block px-24 text-center text-muted">
                            {texts.chat.placeholder}
                        </Typography.Body>
                    )}
                </section>
            </div>

            <NewChatDialog
                open={chat.creating}
                messenger={messengerName(credentials.messenger)}
                onClose={() => chat.setCreating(false)}
                onCreate={chat.createChat}
            />
        </div>
    );
}

function chatSubtitle(title: string, phone: string, messenger: string): string {
    if (phone) {
        const formatted = formatPhone(phone);
        if (formatted !== title) return formatted;
    }
    return messenger;
}

function statusClass(state: ReceiveState): string {
    if (state === "ready") return "text-ok";
    if (state === "error") return "text-danger";
    return "text-warn";
}
