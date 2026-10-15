"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@notra/ui/components/ui/alert-dialog";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { useState } from "react";
import { useTranslations } from "use-intl";

import { Button } from "@/components/button";
import { ContentCollaboration } from "@/components/content/content-collaboration";
import { PublishContentToGitHubDialog } from "@/components/content/publish-content-to-github-dialog";
import type { ContentDetailToolbarProps } from "@/types/components/content-detail-toolbar";

export function ContentDetailDocumentActions(props: ContentDetailToolbarProps) {
  const { content, contentId, document, organizationId, organizationSlug } =
    props;
  const t = useTranslations("content.toolbar");
  const tActions = useTranslations("common.actions");
  const tCollaboration = useTranslations("content.collaboration");
  const tHeader = useTranslations("content.header");
  const tGitHub = useTranslations("content.githubPublish");
  const [githubOpen, setGithubOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const blocked =
    document.hasSaveConflict ||
    document.isSaving ||
    document.isGeoArticleLoading;
  if (document.hasSaveConflict && (githubOpen || discardOpen)) {
    setGithubOpen(false);
    setDiscardOpen(false);
  }

  return (
    <section aria-label={tHeader("moreActions")} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="min-w-0"
          onClick={() => setHistoryOpen(true)}
          size="sm"
          variant="outline"
        >
          {tCollaboration("history")}
        </Button>
        {content.githubPublish ? (
          <Button
            className="min-w-0"
            nativeButton={false}
            render={
              <a
                href={content.githubPublish.pullRequestUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github aria-hidden="true" />
                <span className="min-w-0 truncate">
                  {tHeader("openPullRequest")}
                </span>
              </a>
            }
            size="sm"
            title={tHeader("openPullRequest")}
            variant="outline"
          />
        ) : (
          <Button
            className="min-w-0"
            disabled={blocked || !document.currentMarkdown.trim()}
            onClick={() => setGithubOpen(true)}
            size="sm"
            variant="outline"
          >
            <Github aria-hidden="true" />
            <span className="min-w-0 truncate">{tGitHub("trigger")}</span>
          </Button>
        )}
      </div>
      {document.hasDocumentChanges && !document.hasSaveConflict ? (
        <Button
          className="w-full justify-start"
          disabled={document.isSaving}
          onClick={() => setDiscardOpen(true)}
          size="sm"
          variant="ghost"
        >
          {t("discardChanges")}
        </Button>
      ) : null}
      <ContentCollaboration
        {...props}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
      {!content.githubPublish &&
      (content.contentType === "blog_post" ||
        content.contentType === "changelog") ? (
        <PublishContentToGitHubDialog
          contentId={contentId}
          contentType={content.contentType}
          githubPublish={null}
          onSave={document.handleSave}
          open={githubOpen}
          onOpenChange={setGithubOpen}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
          title={document.title}
        />
      ) : null}
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("discardChanges")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tHeader("discardDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tActions("cancel")}</AlertDialogCancel>
            <Button
              disabled={document.isSaving}
              variant="destructive"
              onClick={() => {
                document.handleDiscard();
                setDiscardOpen(false);
              }}
            >
              {t("discardChanges")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
