import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
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

  const [messages, lastResponseStopped] = await Promise.all([
    loadChatHistory(organizationId, chatId),
    getLastResponseStopped(organizationId, chatId),
  ]);
  return NextResponse.json({ chatId, messages, lastResponseStopped });
}
