export function FeatureCard({
  title,
  description,
  isActive,
  progress,
  onClick,
}: {
  title: string;
  description: string;
  isActive: boolean;
  progress: number;
  onClick: () => void;
}) {
  return (
    <div
      className={`relative flex w-full cursor-pointer flex-col items-start justify-start gap-2 self-stretch overflow-hidden border-b px-6 py-5 last:border-b-0 md:flex-1 md:border-b-0 ${
        isActive
          ? "bg-white shadow-[0px_0px_0px_0.75px_#E0DEDB_inset]"
          : "border-[#E0DEDB]/80 border-r-0 border-l-0 md:border"
      }`}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute top-0 left-0 h-0.5 w-full bg-[rgba(50,45,43,0.08)]">
          <div
            className="h-full bg-[#322D2B] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex flex-col justify-center self-stretch font-sans font-semibold text-[#49423D] text-sm leading-6 md:text-sm md:leading-6">
        {title}
      </div>
      <div className="self-stretch font-normal font-sans text-[#605A57] text-[13px] leading-[22px] md:text-[13px] md:leading-[22px]">
        {description}
      </div>
    </div>
  );
}
