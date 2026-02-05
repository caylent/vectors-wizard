"use client";

import type { useCalculator } from "@/hooks/use-calculator";
import { PresetBar } from "./PresetBar";
import { ModeSelector } from "./ModeSelector";
import { ConfigToolbar } from "./ConfigToolbar";
import { LandingView } from "./LandingView";
import { Configurator } from "@/components/configurator/Configurator";
import { WizardChat } from "@/components/wizard/WizardChat";
import { ResultsPanel } from "@/components/results/ResultsPanel";

type CalculatorState = ReturnType<typeof useCalculator>;

export function CalculatorShell({ state }: { state: CalculatorState }) {
  const {
    provider,
    config,
    mode,
    setMode,
    activePreset,
    breakdown,
    updateConfig,
    patchConfig,
    applyPreset,
    resetConfig,
    exportConfig,
    importConfig,
  } = state;

  return (
    <>
      {/* Presets — always visible (except on landing) */}
      {mode !== "landing" && (
        <div className="animate-fade-in-up">
          <PresetBar
            presets={provider.presets}
            activePreset={activePreset}
            onApply={applyPreset}
          />
        </div>
      )}

      {mode === "landing" && <LandingView onSelect={setMode} />}

      {mode !== "landing" && (
        <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:gap-12">
          {/* Left column */}
          <div className="animate-fade-in-up animate-delay-100">
            <ModeSelector mode={mode} onModeChange={setMode} />
            <ConfigToolbar
              onExport={exportConfig}
              onImport={importConfig}
              onReset={resetConfig}
            />
            {mode === "wizard" && (
              <WizardChat
                steps={provider.wizardSteps}
                entryStepId={provider.entryStepId}
                onConfigPatch={patchConfig}
                onSwitchToConfigurator={() => setMode("configurator")}
              />
            )}
            {mode === "configurator" && (
              <Configurator
                fields={provider.configFields}
                config={config}
                onUpdate={updateConfig}
              />
            )}
          </div>

          {/* Right column — sticky results */}
          <div className="animate-fade-in-up animate-delay-200 lg:sticky lg:top-24 lg:self-start">
            <ResultsPanel
              breakdown={breakdown}
              config={config}
              provider={provider}
            />
          </div>
        </div>
      )}
    </>
  );
}
