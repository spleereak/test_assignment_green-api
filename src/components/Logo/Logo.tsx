export function Logo({ className = "size-48" }: { className?: string }) {
    return (
        <svg className={`${className} shrink-0`} viewBox="0 0 48 48" aria-hidden="true">
            <rect width="48" height="48" rx="14" fill="#2f7bff" />
            <path
                fill="#fff"
                d="M13 16.5h16.5a6.2 6.2 0 0 1 0 12.4H20l-5 4.4a1 1 0 0 1-1.7-.8v-3.6H13a5.4 5.4 0 0 1 0-12.4Z"
            />
        </svg>
    );
}
