export function HatchPattern({
  className = "",
  spacing = 16,
}: {
  className?: string;
  spacing?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        backgroundImage: `repeating-linear-gradient(
          45deg,
          var(--color-border) 0px,
          var(--color-border) 1px,
          transparent 1px,
          transparent ${spacing}px
        )`,
        opacity: 0.6,
      }}
    />
  );
}
