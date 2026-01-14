import { withSupermemory } from "@supermemory/tools/ai-sdk";
import { stepCountIs, ToolLoopAgent } from "ai";
import { getChatPrompt } from "@/lib/ai/prompts/chat";
import { createTextEditorTool } from "@/lib/ai/tools/text-editor";
import { openrouter } from "@/lib/openrouter";

interface ChatAgentContext {
  organizationId: string;
  currentMarkdown: string;
  selectedText?: string;
  onMarkdownUpdate: (markdown: string) => void;
}

export function createChatAgent(context: ChatAgentContext) {
  const modelWithMemory = withSupermemory(
    openrouter("anthropic/claude-sonnet-4.5"),
    context.organizationId
  );

  let currentContent = context.currentMarkdown;

  const tools = {
    str_replace_based_edit_tool: createTextEditorTool({
      getCurrentContent: () => currentContent,
      setContent: (content) => {
        currentContent = content;
        context.onMarkdownUpdate(content);
      },
    }),
  };

  return new ToolLoopAgent({
    model: modelWithMemory,
    tools,
    instructions: getChatPrompt(context.selectedText),
    stopWhen: stepCountIs(15),
  });
}
