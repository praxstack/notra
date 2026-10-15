import { sanitizeMarkdownHtml } from "@notra/ai/utils/sanitize";
import type { posts } from "@notra/db/schema";
import { postMetadataUpdateData } from "@notra/db/utils/post-metadata";
import type {
  ContentHistoryEntry,
  ContentHistoryVersion,
} from "@notra/schemas/types/dashboard/content-history";
import { marked } from "marked";

import type { ContentHistoryRow } from "@/types/content/history-server";

export function serializeContentHistoryEntry(
  row: ContentHistoryRow
): ContentHistoryEntry {
  return {
    id: row.id,
    revision: row.revision,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    source: row.source,
    retained: row.retained,
    actor:
      row.actorUserId && row.actorName
        ? { id: row.actorUserId, name: row.actorName }
        : null,
  };
}

export async function contentHistoryRestoreData(
  version: Pick<ContentHistoryVersion, "title" | "slug" | "metadata"> & {
    markdown: string;
  }
): Promise<Partial<typeof posts.$inferInsert>> {
  return {
    title: version.title,
    slug: version.slug,
    markdown: version.markdown,
    content: sanitizeMarkdownHtml(await marked.parse(version.markdown)),
    recommendations: version.metadata.recommendations,
    contentSubtype: version.metadata.contentSubtype,
    ...postMetadataUpdateData({
      ...version.metadata,
      displayDate: version.metadata.displayDate?.slice(0, 10) ?? null,
    }),
    updatedAt: new Date(),
  };
}
