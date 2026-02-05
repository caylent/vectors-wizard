import type { WizardChoice } from "@/lib/providers/types";

export function WizardChoiceGroup({
  choices,
  onSelect,
  disabled,
}: {
  choices: WizardChoice[];
  onSelect: (label: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {choices.map((choice) => (
        <button
          key={choice.label}
          onClick={() => onSelect(choice.label)}
          disabled={disabled}
          className={`card-glow rounded-[12px] border px-5 py-3 text-left transition-all ${
            disabled
              ? "cursor-not-allowed border-border/50 bg-surface/50 opacity-50"
              : "border-border bg-surface hover:border-text-secondary/20"
          }`}
        >
          <div className="text-sm font-medium text-text-primary">
            {choice.label}
          </div>
          {choice.description && (
            <div className="mt-0.5 text-xs text-muted">
              {choice.description}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
