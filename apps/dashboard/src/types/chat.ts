import type {
  GitHubContextItem,
  ContextItem as OrchestrationContextItem,
  TextSelection as OrchestrationTextSelection,
} from "@notra/ai/types/orchestration";

export type TextSelection = OrchestrationTextSelection;
export type ContextItem = GitHubContextItem;
export type StandaloneChatContextItem = OrchestrationContextItem;
