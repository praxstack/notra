import { ANTHROPIC_PROMPT_CACHING_OPTIONS } from "@notra/ai/constants/prompt-caching";
import type { ModelMessage } from "ai";

export function addAnthropicPromptCaching(
  messages: ModelMessage[],
  modelId: string
): ModelMessage[] {
  if (messages.length === 0 || !isAnthropicModel(modelId)) {
    return messages;
  }

  return messages.map((message, index) => {
    if (index !== messages.length - 1) {
      return message;
    }

    return {
      ...message,
      providerOptions: {
        ...message.providerOptions,
        anthropic: {
          ...message.providerOptions?.anthropic,
          ...ANTHROPIC_PROMPT_CACHING_OPTIONS.anthropic,
        },
      },
    };
  });
}

function isAnthropicModel(modelId: string): boolean {
  return modelId.startsWith("anthropic/") || modelId.includes("claude");
}
