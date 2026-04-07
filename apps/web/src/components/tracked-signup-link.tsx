"use client";

import { track, useFlag } from "@databuddy/sdk/react";
import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import {
  DATABUDDY_SIGNUP_STARTED_EVENT,
  getLandingPageH1Copy,
  LANDING_PAGE_H1_EXPERIMENT_KEY,
  normalizeLandingPageH1Variant,
} from "@/utils/databuddy";

const DEFAULT_SIGNUP_URL = "https://app.usenotra.com/signup";

type TrackedSignupLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  children?: React.ReactNode;
  href?: string;
  source: string;
};

export function TrackedSignupLink({
  children,
  href = DEFAULT_SIGNUP_URL,
  onClick,
  source,
  ...props
}: TrackedSignupLinkProps) {
  const { variant } = useFlag(LANDING_PAGE_H1_EXPERIMENT_KEY);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    track(DATABUDDY_SIGNUP_STARTED_EVENT, {
      destination: href,
      landing_page_h1_copy: getLandingPageH1Copy(variant),
      landing_page_h1_variant: normalizeLandingPageH1Variant(variant),
      source,
    });
  }

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
