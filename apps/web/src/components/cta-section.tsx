"use client";

export default function CTASection() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden">
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-6 self-stretch border-[rgba(55,50,47,0.12)] border-t border-b px-6 py-12 md:px-24 md:py-12">
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <div className="relative h-full w-full">
            {Array.from({ length: 300 }).map((_, i) => (
              <div
                className="absolute h-4 w-full origin-top-left rotate-[-45deg] outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                key={i}
                style={{
                  top: `${i * 16 - 120}px`,
                  left: "-100%",
                  width: "300%",
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-20 flex w-full max-w-[586px] flex-col items-center justify-start gap-6 overflow-hidden rounded-lg px-6 py-5 md:py-8">
          <div className="flex flex-col items-start justify-start gap-3 self-stretch">
            <div className="flex flex-col justify-center self-stretch text-center font-sans font-semibold text-3xl text-[#49423D] leading-tight tracking-tight md:text-5xl md:leading-[56px]">
              Ready to transform your business?
            </div>
            <div className="self-stretch text-center font-medium font-sans text-[#605A57] text-base leading-7">
              Join thousands of businesses streamlining their operations,
              <br />
              managing schedules, and growing with data-driven insights.
            </div>
          </div>
          <div className="flex w-full max-w-[497px] flex-col items-center justify-center gap-12">
            <div className="flex items-center justify-start gap-4">
              <div className="relative flex h-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#37322F] px-12 py-[6px] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] transition-colors hover:bg-[#2A2520]">
                <div className="absolute top-0 left-0 h-[41px] w-44 bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply" />
                <div className="flex flex-col justify-center font-medium font-sans text-[13px] text-white leading-5">
                  Start for free
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
