"use client";

import Image from "next/image";
import Link from "next/link";
import { ActivityFeed } from "../components/activity-feed";
import CTASection from "../components/cta-section";
import DocumentationSection from "../components/documentation-section";
import EffortlessIntegration from "../components/effortless-integration-updated";
import FAQSection from "../components/faq-section";
import FooterSection from "../components/footer-section";
import { NotraMark } from "../components/notra-mark";
import NumbersThatSpeak from "../components/numbers-that-speak";
import PricingSection from "../components/pricing-section";
import TestimonialsSection from "../components/testimonials-section";
import YourWorkInSync from "../components/your-work-in-sync";
import { SOCIAL_PROOF_LOGOS } from "../utils/constants";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-start overflow-x-hidden bg-background">
      <div className="relative flex w-full flex-col items-center justify-start">
        <div className="relative flex min-h-screen w-full max-w-none flex-col items-start justify-start px-4 sm:px-6 md:px-8 lg:w-[1060px] lg:max-w-[1060px] lg:px-0">
          <div className="absolute top-0 left-4 z-0 h-full w-px bg-border shadow-[1px_0px_0px_white] sm:left-6 md:left-8 lg:left-0" />

          <div className="absolute top-0 right-4 z-0 h-full w-px bg-border shadow-[1px_0px_0px_white] sm:right-6 md:right-8 lg:right-0" />

          <div className="relative z-10 flex flex-col items-center justify-center gap-4 self-stretch overflow-hidden border-border/70 border-b pt-[9px] sm:gap-6 md:gap-8 lg:gap-[66px]">
            <div className="absolute top-0 left-0 z-20 flex h-12 w-full items-center justify-center px-6 sm:h-14 sm:px-8 md:h-16 md:px-12 lg:h-[84px] lg:px-0">
              <div className="relative z-30 flex h-10 w-full max-w-[calc(100%-32px)] items-center justify-between overflow-hidden rounded-lg bg-background px-3 py-1.5 pr-2 shadow-[0px_0px_0px_2px_white] backdrop-blur-sm sm:h-11 sm:max-w-[calc(100%-48px)] sm:px-4 sm:py-2 sm:pr-3 md:h-12 md:max-w-[calc(100%-64px)] md:px-4 lg:w-[960px] lg:max-w-[960px]">
                <div className="flex items-center justify-center">
                  <Link
                    className="flex items-center justify-start gap-2"
                    href="/"
                  >
                    <div className="flex items-center justify-center text-[#8E51FF]">
                      <NotraMark
                        className="h-7 w-7 shrink-0"
                        strokeWidth={40}
                      />
                    </div>
                    <div className="flex flex-col justify-center font-medium font-sans text-foreground text-sm leading-5 sm:text-base md:text-lg lg:text-xl">
                      Notra
                    </div>
                  </Link>
                  <div className="flex flex-row items-start justify-start gap-2 pl-3 sm:flex sm:gap-3 sm:pl-4 md:gap-4 md:pl-5 lg:gap-4 lg:pl-5">
                    <Link
                      className="flex items-center justify-start"
                      href="#features"
                    >
                      <div className="flex flex-col justify-center font-medium font-sans text-foreground/80 text-xs leading-[14px] transition-colors hover:text-foreground md:text-[13px]">
                        Features
                      </div>
                    </Link>
                    <Link
                      className="flex items-center justify-start"
                      href="#pricing"
                    >
                      <div className="flex flex-col justify-center font-medium font-sans text-foreground/80 text-xs leading-[14px] transition-colors hover:text-foreground md:text-[13px]">
                        Pricing
                      </div>
                    </Link>
                  </div>
                </div>
                <div className="flex h-6 items-start justify-start gap-2 sm:h-7 sm:gap-3 md:h-8">
                  <Link
                    className="inline-flex items-center justify-center overflow-hidden border border-transparent bg-white px-2 py-1 shadow-[0px_1px_2px_rgba(55,50,47,0.12)] hover:bg-muted sm:px-3 sm:py-[6px] md:px-[14px]"
                    href="https://app.usenotra.com"
                  >
                    <span className="flex flex-col justify-center font-medium font-sans text-primary text-xs leading-5 md:text-[13px]">
                      Log in
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col items-center justify-start px-2 pt-16 pr-0 pb-8 pl-0 sm:px-4 sm:pt-20 sm:pr-0 sm:pb-12 sm:pl-0 md:px-8 md:pt-24 md:pb-16 lg:px-0 lg:pt-[216px]">
              <div className="flex w-full max-w-[937px] flex-col items-center justify-center gap-3 sm:gap-4 md:gap-5 lg:w-[937px] lg:gap-6">
                <div className="flex flex-col items-center justify-center gap-4 self-stretch rounded-[3px] sm:gap-5 md:gap-6 lg:gap-8">
                  <div className="flex w-full max-w-[748.71px] flex-col justify-center px-2 text-center font-normal font-serif text-[32px] text-foreground xs:text-[36px] leading-[1.1] sm:px-4 sm:text-[42px] sm:leading-[1.15] md:px-0 md:text-[52px] md:leading-[1.2] lg:w-[748.71px] lg:text-[80px] lg:leading-24">
                    Turn your daily work
                    <br />
                    into publish-ready content
                  </div>
                  <div className="flex w-full max-w-[506.08px] flex-col justify-center px-2 text-center font-medium font-sans text-foreground/80 text-sm leading-[1.4] sm:px-4 sm:text-lg sm:leading-[1.45] md:px-0 md:text-xl md:leading-normal lg:w-[506.08px] lg:text-lg lg:leading-7">
                    Now in public beta. Notra connects to GitHub, Linear,
                    <br className="hidden sm:block" />
                    and Slack to turn shipped work into ready-to-publish
                    content.
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-6 flex w-full max-w-[497px] flex-col items-center justify-center gap-6 sm:mt-8 sm:gap-8 md:mt-10 md:gap-10 lg:mt-12 lg:w-[497px] lg:gap-12">
                <div className="flex items-center justify-start gap-4 backdrop-blur-[8.25px]">
                  <Link
                    className="inline-flex h-10 items-center justify-center overflow-hidden border border-transparent bg-primary px-6 py-2 shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] hover:bg-primary-hover sm:h-11 sm:px-8 sm:py-[6px] md:h-12 md:px-10 lg:px-12"
                    href="https://app.usenotra.com"
                  >
                    <span className="flex flex-col justify-center font-medium font-sans text-primary-foreground text-sm leading-5 sm:text-base md:text-[15px]">
                      Start for free
                    </span>
                  </Link>
                </div>
              </div>

              <div className="mt-8 hidden items-stretch justify-center self-stretch border-border border-y sm:mt-10 md:mt-12 md:flex lg:mt-14">
                <div className="relative w-4 overflow-hidden sm:w-6 md:w-8 lg:w-12">
                  <div className="absolute top-[-120px] left-[-40px] flex w-[120px] flex-col items-start justify-start sm:left-[-50px] sm:w-[140px] md:left-[-58px] md:w-[162px]">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        className="h-3 origin-top-right rotate-45 self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px] sm:h-4"
                        key={i}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative z-5 flex max-w-[960px] flex-1 flex-col">
                  <div className="flex aspect-video w-full max-w-[960px] flex-col items-start justify-start overflow-hidden rounded-[6px] bg-card shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08)] sm:rounded-[8px] lg:rounded-[9.06px]">
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="h-full w-full"
                      referrerPolicy="strict-origin-when-cross-origin"
                      src="https://www.youtube.com/embed/vAPVCCayBIA?rel=0"
                      title="Notra product demo"
                    />
                  </div>
                </div>

                <div className="relative w-4 overflow-hidden sm:w-6 md:w-8 lg:w-12">
                  <div className="absolute top-[-120px] right-[-40px] flex w-[120px] flex-col items-start justify-start sm:right-[-50px] sm:w-[140px] md:right-[-58px] md:w-[162px]">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        className="h-3 origin-top-right rotate-45 self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px] sm:h-4"
                        key={i}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <section
                className="flex w-full flex-col items-center justify-center border-border border-b"
                id="social-proof"
              >
                <div className="flex items-center justify-center gap-6 self-stretch border-border border-b px-4 py-8 sm:px-6 sm:py-12 md:px-24 md:py-16">
                  <div className="flex w-full max-w-[586px] flex-col items-center justify-start gap-3 overflow-hidden rounded-lg px-4 py-4 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] sm:gap-4 sm:px-6 sm:py-5">
                    <div className="w-full max-w-[472.55px] text-center font-sans font-semibold text-foreground text-xl leading-tight tracking-tight sm:text-2xl md:text-3xl md:leading-[60px] lg:text-5xl">
                      Teams that ship faster, write less
                      <span className="text-primary">.</span>
                    </div>
                    <div className="self-stretch text-center font-normal font-sans text-muted-foreground text-sm leading-6 sm:text-base sm:leading-7">
                      People at these companies use Notra to keep their
                      <br className="hidden sm:block" />
                      audience in the loop without slowing down development.
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-center self-stretch">
                  <div className="relative w-4 self-stretch overflow-hidden sm:w-6 md:w-8 lg:w-12">
                    <div className="absolute top-[-120px] left-[-40px] flex w-[120px] flex-col items-start justify-start sm:left-[-50px] sm:w-[140px] md:left-[-58px] md:w-[162px]">
                      {Array.from({ length: 50 }).map((_, i) => (
                        <div
                          className="-rotate-45 h-3 origin-top-left self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px] sm:h-4"
                          key={i}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-wrap border-border border-r border-l">
                    {SOCIAL_PROOF_LOGOS.map((logo, index) => (
                      <a
                        className={`flex h-24 items-center justify-center gap-2 transition-opacity hover:opacity-80 sm:h-32 md:h-36 lg:h-40 ${
                          index < SOCIAL_PROOF_LOGOS.length - 1
                            ? "border-r-[0.5px]"
                            : ""
                        }`}
                        href={logo.href}
                        key={logo.name}
                        rel="noopener noreferrer"
                        style={{
                          flexBasis: `${100 / Math.min(SOCIAL_PROOF_LOGOS.length, 4)}%`,
                        }}
                        target="_blank"
                      >
                        {logo.type === "wordmark" ? (
                          <Image
                            alt={logo.name}
                            className="h-5 w-auto opacity-80 sm:h-6 md:h-7"
                            height={28}
                            src={logo.src}
                            width={120}
                          />
                        ) : (
                          <>
                            <Image
                              alt={logo.name}
                              className="h-5 w-5 sm:h-6 sm:w-6"
                              height={24}
                              src={logo.src}
                              width={24}
                            />
                            <span className="font-medium font-sans text-foreground text-sm leading-tight sm:text-base md:text-lg">
                              {logo.name}
                            </span>
                          </>
                        )}
                      </a>
                    ))}
                  </div>

                  <div className="relative w-4 self-stretch overflow-hidden sm:w-6 md:w-8 lg:w-12">
                    <div className="absolute top-[-120px] left-[-40px] flex w-[120px] flex-col items-start justify-start sm:left-[-50px] sm:w-[140px] md:left-[-58px] md:w-[162px]">
                      {Array.from({ length: 50 }).map((_, i) => (
                        <div
                          className="-rotate-45 h-3 origin-top-left self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px] sm:h-4"
                          key={i}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section
                className="flex w-full flex-col items-center justify-center border-border border-b"
                id="features"
              >
                <div className="flex items-center justify-center gap-6 self-stretch border-border border-b px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16 lg:w-[1060px] lg:max-w-[1060px] lg:px-0">
                  <div className="flex w-full max-w-[616px] flex-col items-center justify-start gap-3 overflow-hidden rounded-lg px-4 py-4 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] sm:gap-4 sm:px-6 sm:py-5 lg:w-[616px]">
                    <div className="w-full max-w-[598.06px] text-center font-sans font-semibold text-foreground text-xl leading-tight tracking-tight sm:text-2xl md:text-3xl md:leading-[60px] lg:w-[598.06px] lg:text-5xl">
                      Your team ships<span className="text-primary">.</span>{" "}
                      Notra writes it up
                      <span className="text-primary">.</span>
                    </div>
                    <div className="self-stretch text-center font-normal font-sans text-muted-foreground text-sm leading-6 sm:text-base sm:leading-7">
                      Notra watches your team's activity in the background
                      <br />
                      and drafts content that matches your brand voice.
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-center self-stretch">
                  <div className="relative w-4 self-stretch overflow-hidden sm:w-6 md:w-8 lg:w-12">
                    <div className="absolute top-[-120px] left-[-40px] flex w-[120px] flex-col items-start justify-start sm:left-[-50px] sm:w-[140px] md:left-[-58px] md:w-[162px]">
                      {Array.from({ length: 200 }).map((_, i) => (
                        <div
                          className="-rotate-45 h-3 origin-top-left self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px] sm:h-4"
                          key={i}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid flex-1 grid-cols-1 gap-0 border-border border-r border-l md:grid-cols-2">
                    <div className="flex flex-col items-start justify-start gap-4 border-border border-r-0 border-b p-4 sm:gap-6 sm:p-6 md:border-r md:p-8 lg:p-12">
                      <div className="flex flex-col gap-2">
                        <h3 className="font-sans font-semibold text-foreground text-lg leading-tight sm:text-xl">
                          Activity feed
                        </h3>
                        <p className="font-normal font-sans text-muted-foreground text-sm leading-relaxed md:text-base">
                          Every PR, issue, and conversation lands in one
                          organized timeline your whole team can read.
                        </p>
                      </div>
                      <div className="relative flex w-full items-end justify-center overflow-hidden rounded-lg pt-4">
                        <ActivityFeed />
                        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-linear-to-t from-background to-transparent" />
                      </div>
                    </div>

                    <div className="flex flex-col items-start justify-start gap-4 border-border border-b p-4 sm:gap-6 sm:p-6 md:p-8 lg:p-12">
                      <div className="flex flex-col gap-2">
                        <h3 className="font-sans font-semibold text-foreground text-lg leading-tight sm:text-xl">
                          Brand voice matching
                        </h3>
                        <p className="font-normal font-sans text-muted-foreground text-sm leading-relaxed md:text-base">
                          Notra learns your tone and style so every draft sounds
                          like your team wrote it.
                        </p>
                      </div>
                      <div className="flex h-[200px] w-full items-center justify-center overflow-hidden rounded-lg text-right sm:h-[250px] md:h-[300px]">
                        <YourWorkInSync
                          className="scale-60 sm:scale-75 md:scale-90"
                          height="250"
                          theme="light"
                          width="400"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-start justify-start gap-4 border-border border-r-0 bg-transparent p-4 sm:gap-6 sm:p-6 md:border-r md:p-8 lg:p-12">
                      <div className="flex flex-col gap-2">
                        <h3 className="font-sans font-semibold text-foreground text-lg leading-tight sm:text-xl">
                          One-click integrations
                        </h3>
                        <p className="font-normal font-sans text-muted-foreground text-sm leading-relaxed md:text-base">
                          GitHub, Linear, Slack, and more plug in with a single
                          click. You'll be connected in under a minute.
                        </p>
                      </div>
                      <div className="relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-lg bg-transparent sm:h-[250px] md:h-[300px]">
                        <div className="flex h-full w-full items-center justify-center bg-transparent">
                          <EffortlessIntegration
                            className="max-h-full max-w-full"
                            height={250}
                            width={400}
                          />
                        </div>
                        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-linear-to-t from-background to-transparent" />
                      </div>
                    </div>

                    <div className="flex flex-col items-start justify-start gap-4 p-4 sm:gap-6 sm:p-6 md:p-8 lg:p-12">
                      <div className="flex flex-col gap-2">
                        <h3 className="font-sans font-semibold text-foreground text-lg leading-tight sm:text-xl">
                          Content performance
                        </h3>
                        <p className="font-normal font-sans text-muted-foreground text-sm leading-relaxed md:text-base">
                          See which posts get traction and what your audience
                          responds to across every channel.
                        </p>
                      </div>
                      <div className="relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-lg sm:h-[250px] md:h-[300px]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <NumbersThatSpeak
                            className="h-full w-full object-contain"
                            height="100%"
                            theme="light"
                            width="100%"
                          />
                        </div>
                        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-linear-to-t from-background to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                          <div className="flex flex-col items-center gap-2 p-4">
                            <div className="h-full w-3/4 rounded-full bg-green-500" />
                          </div>
                          <div className="text-green-600 text-sm">
                            Growth Rate
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative w-4 self-stretch overflow-hidden sm:w-6 md:w-8 lg:w-12">
                    <div className="absolute top-[-120px] left-[-40px] flex w-[120px] flex-col items-start justify-start sm:left-[-50px] sm:w-[140px] md:left-[-58px] md:w-[162px]">
                      {Array.from({ length: 200 }).map((_, i) => (
                        <div
                          className="-rotate-45 h-3 origin-top-left self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px] sm:h-4"
                          key={i}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="w-full" id="documentation">
                <DocumentationSection />
              </section>

              <section className="w-full" id="testimonials">
                <TestimonialsSection />
              </section>

              <section className="w-full" id="pricing">
                <PricingSection />
              </section>

              <section className="w-full" id="faq">
                <FAQSection />
              </section>

              <section className="w-full" id="cta">
                <CTASection />
              </section>

              <section className="w-full" id="footer">
                <FooterSection />
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
