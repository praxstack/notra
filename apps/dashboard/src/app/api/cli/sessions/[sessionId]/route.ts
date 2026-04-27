import { NextResponse } from "next/server";
import { consumeCliSessionKey } from "@/lib/cli-auth/storage";
import { cliSessionIdSchema } from "@/schemas/cli-auth";
import type { CliPollResponse } from "@/types/cli-auth/poll";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const sessionIdParse = cliSessionIdSchema.safeParse(sessionId);
  if (!sessionIdParse.success) {
    return NextResponse.json<CliPollResponse>(
      { status: "expired" },
      { status: 400 }
    );
  }

  const result = await consumeCliSessionKey(sessionIdParse.data);
  if (result.status === "pending") {
    return NextResponse.json<CliPollResponse>(result, { status: 202 });
  }
  if (result.status === "expired") {
    return NextResponse.json<CliPollResponse>(result, { status: 410 });
  }
  return NextResponse.json<CliPollResponse>(result, { status: 200 });
}
