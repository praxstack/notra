import type { Metadata } from "next";
import PricingComparisonTable from "../../components/pricing-comparison-table";
import { PricingCards } from "../../components/pricing-section";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose the right Notra plan for your team. Compare features across Free, Pro, and Enterprise tiers.",
};

export default function PricingPage() {
  return (
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b pt-20 sm:pt-24 md:pt-28 lg:pt-32">
      <div className="flex w-full flex-col items-center justify-center gap-2">
        <div className="flex items-center justify-center gap-6 self-stretch px-6 py-12 md:px-24 md:py-16">
          <div className="flex w-full max-w-[586px] flex-col items-center justify-start gap-4">
            <h1 className="self-stretch text-balance text-center font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
              Pick the plan that fits{" "}
              <span className="text-primary">your team</span>
            </h1>

            <div className="self-stretch text-center font-normal font-sans text-base text-muted-foreground leading-7">
              Start generating content for free. Upgrade when you
              <br />
              need more integrations, posts, or team seats.
            </div>
          </div>
        </div>

        <PricingCards />
      </div>

      <div className="w-full border-border border-t">
        <PricingComparisonTable />
      </div>
    </div>
  );
}
