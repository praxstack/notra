import type { z } from "zod";

import type {
  contentHistoryEntrySchema,
  contentHistoryVersionSchema,
} from "../../schemas/dashboard/content-history";

export type ContentHistoryEntry = z.infer<typeof contentHistoryEntrySchema>;
export type ContentHistoryVersion = z.infer<typeof contentHistoryVersionSchema>;
