import type { CalculatorMode } from "@/hooks/use-calculator";

export function LandingView({
  onSelect,
}: {
  onSelect: (mode: CalculatorMode) => void;
}) {
  return (
    <div className="relative flex min-h-[80vh] items-center justify-center">
      {/* Content */}
      <div className="flex flex-col items-center text-center">
        <div className="animate-fade-in-up mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-surface-bright ring-1 ring-border">
          <svg
            className="h-12 w-12 text-text-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>

        <h2 className="animate-fade-in-up animate-delay-100 mb-4 max-w-3xl text-[length:var(--font-size-hero)] font-medium leading-[0.95] tracking-tight text-text-primary">
          Know your vector costs before you build
        </h2>

        <p className="animate-fade-in-up animate-delay-200 mb-10 max-w-lg text-[length:var(--font-size-hero-sub)] text-muted">
          Get a monthly cost estimate based on your vector workload. Choose how
          you&rsquo;d like to configure it.
        </p>

        <div className="animate-fade-in-up animate-delay-300 flex flex-col gap-4 sm:flex-row">
          <button
            onClick={() => onSelect("wizard")}
            className="rounded-[4px] border border-caylent-green bg-caylent-green px-8 py-4 text-base font-medium text-caylent-green-text transition-all duration-200 hover:bg-caylent-green-hover hover:shadow-[0_0_30px_rgba(203,239,174,0.25)] active:scale-[0.98] active:bg-caylent-green-active"
          >
            <div className="font-medium">Guide me</div>
            <div className="mt-0.5 text-sm text-caylent-green-text/70">
              Answer a few questions
            </div>
          </button>
          <button
            onClick={() => onSelect("configurator")}
            className="rounded-[4px] border border-border bg-surface-bright px-8 py-4 text-base font-medium text-text-primary transition-all duration-200 hover:border-text-secondary/30 hover:bg-surface-bright/80 active:scale-[0.98]"
          >
            <div className="font-medium">I know what I need</div>
            <div className="mt-0.5 text-sm text-text-secondary">
              Jump to full configurator
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
