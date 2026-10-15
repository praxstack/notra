import { isTinybirdConfigured } from "@notra/analytics/tinybird/client";

import {
  ANALYTICS_NOT_CONFIGURED_MESSAGE,
  ANALYTICS_QUERY_FAILED_MESSAGE,
} from "../constants/analytics";

export async function runSocialAnalyticsQuery<Row, Output>(
  query: () => Promise<{ data: Row[] } | null>,
  toOutput: (rows: Row[]) => Output
): Promise<Output | string> {
  if (!isTinybirdConfigured()) {
    return ANALYTICS_NOT_CONFIGURED_MESSAGE;
  }

  try {
    const result = await query();
    if (!result) {
      return ANALYTICS_NOT_CONFIGURED_MESSAGE;
    }
    return toOutput(result.data);
  } catch (error) {
    return `${ANALYTICS_QUERY_FAILED_MESSAGE} ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
}
