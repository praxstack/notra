import { tool } from "ai";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

const editOperationSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("replace"),
    line: z.number().describe("The line number to replace (1-indexed)"),
    content: z.string().describe("The new content for the line"),
  }),
  z.object({
    op: z.literal("replace"),
    startLine: z
      .number()
      .describe("The starting line number of the range (1-indexed)"),
    endLine: z
      .number()
      .describe("The ending line number of the range (1-indexed)"),
    content: z
      .string()
      .describe("The new content (use \\n for multiple lines)"),
  }),
  z.object({
    op: z.literal("insert"),
    afterLine: z
      .number()
      .describe("The line number after which to insert (0 for start)"),
    content: z.string().describe("The content to insert"),
  }),
  z.object({
    op: z.literal("delete"),
    line: z.number().describe("The line number to delete (1-indexed)"),
  }),
  z.object({
    op: z.literal("delete"),
    startLine: z
      .number()
      .describe("The starting line number to delete (1-indexed)"),
    endLine: z
      .number()
      .describe("The ending line number to delete (1-indexed)"),
  }),
]);

export type EditOperation = z.infer<typeof editOperationSchema>;

interface EditMarkdownContext {
  currentMarkdown: string;
  onUpdate: (markdown: string) => void;
}

function getOperationLineNumber(op: EditOperation): number {
  if ("line" in op && op.line !== undefined) {
    return op.line;
  }
  if ("startLine" in op && op.startLine !== undefined) {
    return op.startLine;
  }
  if ("afterLine" in op && op.afterLine !== undefined) {
    return op.afterLine;
  }
  return 0;
}

function applyOperation(lines: string[], op: EditOperation): void {
  if (op.op === "replace") {
    if ("line" in op && op.line !== undefined) {
      lines[op.line - 1] = op.content;
    } else if ("startLine" in op && "endLine" in op) {
      const newLines = op.content.split("\n");
      lines.splice(
        op.startLine - 1,
        op.endLine - op.startLine + 1,
        ...newLines
      );
    }
  } else if (op.op === "insert" && "afterLine" in op) {
    const newLines = op.content.split("\n");
    lines.splice(op.afterLine, 0, ...newLines);
  } else if (op.op === "delete") {
    if ("line" in op && op.line !== undefined) {
      lines.splice(op.line - 1, 1);
    } else if ("startLine" in op && "endLine" in op) {
      lines.splice(op.startLine - 1, op.endLine - op.startLine + 1);
    }
  }
}

export function createEditMarkdownTool(context: EditMarkdownContext) {
  const currentLines = context.currentMarkdown.split("\n");

  return tool({
    description:
      "Edit the markdown content by applying operations (replace, insert, delete). Always process operations from bottom to top (highest line numbers first) to maintain line number accuracy.",
    inputSchema: z.object({
      operations: z
        .array(editOperationSchema)
        .describe(
          "Array of edit operations to apply. Process from highest line number to lowest."
        ),
    }),
    execute: ({ operations }) => {
      const sortedOps = [...operations].sort(
        (a, b) => getOperationLineNumber(b) - getOperationLineNumber(a)
      );

      for (const op of sortedOps) {
        applyOperation(currentLines, op);
      }

      const updatedMarkdown = currentLines.join("\n");
      context.onUpdate(updatedMarkdown);

      return {
        success: true,
        lineCount: currentLines.length,
        preview: `${currentLines.slice(0, 10).join("\n")}\n...`,
      };
    },
  });
}

export function createGetMarkdownTool(context: EditMarkdownContext) {
  return tool({
    description:
      "Get the current markdown content with line numbers to understand the document structure before making edits.",
    inputSchema: z.object({}),
    execute: () => {
      const lines = context.currentMarkdown.split("\n");
      const numberedContent = lines
        .map((line, i) => `${i + 1}: ${line}`)
        .join("\n");

      return {
        content: numberedContent,
        lineCount: lines.length,
      };
    },
  });
}
