import { Avatar as MaxAvatar } from "@maxhub/max-ui";
import { initials } from "@/lib/phone";

const GRADIENTS = ["red", "orange", "green", "blue", "purple"] as const;

export function Avatar({ title, seed }: { title: string; seed: string }) {
    let hash = 0;
    for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    const gradient = GRADIENTS[hash % GRADIENTS.length] ?? "blue";

    return (
        <MaxAvatar.Container size={44} form="circle">
            <MaxAvatar.Text gradient={gradient}>{initials(title)}</MaxAvatar.Text>
        </MaxAvatar.Container>
    );
}
