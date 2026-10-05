import { useEffect, type ReactNode } from "react";
import { usePresence } from "@/lib/presence";

export function Sheet({
    open,
    label,
    onClose,
    children,
}: {
    open: boolean;
    label: string;
    onClose: () => void;
    children: ReactNode;
}) {
    const { mounted, shown } = usePresence(open);

    useEffect(() => {
        if (!open) return;
        function onKey(event: KeyboardEvent): void {
            if (event.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!mounted) return null;

    return (
        <div
            className="motion-fade fixed inset-0 z-40 bg-black/55"
            data-shown={shown}
            role="presentation"
            onMouseDown={onClose}
        >
            <div
                className="motion-sheet absolute inset-x-0 bottom-0 grid max-h-[80dvh] gap-10 overflow-auto rounded-t-24 border border-line bg-panel px-16 pt-16 pb-24 shadow-[0_-12px_40px_rgb(0_0_0/0.28)]"
                data-shown={shown}
                role="dialog"
                aria-modal="true"
                aria-label={label}
                onMouseDown={(event) => event.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}
