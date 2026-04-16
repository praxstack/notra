import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAiChatExperimentEnabled } from "@/lib/ai-chat-experiment";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { listChatSessions } from "@/lib/chat-history";

interface RouteContext {
  params: Promise<{ organizationId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { organizationId } = await params;
  const auth = await withOrganizationAuth(request, organizationId);

  if (!auth.success) {
    return auth.response;
  }

  const aiChatEnabled = await isAiChatExperimentEnabled({
    userId: auth.context.user.id,
    email: auth.context.user.email,
    organizationId,
  });

  if (!aiChatEnabled) {
    return NextResponse.json(
      { error: "AI chat is not enabled for this organization" },
      { status: 403 }
    );
  }

  const sessions = await listChatSessions(organizationId);
  return NextResponse.json({ sessions });
}
