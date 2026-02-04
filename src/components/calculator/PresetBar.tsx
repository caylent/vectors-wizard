import type { ProviderPreset } from "@/lib/providers/types";

export function PresetBar({
  presets,
  activePreset,
  onApply,
}: {
  presets: ProviderPreset[];
  activePreset: string | null;
  onApply: (name: string) => void;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
        Presets
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onApply(preset.name)}
            className={`rounded-xl border px-4 py-3 text-left transition-all ${
              activePreset === preset.name
                ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(133,85,240,0.1)]"
                : "border-border bg-surface hover:border-accent/40"
            }`}
          >
            <div
              className={`text-sm font-medium ${
                activePreset === preset.name
                  ? "text-accent"
                  : "text-text-primary"
              }`}
            >
              {preset.name}
            </div>
            <div className="mt-0.5 text-xs text-muted">
              {preset.description}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
