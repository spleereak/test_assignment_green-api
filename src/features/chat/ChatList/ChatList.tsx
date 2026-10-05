import { CellList, CellSimple, Typography } from "@maxhub/max-ui";
import { texts } from "@/app/texts";
import { Avatar } from "@/components/Avatar";
import type { Chat } from "@/api/types";
import { formatStamp } from "@/lib/dates";

export function ChatList({
    chats,
    activeChatId,
    banner,
    onOpen,
    compact,
}: {
    chats: Chat[];
    activeChatId: string | null;
    banner: string | null;
    onOpen: (chatId: string) => void;
    compact: boolean;
}) {
    if (compact) {
        return (
            <aside className="flex h-full min-h-0 flex-col items-center gap-8 overflow-auto border-r border-line bg-panel px-8 py-12" aria-label={texts.app.chats}>
                {chats.map((chat) => {
                    const active = chat.chatId === activeChatId;
                    return (
                        <button
                            key={chat.chatId}
                            type="button"
                            aria-label={chat.title}
                            aria-current={active ? "true" : undefined}
                            title={chat.title}
                            className="rounded-full"
                            onClick={() => onOpen(chat.chatId)}
                        >
                            <Avatar title={chat.title} seed={chat.chatId} />
                        </button>
                    );
                })}
            </aside>
        );
    }

    return (
        <aside className="flex h-full min-h-0 min-w-0 flex-col border-r border-line bg-panel" aria-label={texts.app.chats}>
            {banner ? (
                <Typography.Body variant="small" className="m-12 block rounded-12 bg-danger/12 px-12 py-10 leading-snug text-danger" role="status">
                    {banner}
                </Typography.Body>
            ) : null}
            {chats.length === 0 ? (
                <Typography.Body variant="medium" className="block px-16 py-24 text-muted">
                    {texts.chat.emptyList}
                </Typography.Body>
            ) : (
                <CellList mode="full-width" className="min-h-0 flex-1 overflow-auto">
                    {chats.map((chat) => {
                        const last = chat.messages[chat.messages.length - 1];
                        const active = chat.chatId === activeChatId;
                        return (
                            <CellSimple
                                key={chat.chatId}
                                as="button"
                                title={chat.title}
                                subtitle={last ? last.text : texts.chat.noMessages}
                                before={<Avatar title={chat.title} seed={chat.chatId} />}
                                after={
                                    last ? (
                                        <Typography.Label variant="small" className="text-muted">
                                            {formatStamp(last.timestamp)}
                                        </Typography.Label>
                                    ) : undefined
                                }
                                className={active ? "bg-accent/12" : undefined}
                                onClick={() => onOpen(chat.chatId)}
                            />
                        );
                    })}
                </CellList>
            )}
        </aside>
    );
}
