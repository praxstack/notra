import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAiChatExperimentEnabled } from "@/lib/ai-chat-experiment";
import { validateOrganizationAccess } from "@/lib/auth/actions";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Chat",
};

async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { organization, user } = await validateOrganizationAccess(slug);
  const aiChatEnabled = await isAiChatExperimentEnabled({
    userId: user.id,
    email: user.email,
    organizationId: organization.id,
  });

  if (!aiChatEnabled) {
    redirect(`/${slug}`);
  }

  return <PageClient key="new-chat" organizationSlug={slug} />;
}

export default Page;
