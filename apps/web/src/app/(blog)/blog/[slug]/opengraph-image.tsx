import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getNotraBlogPostBySlug } from "@/utils/blog";
import {
  OG_BLOG_DESCRIPTION_MAX_LENGTH,
  OG_BLOG_TITLE_MAX_LENGTH,
} from "@/utils/constants";
import { loadGoogleFont, loadImageAsDataUrl, truncate } from "@/utils/og";
import type { BlogEntryPageProps } from "~types/blog";

export const alt = "Notra blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: BlogEntryPageProps) {
  const { slug } = await params;
  const post = await getNotraBlogPostBySlug(slug);

  const title = truncate(post?.title ?? "Notra Blog", OG_BLOG_TITLE_MAX_LENGTH);
  const description = truncate(
    post?.excerpt ?? "Insights, guides, and stories from the Notra team.",
    OG_BLOG_DESCRIPTION_MAX_LENGTH
  );
  const author = post?.authors[0] ?? null;

  const eyebrow = "BLOG";
  const domain = "usenotra.com";
  const uiText = `${eyebrow} ${domain} ${description} ${author?.name ?? ""} ${author?.role ?? ""}`;

  const [serifFont, sansFont, sansBoldFont, logoSvg, authorImageDataUrl] =
    await Promise.all([
      loadGoogleFont("Instrument Serif", title),
      loadGoogleFont("Inter", uiText),
      loadGoogleFont("Inter:wght@600", uiText),
      Promise.resolve(
        readFileSync(join(process.cwd(), "public/notra-mark.svg"), "utf-8")
      ),
      loadImageAsDataUrl(author?.image ?? null),
    ]);

  const logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`;
  const authorImage = authorImageDataUrl ?? logoDataUrl;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#ffffff",
        padding: "5rem",
        fontFamily: "Inter",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: next/og JSX requires native img */}
        <img alt="" height={56} src={logoDataUrl} width={56} />
        <div
          style={{
            color: "#525252",
            fontSize: "1rem",
            fontWeight: 600,
            letterSpacing: "0.24em",
          }}
        >
          {eyebrow}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: "3.5rem",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#1a1a1a",
            fontFamily: "Instrument Serif",
            fontSize: "4rem",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            maxWidth: "44rem",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            color: "#525252",
            fontSize: "1.625rem",
            lineHeight: 1.4,
            marginTop: "1.5rem",
            maxWidth: "40rem",
          }}
        >
          {description}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          {/* biome-ignore lint/performance/noImgElement: next/og JSX requires native img */}
          <img
            alt=""
            height={64}
            src={authorImage}
            style={{ borderRadius: "9999px" }}
            width={64}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                color: "#1a1a1a",
                fontSize: "1.5rem",
                fontWeight: 600,
              }}
            >
              {author?.name ?? "Notra"}
            </div>
            {author?.role ? (
              <div
                style={{
                  color: "#525252",
                  fontSize: "1.125rem",
                  marginTop: "0.125rem",
                }}
              >
                {author.role}
              </div>
            ) : null}
          </div>
        </div>
        <div
          style={{
            color: "#525252",
            fontSize: "1.25rem",
            fontWeight: 600,
          }}
        >
          {domain}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Instrument Serif",
          data: serifFont,
          style: "normal",
          weight: 400,
        },
        { name: "Inter", data: sansFont, style: "normal", weight: 400 },
        { name: "Inter", data: sansBoldFont, style: "normal", weight: 600 },
      ],
    }
  );
}
