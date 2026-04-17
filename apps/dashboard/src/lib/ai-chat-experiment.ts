import { createServerFlagsManager } from "@databuddy/sdk/node";
import {
  AI_CHAT_EXPERIMENT_FLAG_KEY,
  DATABUDDY_DASHBOARD_CLIENT_ID,
} from "@/lib/databuddy-config";

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
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  if (!DATABUDDY_DASHBOARD_CLIENT_ID) {
    return false;
  }

  try {
    const flagsManager = createServerFlagsManager({
      clientId: DATABUDDY_DASHBOARD_CLIENT_ID,
      cacheTtl: 5 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
      user: {
        userId,
        email: email ?? undefined,
        organizationId,
        properties: organizationId ? { organizationId } : undefined,
      },
    });

    const result = await flagsManager.getFlag(AI_CHAT_EXPERIMENT_FLAG_KEY);

    return result.enabled || result.value === true;
  } catch (error) {
    console.error("[Databuddy] Failed to evaluate AI chat experiment", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      organizationId,
    });
    return false;
  }
}
