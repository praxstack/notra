import type { useContentHistory } from "@/lib/hooks/use-content-history";
import type { ContentDetailToolbarProps } from "@/types/components/content-detail-toolbar";

export type ContentDocumentProps = Pick<
  ContentDetailToolbarProps,
  "content" | "contentId" | "document" | "organizationId"
>;

export type ContentCollaborationProps = ContentDocumentProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type ContentHistoryProps = ContentDocumentProps & {
  onRestoreBusyChange: (busy: boolean) => void;
  active?: boolean;
};

export type ContentHistoryListProps = Pick<
  ReturnType<typeof useContentHistory>,
  "history" | "versionId" | "setVersionId" | "restore" | "needsRefresh"
> & {
  currentRevision: number;
  currentTitle: string;
};

export type ContentSaveConflictProps = Pick<ContentDocumentProps, "document">;

export type ContentHistoryComparisonProps = Pick<
  ReturnType<typeof useContentHistory>,
  "restore" | "canRestore"
> & {
  version: NonNullable<
    ReturnType<typeof useContentHistory>["selected"]["data"]
  >["version"];
  fetching: boolean;
  highlighterReady: boolean;
  currentRevision: number;
  currentMarkdown: string;
  hasUnsavedWork: boolean;
  onConfirmRestore: () => void;
};

export type ContentSaveConflictResolution = "saveMine" | "loadLatest";
