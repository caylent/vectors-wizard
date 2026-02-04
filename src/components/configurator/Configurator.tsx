import type { ProviderConfigField } from "@/lib/providers/types";
import { InputField } from "./InputField";
import { DimensionSelect } from "./DimensionSelect";
import { SectionCard } from "./SectionCard";
import { VectorSizeVisualization } from "@/components/results/VectorSizeVisualization";

export function Configurator({
  fields,
  config,
  onUpdate,
}: {
  fields: ProviderConfigField[];
  config: Record<string, number>;
  onUpdate: (key: string, value: number) => void;
}) {
  // Group fields by section
  const sections = new Map<string, ProviderConfigField[]>();
  for (const field of fields) {
    const group = sections.get(field.section) ?? [];
    group.push(field);
    sections.set(field.section, group);
  }

  return (
    <div className="space-y-6">
      {Array.from(sections.entries()).map(([sectionName, sectionFields]) => (
        <SectionCard key={sectionName} title={sectionName}>
          <div
            className={`grid gap-5 ${
              sectionFields.length === 2
                ? "sm:grid-cols-2"
                : sectionFields.length >= 3
                  ? "sm:grid-cols-3"
                  : ""
            }`}
          >
            {sectionFields.map((field) => {
              if (field.type === "select" && field.options) {
                return (
                  <DimensionSelect
                    key={field.key}
                    label={field.label}
                    tooltip={field.tooltip}
                    value={config[field.key] ?? 0}
                    onChange={(v) => onUpdate(field.key, v)}
                    options={field.options}
                  />
                );
              }
              return (
                <InputField
                  key={field.key}
                  label={field.label}
                  tooltip={field.tooltip}
                  value={config[field.key] ?? 0}
                  onChange={(v) => onUpdate(field.key, v)}
                  suffix={field.suffix}
                  min={field.min ?? 0}
                />
              );
            })}
          </div>
          {sectionName === "Per-Vector Data" && (
            <div className="mt-5">
              <VectorSizeVisualization
                dimensions={config.dimensions ?? 0}
                avgKeyLengthBytes={config.avgKeyLengthBytes ?? 0}
                filterableMetadataBytes={config.filterableMetadataBytes ?? 0}
                nonFilterableMetadataBytes={config.nonFilterableMetadataBytes ?? 0}
              />
            </div>
          )}
        </SectionCard>
      ))}
    </div>
  );
}
