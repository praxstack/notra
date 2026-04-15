import type { ContextItem, TextSelection } from "@/schemas/content";
import type { GitHubRepository } from "@/types/integrations";

export interface ChatInputProps {
  onSend?: (value: string) => void;
  isLoading?: boolean;
  statusText?: string;
  completionMessage?: string | null;
  selection?: TextSelection | null;
  onClearSelection?: () => void;
  organizationSlug?: string;
  organizationId?: string;
  context?: ContextItem[];
  onAddContext?: (item: ContextItem) => void;
  onRemoveContext?: (item: ContextItem) => void;
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string | null;
  onClearError?: () => void;
}

export type EnabledRepo = GitHubRepository & { integrationId: string };
