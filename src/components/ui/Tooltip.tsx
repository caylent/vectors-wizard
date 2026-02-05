export function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1.5 inline-flex cursor-help">
      <svg
        className="h-3.5 w-3.5 text-muted transition-colors group-hover:text-info"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-[12px] border border-border bg-surface-bright/95 px-3 py-2 font-sans text-xs leading-relaxed text-text-secondary opacity-0 shadow-[0_4px_24px_rgba(5,2,40,0.5)] backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}
