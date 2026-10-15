"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@notra/ui/components/ui/sheet";
import { useState } from "react";
import { useTranslations } from "use-intl";

import type { ContentCollaborationProps } from "@/types/content/history";
import lazyComponent from "@/utils/lazy-component";

function CollaborationLoading() {
  const t = useTranslations("content.collaboration");
  return (
    <p className="text-muted-foreground py-2 text-sm" role="status">
      {t("loading")}
    </p>
  );
}

const ContentHistory = lazyComponent(
  () =>
    import("@/components/content/content-history").then((module) => ({
      default: module.ContentHistory,
    })),
  { loading: CollaborationLoading }
);

export function ContentCollaboration(props: ContentCollaborationProps) {
  const t = useTranslations("content.collaboration");
  const [hasOpened, setHasOpened] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const open = props.open;
  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        if (!restoring) {
          setHasOpened(true);
          props.onOpenChange(value);
        }
      }}
    >
      <SheetContent
        keepMounted
        variant="inset"
        className="data-[side=right]:sm:max-w-3xl"
      >
        <SheetHeader>
          <SheetTitle>{t("history")}</SheetTitle>
          <SheetDescription>{t("historyDescription")}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          {hasOpened || open ? (
            <ContentHistory
              {...props}
              active={open}
              onRestoreBusyChange={setRestoring}
              key={props.contentId}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
