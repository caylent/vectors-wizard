"use client";

import { useState } from "react";
import type { WizardNumberField } from "@/lib/providers/types";

export function WizardNumberInput({
  fields,
  onSubmit,
  disabled,
}: {
  fields: WizardNumberField[];
  onSubmit: (values: Record<string, number>) => void;
  disabled: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of fields) {
      init[f.key] = "";
    }
    return init;
  });

  const handleSubmit = () => {
    const nums: Record<string, number> = {};
    for (const f of fields) {
      const n = Number(values[f.key]);
      nums[f.key] = isNaN(n) ? (f.min ?? 0) : Math.max(f.min ?? 0, n);
    }
    onSubmit(nums);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div key={field.key} className="flex items-center gap-2">
          {fields.length > 1 && (
            <label className="w-40 shrink-0 text-xs font-medium text-text-secondary">
              {field.label}
            </label>
          )}
          <input
            type="number"
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            value={values[field.key]}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
            }
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="w-full rounded border border-border bg-surface px-3 py-2 font-mono text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent-glow disabled:opacity-50"
          />
          {field.suffix && (
            <span className="shrink-0 text-xs text-muted">{field.suffix}</span>
          )}
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={disabled}
        className="rounded bg-caylent-green px-4 py-1.5 text-xs font-medium text-caylent-green-text transition-colors hover:bg-caylent-green-hover active:bg-caylent-green-active disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}
