import type {
  ContextItem as OrchestrationContextItem,
  GitHubContextItem,
  TextSelection as OrchestrationTextSelection,
} from "@notra/ai/types/orchestration";

export type TextSelection = OrchestrationTextSelection;
export type ContextItem = GitHubContextItem;
export type StandaloneChatContextItem = OrchestrationContextItem;
