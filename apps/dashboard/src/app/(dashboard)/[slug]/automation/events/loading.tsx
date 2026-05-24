import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { EventsPageSkeleton } from "@/components/automation/events-skeleton";
import { PageContainer } from "@/components/layout/container";

export default function Loading() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Events</h1>
            <p className="text-muted-foreground">
              React to GitHub activity and trigger content generation
              automatically
            </p>
          </div>
          <Button variant="default">
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            <span className="ml-1">New Event Trigger</span>
          </Button>
        </div>
        <EventsPageSkeleton />
      </div>
    </PageContainer>
  );
}
