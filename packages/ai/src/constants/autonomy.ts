export const IRIS_MANDATE_NAME = "Iris mission";

export const IRIS_COLLECTION_NAME = "Iris";

export const IRIS_CONTROLLER_CLAIM_SCOPE = "iris-controller";
export const IRIS_CONTROLLER_LEASE_PREFIX = "iris";

export const CONTROLLER_CLAIM_TTL_SECONDS = 900;
export const CLAIM_REAP_GRACE_SECONDS = 86_400;
export const CONTROLLER_LEASE_TTL_SECONDS = 1800;
export const CONTROLLER_LEASE_RENEW_TTL_SECONDS = 1800;

export const OUTBOX_DESTINATION_SLACK = "slack";

export const ACTION_BUDGET_WINDOW_HOURS = 24;
export const PENDING_SIGNAL_FETCH_LIMIT = 50;

export const IRIS_WAKE_CRON = "*/30 * * * *";

export const MILLISECONDS_PER_SECOND = 1000;
export const SECONDS_PER_HOUR = 3600;
export const HOURS_PER_DAY = 24;

export const SIGNAL_DELIMITER_OPEN = "<<<UNTRUSTED_SIGNAL_DATA";
export const SIGNAL_DELIMITER_CLOSE = "UNTRUSTED_SIGNAL_DATA>>>";
