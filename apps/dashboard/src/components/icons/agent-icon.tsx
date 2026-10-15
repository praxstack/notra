import { cn } from "@notra/ui/lib/utils";

const DOTS = [
  { cx: 12, cy: 12, r: 2.9 },
  { cx: 12, cy: 5, r: 2.1 },
  { cx: 19, cy: 12, r: 2.1 },
  { cx: 12, cy: 19, r: 2.1 },
  { cx: 5, cy: 12, r: 2.1 },
  { cx: 5, cy: 5, r: 1.35 },
  { cx: 19, cy: 5, r: 1.35 },
  { cx: 19, cy: 19, r: 1.35 },
  { cx: 5, cy: 19, r: 1.35 },
];

export function AgentIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={cn("size-4 shrink-0", className)}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {DOTS.map((dot) => (
        <circle key={`${dot.cx}-${dot.cy}`} {...dot} />
      ))}
    </svg>
  );
}
