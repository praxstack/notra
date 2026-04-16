import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAiChatExperimentEnabled } from "@/lib/ai-chat-experiment";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { getLastResponseStopped, loadChatHistory } from "@/lib/chat-history";

interface RouteContext {
  params: Promise<{ organizationId: string; chatId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { organizationId, chatId } = await params;
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

  const [messages, lastResponseStopped] = await Promise.all([
    loadChatHistory(organizationId, chatId),
    getLastResponseStopped(organizationId, chatId),
  ]);
  return NextResponse.json({ chatId, messages, lastResponseStopped });
}
