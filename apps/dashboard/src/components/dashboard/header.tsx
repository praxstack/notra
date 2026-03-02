import { getCalApi } from "@calcom/embed-react";
import { ArrowRight01Icon, Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@notra/ui/components/ui/breadcrumb";
import { Button } from "@notra/ui/components/ui/button";
import { Separator } from "@notra/ui/components/ui/separator";
import { SidebarTrigger } from "@notra/ui/components/ui/sidebar";
import { useHotkey } from "@tanstack/react-hotkeys";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId } from "react";

const NON_ORG_PATHS: string[] = [];
const SEGMENT_LABELS: Record<string, string> = {
  billing: "Billing & Usage",
};

export function SiteHeader() {
  const pathname = usePathname();
  const id = useId();
  const segments = pathname.split("/").filter(Boolean);

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "15min" });
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, []);

  useHotkey("f", () => {
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-cal-namespace="15min"]'
    );
    btn?.click();
  });

  const isNonOrgPath = NON_ORG_PATHS.some((path) => pathname.startsWith(path));
  const breadcrumbSegments = isNonOrgPath ? segments : segments.slice(1);

  const breadcrumbs = breadcrumbSegments.flatMap((segment, index) => {
    const href = isNonOrgPath
      ? `/${segments.slice(0, index + 1).join("/")}`
      : `/${segments.slice(0, index + 2).join("/")}`;
    const isLast = index === breadcrumbSegments.length - 1;

    const item = (
      <BreadcrumbItem className="hover:underline" key={`${id}-item-${segment}`}>
        <BreadcrumbLink
          render={
            <Link href={href}>
              {SEGMENT_LABELS[segment] ??
                segment.charAt(0).toUpperCase() +
                  segment.slice(1).replace(/-/g, " ")}
            </Link>
          }
        />
      </BreadcrumbItem>
    );

    if (isLast) {
      return [item];
    }

    return [
      item,
      <BreadcrumbSeparator key={`${id}-separator-${segment}`}>
        <HugeiconsIcon icon={ArrowRight01Icon} />
      </BreadcrumbSeparator>,
    ];
  });

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-dashed transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          className="mx-2 border-border border-l border-dashed bg-transparent"
          orientation="vertical"
        />
        <Breadcrumb>
          <BreadcrumbList>{breadcrumbs}</BreadcrumbList>
        </Breadcrumb>
        <Button
          className="ml-auto gap-1.5"
          data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
          data-cal-link="dominikkoch/15min"
          data-cal-namespace="15min"
          size="sm"
          variant="outline"
        >
          <HugeiconsIcon icon={Calendar03Icon} size={16} />
          Book a Call
          <kbd className="pointer-events-none ml-1 hidden select-none rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-muted-foreground text-xs sm:inline-block">
            F
          </kbd>
        </Button>
      </div>
    </header>
  );
}
