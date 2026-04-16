import { createServerFlagsManager } from "@databuddy/sdk/node";
import {
  AI_CHAT_EXPERIMENT_FLAG_KEY,
  DATABUDDY_DASHBOARD_CLIENT_ID,
} from "@/lib/databuddy-config";

const flagsManager = DATABUDDY_DASHBOARD_CLIENT_ID
  ? createServerFlagsManager({
      clientId: DATABUDDY_DASHBOARD_CLIENT_ID,
      cacheTtl: 5 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    })
  : null;

interface AiChatExperimentContext {
  userId?: string;
  email?: string | null;
  organizationId?: string;
}

export async function isAiChatExperimentEnabled({
  userId,
  email,
  organizationId,
}: AiChatExperimentContext): Promise<boolean> {
  if (!flagsManager) {
    return false;
  }

  try {
    const result = await flagsManager.getFlag(AI_CHAT_EXPERIMENT_FLAG_KEY, {
      userId,
      email: email ?? undefined,
      organizationId,
      properties: organizationId ? { organizationId } : undefined,
    });

    return result.enabled;
  } catch (error) {
    console.error("[Databuddy] Failed to evaluate AI chat experiment", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      organizationId,
    });
    return false;
  }
}
