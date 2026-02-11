import { NotraWordmarkSvg } from "./notra-wordmark-svg";

type NotraWordmarkProps = {
  className?: string;
};

export function NotraWordmark({ className = "" }: NotraWordmarkProps) {
  return (
    <div
      className={`relative flex w-full items-center justify-center ${className}`}
    >
      <NotraWordmarkSvg className="block h-auto w-full text-foreground/40" />
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-10 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
