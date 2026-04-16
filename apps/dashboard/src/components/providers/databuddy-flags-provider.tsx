"use client";

import { FlagsProvider, useFlag } from "@databuddy/sdk/react";
import type { ReactNode } from "react";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  AI_CHAT_EXPERIMENT_FLAG_KEY,
  DATABUDDY_DASHBOARD_CLIENT_ID,
} from "@/lib/databuddy-config";
import { authClient } from "@/lib/auth/client";

export function DatabuddyFlagsProvider({ children }: { children: ReactNode }) {
  const { activeOrganization } = useOrganizationsContext();
  const { data: session, isPending } = authClient.useSession();

  return (
    <FlagsProvider
      clientId={DATABUDDY_DASHBOARD_CLIENT_ID}
      disabled={!DATABUDDY_DASHBOARD_CLIENT_ID}
      isPending={isPending}
      user={
        session?.user
          ? {
              userId: session.user.id,
              email: session.user.email,
              organizationId: activeOrganization?.id,
              properties: activeOrganization?.id
                ? { organizationId: activeOrganization.id }
                : undefined,
            }
          : undefined
      }
    >
      {children}
    </FlagsProvider>
  );
}

export function useAiChatExperiment() {
  return useFlag(AI_CHAT_EXPERIMENT_FLAG_KEY);
}
