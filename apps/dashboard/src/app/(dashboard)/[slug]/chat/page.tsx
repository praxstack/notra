import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Chat",
};

async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return <PageClient key="new-chat" organizationSlug={slug} />;
}

export default Page;
