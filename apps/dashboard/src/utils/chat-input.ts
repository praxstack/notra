import type { ContextItem, TextSelection } from "@/schemas/content";
import type { EnabledRepo } from "@/types/components/chat-input";

export const CHAT_INPUT_LIMIT_MESSAGE = "No chat credits left.";

export function getSelectionPreview(selection: TextSelection) {
  return selection.text.length > 150
    ? `${selection.text.slice(0, 150)}...`
    : selection.text;
}

export function toGithubContextItem(repo: EnabledRepo): ContextItem {
  return {
    type: "github-repo",
    owner: repo.owner,
    repo: repo.repo,
    integrationId: repo.integrationId,
  };
}
