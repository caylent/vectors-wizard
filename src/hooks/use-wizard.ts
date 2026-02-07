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
  onConfigPatch: (patch: Record<string, number | string>) => void,
  parentConfig: Record<string, number> = {}
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
  // Track the last choice label for wizard routing (ephemeral, not part of config)
  const [lastChoice, setLastChoice] = useState<string | null>(null);

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

      // Track last choice for routing
      setLastChoice(choiceLabel);

      // Build merged config for branching: parent config + this patch + routing state
      const mergedConfig = { ...parentConfig, ...choice.configPatch, _lastChoice: choiceLabel };

      // Determine next step
      const explicitNext = choice.nextStepId;
      const computedNext = currentStep.getNextStepId?.(mergedConfig);
      const nextStepId = explicitNext ?? computedNext;

      if (nextStepId) {
        advanceToStep(nextStepId);
      } else {
        setIsComplete(true);
      }
    },
    [currentStep, currentStepId, answeredSteps, parentConfig, onConfigPatch, advanceToStep]
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

      // Build merged config for branching: parent config + this patch
      const mergedConfig: Record<string, unknown> = { ...parentConfig, ...patch };
      if (lastChoice !== null) {
        mergedConfig._lastChoice = lastChoice;
      }

      // Determine next step
      const nextStepId = currentStep.getNextStepId?.(mergedConfig) ?? null;
      if (nextStepId) {
        advanceToStep(nextStepId);
      } else {
        setIsComplete(true);
      }
    },
    [currentStep, currentStepId, answeredSteps, parentConfig, lastChoice, onConfigPatch, advanceToStep]
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
    setLastChoice(null);
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
