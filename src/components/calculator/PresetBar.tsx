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
    <section className="mb-10">
      <h2 className="mb-5 text-xs font-medium uppercase tracking-[0.15em] text-muted">
        Presets
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onApply(preset.name)}
            className={`card-glow rounded-[16px] border px-5 py-4 text-left transition-all ${
              activePreset === preset.name
                ? "border-caylent-green/30 bg-caylent-green/5 ring-1 ring-caylent-green/10"
                : "border-border bg-surface hover:border-text-secondary/20"
            }`}
          >
            <div
              className={`text-sm font-medium ${
                activePreset === preset.name
                  ? "text-caylent-green"
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
