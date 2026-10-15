"use client";

import {
  Alert02Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Undo02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@notra/ui/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@notra/ui/components/ui/alert-dialog";
import { Badge } from "@notra/ui/components/ui/badge";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId, useState } from "react";
import { useFormatter, useTranslations } from "use-intl";

import { Button } from "@/components/button";
import {
  CONTENT_HISTORY_SHELL_CLASSNAME as SHELL_CLASSNAME,
  CONTENT_HISTORY_PANEL_CLASSNAME as PANEL_CLASSNAME,
  CONTENT_HISTORY_SKELETON_ROWS as SKELETON_ROWS,
} from "@/constants/content-history";
import { useContentHistory } from "@/lib/hooks/use-content-history";
import { useSiteCodeHighlighter } from "@/lib/hooks/use-site-code-highlighter";
import type {
  ContentHistoryComparisonProps,
  ContentHistoryListProps,
  ContentHistoryProps,
} from "@/types/content/history";
import lazyComponent from "@/utils/lazy-component";

function VersionLoading() {
  const t = useTranslations("content.history");
  return (
    <p className="text-muted-foreground px-3 py-2.5 text-xs" role="status">
      {t("loadingVersion")}
    </p>
  );
}

const SiteFileDiff = lazyComponent(
  () =>
    import("@/components/sites/editor/site-file-diff").then((module) => ({
      default: module.SiteFileDiff,
    })),
  { loading: VersionLoading }
);

function ContentHistoryList({
  history,
  versionId,
  setVersionId,
  restore,
  needsRefresh,
  currentRevision,
  currentTitle,
}: ContentHistoryListProps) {
  const t = useTranslations("content.history");
  const format = useFormatter();
  const headingId = useId();
  const items = history.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <section aria-labelledby={headingId} className={SHELL_CLASSNAME}>
      <header className="flex items-center justify-between gap-3 px-2.5 py-2">
        <h3 className="text-foreground text-xs font-medium" id={headingId}>
          {t("versions")}
        </h3>
      </header>
      <div className={PANEL_CLASSNAME}>
        {history.isPending ? (
          <div className="space-y-3 px-3 py-3" role="status">
            <span className="sr-only">{t("loading")}</span>
            {SKELETON_ROWS.map((row) => (
              <div className="flex items-start gap-3" key={row}>
                <Skeleton className="mt-1 size-2 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {history.isError ? (
          <div
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
            role="alert"
          >
            <p className="text-muted-foreground min-w-0 flex-1 text-sm">
              {t("loadFailed")}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void history.refetch();
              }}
            >
              {t("retry")}
            </Button>
          </div>
        ) : null}
        {history.data?.pages[0]?.items.length === 0 ? (
          <p className="text-muted-foreground px-3 py-2.5 text-sm">
            {t("empty")}
          </p>
        ) : null}
        {items.length ? (
          <ol
            className="max-h-80 overflow-y-auto overscroll-contain py-1"
            aria-label={t("versions")}
          >
            {items.map((item) => {
              const isCurrent = item.revision === currentRevision;
              const showTitle = item.title !== currentTitle;
              return (
                <li className="group/item relative" key={item.id}>
                  <span
                    aria-hidden="true"
                    className="bg-border pointer-events-none absolute top-0 bottom-0 left-[15.5px] z-1 w-px group-first/item:top-5 group-last/item:bottom-auto group-last/item:h-5 group-only/item:hidden"
                  />
                  <button
                    className="group/version hover:bg-muted/50 focus-visible:ring-ring aria-pressed:bg-muted relative flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                    type="button"
                    aria-pressed={versionId === item.id}
                    aria-current={isCurrent ? "true" : undefined}
                    onClick={() => {
                      setVersionId(item.id);
                      restore.reset();
                    }}
                    disabled={restore.isPending || needsRefresh}
                  >
                    <span
                      aria-hidden="true"
                      className="border-muted-foreground/40 bg-background group-aria-pressed/version:border-primary group-aria-pressed/version:bg-primary relative z-2 mt-1.5 size-2 shrink-0 rounded-full border transition-colors motion-reduce:transition-none"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="text-sm font-medium tabular-nums">
                          {t("revision", { revision: item.revision })}
                        </span>
                        {isCurrent ? (
                          <Badge shape="rounded" size="sm" variant="outline">
                            {t("current")}
                          </Badge>
                        ) : null}
                        {item.retained ? (
                          <Badge shape="rounded" size="sm" variant="secondary">
                            {t("retained")}
                          </Badge>
                        ) : null}
                        <time
                          className="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums"
                          dateTime={item.createdAt}
                        >
                          {format.dateTime(new Date(item.createdAt), {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </time>
                      </span>
                      <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                        {t(`sources.${item.source}`)} ·{" "}
                        {item.actor?.name ?? t("unknownActor")}
                      </span>
                      {showTitle ? (
                        <span
                          className="text-muted-foreground block truncate text-xs"
                          title={item.title}
                        >
                          {item.title}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : null}
        {history.hasNextPage ? (
          <div className="border-t p-1">
            <Button
              className="w-full"
              size="sm"
              variant="ghost"
              loading={history.isFetchingNextPage}
              disabled={history.isFetchingNextPage}
              onClick={() => {
                void history.fetchNextPage();
              }}
            >
              {t("loadMore")}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ContentHistory(props: ContentHistoryProps) {
  const t = useTranslations("content.history");
  const highlighterReady = useSiteCodeHighlighter();
  const {
    history,
    selected,
    versionId,
    setVersionId,
    restore,
    canRestore,
    canRefresh,
    needsRefresh,
  } = useContentHistory(props);
  const [confirm, setConfirm] = useState(false);
  const version = selected.data?.version;
  const currentRevision = props.content.revision;
  const hasUnsavedWork = props.document.hasChanges || props.document.isSaving;

  return (
    <div className="space-y-4 pb-2">
      {hasUnsavedWork ? (
        <Alert role="status">
          <HugeiconsIcon
            aria-hidden="true"
            icon={InformationCircleIcon}
            strokeWidth={1.75}
          />
          <AlertDescription>{t("saveFirst")}</AlertDescription>
        </Alert>
      ) : null}
      <ContentHistoryList
        history={history}
        versionId={versionId}
        setVersionId={setVersionId}
        restore={restore}
        needsRefresh={needsRefresh}
        currentRevision={currentRevision}
        currentTitle={props.document.title}
      />
      {selected.isFetching && versionId && !version ? (
        <div className={SHELL_CLASSNAME}>
          <div className="px-2.5 py-2">
            <Skeleton className="h-3.5 w-40" />
          </div>
          <div className={PANEL_CLASSNAME}>
            <VersionLoading />
          </div>
        </div>
      ) : null}
      {selected.isError ? (
        <Alert variant="destructive">
          <HugeiconsIcon
            aria-hidden="true"
            icon={Alert02Icon}
            strokeWidth={1.5}
          />
          <AlertTitle>{t("versionFailed")}</AlertTitle>
          <div className="text-foreground col-start-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void selected.refetch();
              }}
            >
              {t("retry")}
            </Button>
          </div>
        </Alert>
      ) : null}
      {version ? (
        <ContentHistoryComparison
          version={version}
          fetching={selected.isFetching}
          highlighterReady={highlighterReady}
          currentRevision={currentRevision}
          currentMarkdown={props.document.currentMarkdown}
          hasUnsavedWork={hasUnsavedWork}
          restore={restore}
          canRestore={canRestore}
          onConfirmRestore={() => setConfirm(true)}
        />
      ) : null}
      {restore.isError ? (
        <Alert variant="destructive">
          <HugeiconsIcon
            aria-hidden="true"
            icon={Alert02Icon}
            strokeWidth={1.5}
          />
          <AlertTitle>{t("restoreFailed")}</AlertTitle>
          <AlertDescription className="wrap-anywhere">
            {restore.error.message}
          </AlertDescription>
          {needsRefresh ? (
            <div className="text-foreground col-start-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!canRefresh}
                onClick={() => restore.mutate()}
              >
                {t("loadRestored")}
              </Button>
            </div>
          ) : null}
        </Alert>
      ) : null}
      {restore.isSuccess ? (
        <Alert role="status" variant="success">
          <HugeiconsIcon
            aria-hidden="true"
            icon={CheckmarkCircle02Icon}
            strokeWidth={1.75}
          />
          <AlertDescription>{t("restored")}</AlertDescription>
        </Alert>
      ) : null}
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <Button
              disabled={!canRestore}
              onClick={() => {
                setConfirm(false);
                restore.mutate();
              }}
            >
              {t("restore")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ContentHistoryComparison({
  version,
  fetching,
  highlighterReady,
  currentRevision,
  currentMarkdown,
  hasUnsavedWork,
  restore,
  canRestore,
  onConfirmRestore,
}: ContentHistoryComparisonProps) {
  const t = useTranslations("content.history");
  const compareHeadingId = useId();
  let restoreContext: string | null = t("restoreHint");
  if (version.revision === currentRevision) {
    restoreContext = t("currentSelected");
  } else if (hasUnsavedWork) {
    restoreContext = null;
  }
  return (
    <section aria-labelledby={compareHeadingId} className={SHELL_CLASSNAME}>
      <header className="flex min-w-0 items-center gap-2 px-2.5 py-2">
        <h3
          className="text-foreground min-w-0 truncate text-xs font-medium"
          id={compareHeadingId}
        >
          {t("compare")}
        </h3>
        <Badge shape="rounded" size="sm" variant="secondary">
          {t("revision", { revision: version.revision })}
        </Badge>
        {fetching ? (
          <span
            className="text-muted-foreground ml-auto shrink-0 text-xs"
            role="status"
          >
            {t("loadingVersion")}
          </span>
        ) : null}
      </header>
      <div className={PANEL_CLASSNAME}>
        <dl className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-x-4 gap-y-1.5 px-3 py-2.5 text-xs">
          <dt className="text-muted-foreground">{t("title")}</dt>
          <dd className="font-medium wrap-anywhere">{version.title}</dd>
          <dt className="text-muted-foreground">{t("slug")}</dt>
          <dd className="font-mono wrap-anywhere">{version.slug ?? "—"}</dd>
        </dl>
        <details className="group/metadata border-t">
          <summary className="hover:bg-muted/50 focus-visible:ring-ring flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
            <HugeiconsIcon
              aria-hidden="true"
              className="text-muted-foreground size-3.5 transition-transform duration-200 group-open/metadata:rotate-90 motion-reduce:transition-none"
              icon={ArrowRight01Icon}
              strokeWidth={2}
            />
            {t("metadata")}
          </summary>
          <pre className="bg-muted/40 max-h-64 overflow-auto overscroll-contain border-t px-3 py-2.5 font-mono text-xs">
            {JSON.stringify(version.metadata, null, 2)}
          </pre>
        </details>
        <div className="border-t">
          <p className="text-muted-foreground px-3 pt-2.5 pb-1.5 text-xs text-pretty">
            {t("compareDescription")}
          </p>
          {highlighterReady ? (
            <SiteFileDiff
              path="document.md"
              before={version.markdown ?? ""}
              after={currentMarkdown}
            />
          ) : (
            <VersionLoading />
          )}
        </div>
      </div>
      <footer className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 px-2.5 pt-2 pb-1.5">
        {restore.isPending ? (
          <p
            className="text-muted-foreground min-w-0 flex-1 text-xs"
            role="status"
          >
            {t("restoring")}
          </p>
        ) : (
          <p className="text-muted-foreground min-w-0 flex-1 text-xs text-pretty">
            {restoreContext}
          </p>
        )}
        <Button
          size="sm"
          disabled={!canRestore}
          loading={restore.isPending}
          onClick={onConfirmRestore}
        >
          <HugeiconsIcon
            data-icon="inline-start"
            icon={Undo02Icon}
            strokeWidth={2}
          />
          {t("restore")}
        </Button>
      </footer>
    </section>
  );
}
