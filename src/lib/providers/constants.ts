import type { CostLineItem } from "./types";

/** Standard embedding dimension options shared across providers. */
export const DIMENSION_OPTIONS = [256, 384, 512, 768, 1024, 1536, 2048, 3072, 4096] as const;

/** Dimension options formatted for select field UI. */
export const DIMENSION_SELECT_OPTIONS = DIMENSION_OPTIONS.map((d) => ({ value: d, label: `${d}` }));

/** Create a "Plan Minimum" line item for providers with minimum spend requirements. */
export function createMinimumLineItem(amount: number, note: string): CostLineItem {
  return {
    category: "minimum",
    label: "Plan Minimum",
    amount,
    details: { Note: note },
    color: "#f59e0b",
  };
}
