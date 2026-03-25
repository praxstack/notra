import { FEATURES } from "@/constants/features";
import type { AutumnCheckResponse } from "@/types/autumn";
import type { LogRetentionDays } from "@/types/webhooks/webhooks";
import { autumn } from "./autumn";

export async function checkLogRetention(
  organizationId: string
): Promise<LogRetentionDays> {
  if (!autumn) {
    return 30;
  }

  try {
    const thirtyDayCheck = await autumn.check({
      customerId: organizationId,
      featureId: FEATURES.LOG_RETENTION_30_DAYS,
    });

    if (thirtyDayCheck?.allowed) {
      return 30;
    }

    const fourteenDayCheck = await autumn.check({
      customerId: organizationId,
      featureId: FEATURES.LOG_RETENTION_14_DAYS,
    });

    if (fourteenDayCheck?.allowed) {
      return 14;
    }

    return 7;
  } catch {
    return 30;
  }
}
