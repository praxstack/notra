import type { MessageProviderOptions } from "@notra/ai/types/prompt-caching";

export const ANTHROPIC_PROMPT_CACHING_OPTIONS = {
  anthropic: {
    cacheControl: {
      type: "ephemeral",
    },
  },
} satisfies MessageProviderOptions;
