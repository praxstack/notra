import type { MetadataRoute } from "next";
import { SITE_URL } from "@/utils/urls";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/.well-known/", "/_next/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
