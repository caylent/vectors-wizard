import type { CalculatorMode } from "@/hooks/use-calculator";

export function LandingView({
  onSelect,
}: {
  onSelect: (mode: CalculatorMode) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
        <svg
          className="h-8 w-8 text-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h2 className="mb-2 text-xl font-medium text-text-primary">
        Estimate your S3 Vectors costs
      </h2>
      <p className="mb-8 max-w-sm text-sm text-muted">
        Get a monthly cost estimate based on your vector workload. Choose how
        you&rsquo;d like to configure it.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => onSelect("wizard")}
          className="rounded border border-caylent-green bg-caylent-green px-6 py-3 text-sm font-medium text-caylent-green-text transition-all hover:bg-caylent-green-hover active:bg-caylent-green-active hover:shadow-[0_0_20px_rgba(203,239,174,0.2)]"
        >
          <div className="font-medium">Guide me</div>
          <div className="mt-0.5 text-xs text-caylent-green-text/70">
            Answer a few questions
          </div>
        </button>
        <button
          onClick={() => onSelect("configurator")}
          className="rounded border border-accent-dim bg-accent-dim px-6 py-3 text-sm font-medium text-[#f6f3fe] transition-all hover:bg-caylent-purple-hover"
        >
          <div className="font-medium">I know what I need</div>
          <div className="mt-0.5 text-xs text-[#f6f3fe]/70">
            Jump to full configurator
          </div>
        </button>
      </div>
    </div>
  );
}
