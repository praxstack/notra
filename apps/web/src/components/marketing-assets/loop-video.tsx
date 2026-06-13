"use client";

import { cn } from "@notra/ui/lib/utils";
import { useEffect, useRef, useState } from "react";
import type { LoopVideoProps } from "@/lib/marketing-assets/types/components";

export function LoopVideo({ src, poster, label, className }: LoopVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<
    boolean | null
  >(null);
  const shouldAutoplay = prefersReducedMotion === false;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(media.matches);
    };

    updatePreference();
    media.addEventListener("change", updatePreference);

    return () => {
      media.removeEventListener("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (!shouldAutoplay) {
      video.pause();
      return;
    }

    video.muted = true;
    video.defaultMuted = true;
    const play = () => {
      video.play().catch(() => undefined);
    };
    play();
    video.addEventListener("canplay", play);
    return () => {
      video.removeEventListener("canplay", play);
    };
  }, [shouldAutoplay]);

  return (
    <video
      aria-label={label}
      autoPlay={shouldAutoplay}
      className={cn(
        "corner-squircle block aspect-video w-full rounded-2xl border border-border/60 object-cover shadow-[0_2.5rem_5rem_-2.5rem_rgb(0_0_0/0.45)] supports-[corner-shape:round]:rounded-[1.25rem]",
        className
      )}
      loop={shouldAutoplay}
      muted
      playsInline
      poster={poster}
      preload="metadata"
      ref={videoRef}
      src={src}
    />
  );
}
