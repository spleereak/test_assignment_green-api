import { useEffect, useState } from "react";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function motionDuration(duration: number): number {
    if (window.matchMedia(MOTION_QUERY).matches) return 0;
    return duration;
}

/** Держит узел на экране, пока проигрывается анимация закрытия. */
export function usePresence(open: boolean, duration = 300): { mounted: boolean; shown: boolean } {
    const [mounted, setMounted] = useState(open);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        if (open) {
            setMounted(true);
            return;
        }
        setShown(false);
        const timer = window.setTimeout(() => setMounted(false), motionDuration(duration));
        return () => window.clearTimeout(timer);
    }, [open, duration]);

    useEffect(() => {
        if (!open || !mounted) return;
        // Кадр с закрытым положением должен успеть отрисоваться, иначе первый показ без перехода.
        const timer = window.setTimeout(() => setShown(true), 20);
        return () => window.clearTimeout(timer);
    }, [open, mounted]);

    return { mounted, shown };
}
