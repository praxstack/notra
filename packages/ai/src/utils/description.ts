import type { ToolDescription } from "@notra/ai/types/tools";
import dedent from "dedent";

export const toolDescription = (input: ToolDescription) => {
  const intro = input.intro ? dedent(input.intro) : undefined;
  const whenToUse = input.whenToUse ? dedent(input.whenToUse) : undefined;
  const whenNotToUse = input.whenNotToUse
    ? dedent(input.whenNotToUse)
    : undefined;
  const usageNotes = input.usageNotes ? dedent(input.usageNotes) : undefined;

  const parts: string[] = [];

  if (intro) {
    parts.push(intro);
  }
  if (whenToUse) {
    parts.push(`Use when: ${whenToUse}`);
  }
  if (whenNotToUse) {
    parts.push(`Do not use when: ${whenNotToUse}`);
  }
  if (usageNotes) {
    parts.push(`Notes: ${usageNotes}`);
  }

  return parts.join("\n");
};
