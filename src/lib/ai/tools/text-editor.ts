import { anthropic } from "@ai-sdk/anthropic";

interface TextEditorContext {
  getCurrentContent: () => string;
  setContent: (content: string) => void;
}

function formatLinesWithNumbers(lines: string[], startLine: number): string {
  return lines.map((line, i) => `${startLine + i}: ${line}`).join("\n");
}

function handleViewCommand(content: string, viewRange?: number[]): string {
  const lines = content.split("\n");
  if (!viewRange) {
    return formatLinesWithNumbers(lines, 1);
  }
  const [start, end] = viewRange;
  const endLine = end === -1 ? lines.length : end;
  return formatLinesWithNumbers(lines.slice(start - 1, endLine), start);
}

function handleStrReplaceCommand(
  content: string,
  oldStr: string,
  newStr: string,
  setContent: (c: string) => void
): string {
  const count = content.split(oldStr).length - 1;
  if (count === 0) {
    return "Error: No match found for replacement text.";
  }
  if (count > 1) {
    return `Error: Found ${count} matches. Provide more context to make a unique match.`;
  }
  setContent(content.replace(oldStr, newStr));
  return "Successfully replaced text.";
}

function handleInsertCommand(
  content: string,
  insertLine: number,
  newStr: string,
  setContent: (c: string) => void
): string {
  const lines = content.split("\n");
  lines.splice(insertLine, 0, newStr);
  setContent(lines.join("\n"));
  return "Successfully inserted text.";
}

export function createTextEditorTool(context: TextEditorContext) {
  return anthropic.tools.textEditor_20250728({
    execute: ({
      command,
      file_text,
      insert_line,
      new_str,
      old_str,
      view_range,
    }) => {
      const content = context.getCurrentContent();

      if (command === "view") {
        return handleViewCommand(content, view_range);
      }
      if (command === "str_replace" && old_str && new_str !== undefined) {
        return handleStrReplaceCommand(
          content,
          old_str,
          new_str,
          context.setContent
        );
      }
      if (command === "create" && file_text) {
        context.setContent(file_text);
        return "Successfully created content.";
      }
      if (command === "insert" && insert_line !== undefined && new_str) {
        return handleInsertCommand(
          content,
          insert_line,
          new_str,
          context.setContent
        );
      }
      return "Error: Invalid command or missing parameters.";
    },
  });
}
