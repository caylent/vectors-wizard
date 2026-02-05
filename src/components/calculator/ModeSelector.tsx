import type { CalculatorMode } from "@/hooks/use-calculator";

export function ModeSelector({
  mode,
  onModeChange,
}: {
  mode: CalculatorMode;
  onModeChange: (mode: CalculatorMode) => void;
}) {
  if (mode === "landing") return null;

  return (
    <div className="mb-8 flex items-center gap-1 rounded-[12px] border border-border bg-surface/80 p-1 backdrop-blur-sm">
      <button
        onClick={() => onModeChange("wizard")}
        className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
          mode === "wizard"
            ? "bg-surface-bright text-text-primary shadow-sm ring-1 ring-border"
            : "text-muted hover:text-text-secondary"
        }`}
      >
        Guided
      </button>
      <button
        onClick={() => onModeChange("configurator")}
        className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
          mode === "configurator"
            ? "bg-surface-bright text-text-primary shadow-sm ring-1 ring-border"
            : "text-muted hover:text-text-secondary"
        }`}
      >
        Manual
      </button>
    </div>
  );
}
