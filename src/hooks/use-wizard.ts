"use client";

import { useState, useCallback, useMemo } from "react";
import type { WizardStep } from "@/lib/providers/types";

export interface WizardMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  stepId?: string;
  stepType?: WizardStep["type"];
  step?: WizardStep;
}

export function useWizard(
  steps: WizardStep[],
  entryStepId: string,
  onConfigPatch: (patch: Record<string, number | string>) => void
) {
  const stepMap = useMemo(() => new Map(steps.map((s) => [s.id, s])), [steps]);

  const entryStep = stepMap.get(entryStepId)!;
  const [messages, setMessages] = useState<WizardMessage[]>([
    {
      id: `bot-${entryStepId}`,
      sender: "bot",
      text: entryStep.botMessage,
      stepId: entryStepId,
      stepType: entryStep.type,
      step: entryStep,
    },
  ]);
  const [currentStepId, setCurrentStepId] = useState<string>(entryStepId);
  const [isComplete, setIsComplete] = useState(false);
  const [answeredSteps, setAnsweredSteps] = useState<Set<string>>(new Set());
  // Track config state for branching decisions
  const [wizardConfig, setWizardConfig] = useState<Record<string, unknown>>({});

  const currentStep = stepMap.get(currentStepId);

  const advanceToStep = useCallback(
    (nextStepId: string) => {
      const nextStep = stepMap.get(nextStepId);
      if (!nextStep) return;

      setCurrentStepId(nextStepId);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${nextStepId}-${Date.now()}`,
          sender: "bot",
          text: nextStep.botMessage,
          stepId: nextStepId,
          stepType: nextStep.type,
          step: nextStep,
        },
      ]);

      if (nextStep.type === "info" && !nextStep.getNextStepId) {
        setIsComplete(true);
      }
    },
    [stepMap]
  );

  const submitChoice = useCallback(
    (choiceLabel: string) => {
      if (!currentStep || currentStep.type !== "choice" || answeredSteps.has(currentStepId)) return;

      const choice = currentStep.choices?.find((c) => c.label === choiceLabel);
      if (!choice) return;

      // Mark step as answered
      setAnsweredSteps((prev) => new Set(prev).add(currentStepId));

      // Add user response message
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${currentStepId}-${Date.now()}`,
          sender: "user",
          text: choiceLabel,
        },
      ]);

      // Apply config patch
      if (Object.keys(choice.configPatch).length > 0) {
        onConfigPatch(choice.configPatch);
      }

      // Update wizard config for branching
      const updatedConfig = { ...wizardConfig, ...choice.configPatch, _lastChoice: choiceLabel };
      setWizardConfig(updatedConfig);

      // Determine next step
      const explicitNext = choice.nextStepId;
      const computedNext = currentStep.getNextStepId?.(updatedConfig);
      const nextStepId = explicitNext ?? computedNext;

      if (nextStepId) {
        advanceToStep(nextStepId);
      } else {
        setIsComplete(true);
      }
    },
    [currentStep, currentStepId, answeredSteps, wizardConfig, onConfigPatch, advanceToStep]
  );

  const submitNumbers = useCallback(
    (values: Record<string, number>) => {
      if (!currentStep || currentStep.type !== "number" || answeredSteps.has(currentStepId)) return;

      // Mark step as answered
      setAnsweredSteps((prev) => new Set(prev).add(currentStepId));

      // Format user response
      const parts = Object.entries(values).map(
        ([key, val]) => {
          const field = currentStep.numberFields?.find((f) => f.key === key);
          return `${field?.label ?? key}: ${val.toLocaleString()}${field?.suffix ? ` ${field.suffix}` : ""}`;
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${currentStepId}-${Date.now()}`,
          sender: "user",
          text: parts.join(", "),
        },
      ]);

      // Apply config patch
      const patch: Record<string, number> = {};
      for (const [k, v] of Object.entries(values)) {
        patch[k] = v;
      }
      onConfigPatch(patch);

      // Update wizard config
      const updatedConfig = { ...wizardConfig, ...patch };
      setWizardConfig(updatedConfig);

      // Determine next step
      const nextStepId = currentStep.getNextStepId?.(updatedConfig) ?? null;
      if (nextStepId) {
        advanceToStep(nextStepId);
      } else {
        setIsComplete(true);
      }
    },
    [currentStep, currentStepId, answeredSteps, wizardConfig, onConfigPatch, advanceToStep]
  );

  const reset = useCallback(() => {
    const entry = stepMap.get(entryStepId)!;
    setMessages([
      {
        id: `bot-${entryStepId}`,
        sender: "bot",
        text: entry.botMessage,
        stepId: entryStepId,
        stepType: entry.type,
        step: entry,
      },
    ]);
    setCurrentStepId(entryStepId);
    setIsComplete(false);
    setAnsweredSteps(new Set());
    setWizardConfig({});
  }, [stepMap, entryStepId]);

  return {
    messages,
    currentStep,
    currentStepId,
    isComplete,
    answeredSteps,
    submitChoice,
    submitNumbers,
    reset,
  };
}
