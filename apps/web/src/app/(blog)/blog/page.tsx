import type { Metadata } from "next";
import Link from "next/link";
import {
  buildBlogTimelineItems,
  formatBlogDate,
  listNotraBlogPosts,
} from "@/utils/blog";

const title = "Notra Blog";
const description = "Insights, guides, and stories from the Notra team.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "https://usenotra.com/blog",
  },
  openGraph: {
    title,
    description,
    url: "https://usenotra.com/blog",
    type: "website",
    siteName: "Notra",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default async function BlogPage() {
  const posts = await listNotraBlogPosts();
  const timelineItems = buildBlogTimelineItems(posts);

  if (timelineItems.length === 0) {
    return (
      <>
        <div className="flex w-full max-w-[680px] flex-col items-center justify-start gap-4 self-center text-center">
          <h1 className="text-balance font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
            The Notra <span className="text-primary">Blog</span>
          </h1>
          <div className="text-balance font-sans text-base text-muted-foreground leading-7">
            Insights, guides, and stories from the Notra team.
          </div>
        </div>

        <div className="mt-14 w-full max-w-[760px] self-center">
          <div className="rounded-2xl border border-border border-dashed bg-muted/30 px-6 py-12 text-center">
            <h2 className="font-sans font-semibold text-foreground text-xl">
              No posts yet
            </h2>
            <p className="mt-2 font-sans text-muted-foreground text-sm leading-6">
              We&apos;ll share new articles and insights here soon.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex w-full max-w-[680px] flex-col items-center justify-start gap-4 self-center text-center">
        <h1 className="text-balance font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
          The Notra <span className="text-primary">Blog</span>
        </h1>
        <div className="text-balance font-sans text-base text-muted-foreground leading-7">
          Insights, guides, and stories from the Notra team.
        </div>
      </div>

      <div className="mt-14 w-full max-w-[760px] divide-y divide-border self-center">
        {timelineItems.map((item) => (
          <Link
            className="group block py-8 first:pt-0"
            href={item.href}
            key={item.id}
          >
            <article>
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-sans font-semibold text-foreground text-xl tracking-tight sm:text-2xl">
                  {item.title}
                </h2>
                <time className="shrink-0 pt-1 font-sans text-muted-foreground text-sm">
                  {formatBlogDate(item.date)}
                </time>
              </div>
              <p className="mt-3 line-clamp-3 font-sans text-base text-muted-foreground leading-7">
                {item.description}
              </p>
            </article>
          </Link>
        ))}
      </div>
    </>
  );
}
