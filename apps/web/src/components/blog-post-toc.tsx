"use client";

import { ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  TOC_DEPTHS,
  TOC_PATH_TRACK_WIDTH,
  TOC_SCROLL_LOCK_FALLBACK_MS,
  TOC_SCROLL_OFFSET_PX,
  TOC_STICKY_OFFSET_PX,
} from "@/lib/blog/constants";
import {
  buildTocPath,
  getHeadingId,
  scrollToHeading,
  scrollToTop,
} from "@/lib/blog/toc";
import type { BlogPostTocProps, TocPosition } from "~types/blog";

export function BlogPostToc({ toc }: BlogPostTocProps) {
  const items = useMemo(
    () =>
      toc.filter((item) =>
        (TOC_DEPTHS as readonly number[]).includes(item.depth)
      ),
    [toc]
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [positions, setPositions] = useState<TocPosition[]>([]);
  const [hasScrolled, setHasScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const scrollLockRef = useRef(false);
  const scrollLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function lockScrollSpy() {
    scrollLockRef.current = true;
    if (scrollLockTimerRef.current) {
      clearTimeout(scrollLockTimerRef.current);
    }
    scrollLockTimerRef.current = setTimeout(() => {
      scrollLockRef.current = false;
    }, TOC_SCROLL_LOCK_FALLBACK_MS);
  }

  useEffect(() => {
    function update() {
      const nav = navRef.current;
      if (!nav) {
        return;
      }
      setHasScrolled(nav.getBoundingClientRect().top <= TOC_STICKY_OFFSET_PX);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    function handleScrollEnd() {
      scrollLockRef.current = false;
      if (scrollLockTimerRef.current) {
        clearTimeout(scrollLockTimerRef.current);
        scrollLockTimerRef.current = null;
      }
    }
    if (!("onscrollend" in window)) {
      return;
    }
    window.addEventListener("scrollend", handleScrollEnd);
    return () => window.removeEventListener("scrollend", handleScrollEnd);
  }, []);

  useLayoutEffect(() => {
    function measure() {
      const next: TocPosition[] = [];
      for (const item of items) {
        const id = getHeadingId(item);
        const link = linkRefs.current.get(id);
        if (!link) {
          continue;
        }
        next.push({
          id,
          depth: item.depth,
          top: link.offsetTop,
          height: link.offsetHeight,
        });
      }
      setPositions(next);
    }

    measure();

    const observer = new ResizeObserver(measure);
    const list = listRef.current;
    if (list) {
      observer.observe(list);
    }
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [items]);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }
    const headings = items
      .map((item) => document.getElementById(getHeadingId(item)))
      .filter((element): element is HTMLElement => element !== null);

    if (headings.length === 0) {
      return;
    }

    function update() {
      if (scrollLockRef.current) {
        return;
      }
      const scrollY = window.scrollY + TOC_SCROLL_OFFSET_PX + 8;
      let current: string | null = headings[0]?.id ?? null;
      for (const heading of headings) {
        if (heading.offsetTop <= scrollY) {
          current = heading.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  const lastPosition = positions.at(-1);
  const containerHeight = lastPosition
    ? lastPosition.top + lastPosition.height
    : 0;
  const pathD = buildTocPath(positions);
  const activePos = activeId
    ? (positions.find((p) => p.id === activeId) ?? null)
    : null;
  const clipPath = activePos
    ? `inset(${activePos.top}px 0px ${Math.max(
        0,
        containerHeight - activePos.top - activePos.height
      )}px 0px)`
    : "inset(100% 0px 0px 0px)";

  return (
    <nav aria-label="On this page" className="not-prose" ref={navRef}>
      <p className="mb-3 font-medium font-sans text-foreground text-sm">
        On this page
      </p>
      <div className="relative">
        {positions.length > 0 && containerHeight > 0 ? (
          <>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 text-border"
              height={containerHeight}
              preserveAspectRatio="none"
              viewBox={`0 0 ${TOC_PATH_TRACK_WIDTH} ${containerHeight}`}
              width={TOC_PATH_TRACK_WIDTH}
            >
              <path
                d={pathD}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
              />
            </svg>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 text-foreground transition-[clip-path] duration-300 ease-out"
              height={containerHeight}
              preserveAspectRatio="none"
              style={{ clipPath }}
              viewBox={`0 0 ${TOC_PATH_TRACK_WIDTH} ${containerHeight}`}
              width={TOC_PATH_TRACK_WIDTH}
            >
              <path
                d={pathD}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          </>
        ) : null}
        <ul className="flex flex-col" ref={listRef}>
          {items.map((item) => {
            const id = getHeadingId(item);
            const isActive = id === activeId;
            const indent = item.depth === 3 ? "pl-7" : "pl-4";
            return (
              <li key={item.url}>
                <a
                  className={`block py-1.5 font-sans text-sm leading-snug transition-colors ${indent} ${
                    isActive
                      ? "text-foreground"
                      : "text-neutral-500 hover:text-foreground dark:text-neutral-400"
                  }`}
                  href={item.url}
                  onClick={(event) => {
                    event.preventDefault();
                    lockScrollSpy();
                    setActiveId(id);
                    scrollToHeading(id);
                  }}
                  ref={(node) => {
                    if (node) {
                      linkRefs.current.set(id, node);
                    } else {
                      linkRefs.current.delete(id);
                    }
                  }}
                >
                  {item.title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      {hasScrolled ? (
        <button
          className="mt-6 flex w-full cursor-pointer items-center gap-2 border-border/70 border-t pt-4 font-medium font-sans text-muted-foreground text-sm transition-colors hover:text-foreground"
          onClick={scrollToTop}
          type="button"
        >
          <HugeiconsIcon className="size-4" icon={ArrowUp01Icon} />
          Back to top
        </button>
      ) : null}
    </nav>
  );
}
