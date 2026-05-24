import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { PageContainer } from "@/components/layout/container";
import { SchedulePageSkeleton } from "./skeleton";

export default function Loading() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Schedules</h1>
            <p className="text-muted-foreground">
              Configure cron schedules that run daily, weekly, or monthly
            </p>
          </div>
          <Button variant="default">
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            <span className="ml-1">New Schedule</span>
          </Button>
        </div>
        <SchedulePageSkeleton />
      </div>
    </PageContainer>
  );
}
