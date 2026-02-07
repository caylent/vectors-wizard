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
  config,
}: {
  steps: WizardStep[];
  entryStepId: string;
  onConfigPatch: (patch: Record<string, number | string>) => void;
  onSwitchToConfigurator: () => void;
  config: Record<string, number>;
}) {
  const {
    messages,
    currentStepId,
    isComplete,
    answeredSteps,
    submitChoice,
    submitNumbers,
  } = useWizard(steps, entryStepId, onConfigPatch, config);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="overflow-hidden rounded-[16px] border border-border bg-gradient-to-br from-surface to-surface/80">
      {/* Header bar */}
      <div className="border-b border-border bg-surface/60 px-6 py-3 backdrop-blur-sm">
        <h3 className="text-sm font-medium tracking-[0.15em] uppercase text-text-secondary">
          Cost Wizard
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="chat-scroll-fade max-h-[600px] space-y-4 overflow-y-auto p-6"
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
                    className="rounded-[4px] border border-border bg-surface-bright px-4 py-2 text-xs font-medium text-text-secondary transition-all duration-200 hover:border-text-secondary/30 hover:text-text-primary"
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
              className="text-caylent-green hover:underline"
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
