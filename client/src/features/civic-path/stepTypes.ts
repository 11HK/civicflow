import type { ServiceStep } from "@/types";

export type StepKind = "self" | "document" | "application" | "form";

/**
 * Infers a completion-validation type for a step from its text, so the step
 * panel can show the right confirmation UI (self-confirm, document attach,
 * application reference, or a form checklist). This is a UI aid only — it never
 * claims the government has verified anything.
 */
export function classifyStep(step: ServiceStep): StepKind {
  const t = `${step.title} ${step.action || ""} ${step.description || ""}`.toLowerCase();

  if (/(submit|acknowledg|application number|reference number|track|after submit)/.test(t))
    return "application";
  if (/(upload|attach|document|scan|proof|photograph|self.?attest)/.test(t))
    return "document";
  if (/(fill|form|enter details|application form)/.test(t)) return "form";
  return "self";
}
