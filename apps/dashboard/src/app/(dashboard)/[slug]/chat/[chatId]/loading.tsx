import { Skeleton } from "@notra/ui/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="relative flex min-h-full flex-col">
          <div className="flex flex-1 flex-col px-4 pt-6 pb-28">
            <div className="mx-auto mt-auto flex w-full max-w-2xl flex-col gap-6">
              <div className="flex justify-end">
                <Skeleton className="h-10 w-48 rounded-2xl" />
              </div>

              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>

              <div className="flex justify-end">
                <Skeleton className="h-10 w-64 rounded-2xl" />
              </div>

              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/6" />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-10 px-4 pt-2 pb-4">
            <div className="pointer-events-none absolute inset-x-0 bottom-full h-8 bg-gradient-to-t from-background to-transparent" />
            <div className="mx-auto w-full max-w-2xl">
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
