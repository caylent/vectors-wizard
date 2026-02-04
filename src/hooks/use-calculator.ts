"use client";

import { useState, useMemo, useCallback } from "react";
import { getProvider } from "@/lib/providers/registry";
import type { PricingProvider, ProviderCostBreakdown } from "@/lib/providers/types";
import { exportConfig, importConfig } from "@/lib/config-serialization";

export type CalculatorMode = "landing" | "wizard" | "configurator";

export function useCalculator(providerId: string = "s3-vectors") {
  const provider = useMemo(() => {
    const p = getProvider(providerId);
    if (!p) throw new Error(`Provider "${providerId}" not found`);
    return p;
  }, [providerId]);

  const [config, setConfig] = useState<Record<string, number>>(
    () => ({ ...provider.defaultConfig as Record<string, number> })
  );
  const [mode, setMode] = useState<CalculatorMode>("landing");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const breakdown: ProviderCostBreakdown = useMemo(
    () => provider.calculateCosts(config),
    [provider, config]
  );

  const updateConfig = useCallback(
    (key: string, value: number) => {
      setActivePreset(null);
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const patchConfig = useCallback(
    (patch: Record<string, number | string>) => {
      setConfig((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(patch)) {
          if (typeof v === "number") {
            next[k] = v;
          }
        }
        return next;
      });
    },
    []
  );

  const replaceConfig = useCallback(
    (newConfig: Record<string, number>) => {
      setActivePreset(null);
      setConfig(newConfig);
    },
    []
  );

  const applyPreset = useCallback(
    (presetName: string) => {
      const preset = provider.presets.find((p) => p.name === presetName);
      if (preset) {
        setActivePreset(presetName);
        setConfig({ ...preset.config });
        setMode("configurator");
      }
    },
    [provider]
  );

  const resetConfig = useCallback(() => {
    setActivePreset(null);
    setConfig({ ...provider.defaultConfig as Record<string, number> });
  }, [provider]);

  const handleExport = useCallback(() => {
    exportConfig(provider.id, config, activePreset);
  }, [provider.id, config, activePreset]);

  const handleImport = useCallback(
    async (file: File) => {
      const result = await importConfig(file, provider);
      if (result.success && result.config) {
        setConfig(result.config);
        setActivePreset(result.presetName ?? null);
        setMode("configurator");
      }
      return result;
    },
    [provider]
  );

  return {
    provider: provider as PricingProvider<Record<string, number>>,
    config,
    mode,
    setMode,
    activePreset,
    breakdown,
    updateConfig,
    patchConfig,
    replaceConfig,
    applyPreset,
    resetConfig,
    exportConfig: handleExport,
    importConfig: handleImport,
  };
}
