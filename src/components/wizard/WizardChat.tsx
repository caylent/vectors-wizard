"use client";

import { useRef, useEffect } from "react";
import { useWizard } from "@/hooks/use-wizard";
import type { WizardStep } from "@/lib/providers/types";
import { WizardMessage } from "./WizardMessage";
import { WizardChoiceGroup } from "./WizardChoiceGroup";
import { WizardNumberInput } from "./WizardNumberInput";

export function WizardChat({
  steps,
  entryStepId,
  onConfigPatch,
  onSwitchToConfigurator,
}: {
  steps: WizardStep[];
  entryStepId: string;
  onConfigPatch: (patch: Record<string, number | string>) => void;
  onSwitchToConfigurator: () => void;
}) {
  const {
    messages,
    currentStepId,
    isComplete,
    answeredSteps,
    submitChoice,
    submitNumbers,
  } = useWizard(steps, entryStepId, onConfigPatch);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div
        ref={scrollRef}
        className="max-h-[600px] space-y-4 overflow-y-auto p-6"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-3">
            <WizardMessage sender={msg.sender} text={msg.text} />

            {/* Render interactive controls for bot messages with steps */}
            {msg.sender === "bot" && msg.step && (
              <div className="pl-1">
                {msg.step.helpText && (
                  <p className="mb-3 text-xs text-muted">{msg.step.helpText}</p>
                )}

                {msg.step.type === "choice" && msg.step.choices && (
                  <WizardChoiceGroup
                    choices={msg.step.choices}
                    onSelect={submitChoice}
                    disabled={answeredSteps.has(msg.stepId!) || currentStepId !== msg.stepId}
                  />
                )}

                {msg.step.type === "number" && msg.step.numberFields && (
                  <WizardNumberInput
                    fields={msg.step.numberFields}
                    onSubmit={submitNumbers}
                    disabled={answeredSteps.has(msg.stepId!) || currentStepId !== msg.stepId}
                  />
                )}

                {msg.step.type === "info" && (
                  <button
                    onClick={onSwitchToConfigurator}
                    className="rounded-lg border border-border bg-surface-bright px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
                  >
                    Switch to full configurator
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {isComplete && (
        <div className="border-t border-border px-6 py-3">
          <p className="text-xs text-muted">
            Wizard complete. Results are shown on the right.{" "}
            <button
              onClick={onSwitchToConfigurator}
              className="text-accent hover:underline"
            >
              Switch to configurator
            </button>{" "}
            to fine-tune values.
          </p>
        </div>
      )}
    </div>
  );
}
