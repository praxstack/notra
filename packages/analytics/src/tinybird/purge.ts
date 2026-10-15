import { Effect } from "effect";

import {
  bumpAnalyticsVersions,
  advancePurgeGeneration,
} from "../cache/query-cache";
import type {
  PurgeGeoProjectInput,
  PurgeSocialAccountInput,
} from "../types/purge";

const ACCOUNT_SCOPED_DATASOURCES = [
  "social_accounts",
  "social_account_stats",
  "social_posts",
  "social_post_stats",
  "social_post_stats_latest",
  "social_account_stats_latest",
  "social_post_sources",
];
// Rollups are MV targets: deleting from geo_traffic_events does not reach them.
const GEO_DATASOURCES = [
  "geo_traffic_events",
  "geo_traffic_daily",
  "geo_traffic_pages_by_host_daily",
];
const WEB_DATASOURCES = [
  "web_page_views",
  "web_page_engagement",
  "web_pages_daily",
  "web_sources_daily",
  "web_audience_daily",
];

const JOB_POLL_INTERVAL_MS = 1000;
const JOB_POLL_MAX_ATTEMPTS = 60;
const TINYBIRD_READ_TIMEOUT_MS = 10_000;
const TINYBIRD_MUTATION_TIMEOUT_MS = 30_000;

function sanitize(value: string): string {
  return value.replace(/['"\\]/g, "");
}

function tinybirdBaseUrl(): string {
  return (
    process.env.TINYBIRD_BASE_URL ??
    process.env.TINYBIRD_URL ??
    "https://api.tinybird.co"
  );
}

function isRetryableJobPollError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "TimeoutError") ||
    (error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError"))
  );
}

async function waitForJob(jobId: string): Promise<void> {
  for (let attempt = 0; attempt < JOB_POLL_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(`${tinybirdBaseUrl()}/v0/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${process.env.TINYBIRD_TOKEN}` },
        signal: AbortSignal.timeout(TINYBIRD_READ_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(`Tinybird job poll failed (${response.status})`);
      }
      const job: { status?: string; error?: string } = await response.json();
      if (job.status === "done") {
        return;
      }
      if (job.status === "error") {
        throw new Error(
          `Tinybird delete job failed: ${job.error ?? "unknown"}`
        );
      }
    } catch (error) {
      if (!isRetryableJobPollError(error)) {
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, JOB_POLL_INTERVAL_MS));
  }
  throw new Error("Tinybird delete job timed out");
}

async function runDelete(
  datasource: string,
  condition: string,
  waitForCompletion = true
): Promise<void> {
  const response = await fetch(
    `${tinybirdBaseUrl()}/v0/datasources/${datasource}/delete`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TINYBIRD_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ delete_condition: condition }),
      signal: AbortSignal.timeout(TINYBIRD_MUTATION_TIMEOUT_MS),
    }
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Tinybird delete on ${datasource} failed (${response.status}): ${detail}`
    );
  }
  const payload: { job_id?: string; id?: string } = await response.json();
  const jobId = payload.job_id ?? payload.id;
  if (jobId && waitForCompletion) {
    await waitForJob(jobId);
  }
}

function deleteFromDatasource(
  datasource: string,
  condition: string,
  waitForCompletion = true
): Effect.Effect<void, Error> {
  return Effect.tryPromise({
    try: () => runDelete(datasource, condition, waitForCompletion),
    catch: (cause) =>
      cause instanceof Error ? cause : new Error(String(cause)),
  });
}

export function purgeSocialAccountData(
  input: PurgeSocialAccountInput
): Promise<void> {
  if (!process.env.TINYBIRD_TOKEN) {
    return Promise.resolve();
  }
  const condition = `organization_id = '${sanitize(input.organizationId)}' AND provider = '${sanitize(input.provider)}' AND provider_account_id = '${sanitize(input.providerAccountId)}'`;
  const program = Effect.gen(function* () {
    for (const datasource of ACCOUNT_SCOPED_DATASOURCES) {
      yield* deleteFromDatasource(datasource, condition);
    }
    yield* Effect.tryPromise(() =>
      bumpAnalyticsVersions("social", [input.organizationId])
    );
  });
  return Effect.runPromise(program);
}

export function purgeGeoProjectData(
  input: PurgeGeoProjectInput
): Promise<void> {
  if (!process.env.TINYBIRD_TOKEN) {
    return Promise.resolve();
  }
  const condition = `organization_id = '${sanitize(input.organizationId)}' AND project_id = '${sanitize(input.projectId)}'`;
  const program = Effect.gen(function* () {
    for (const datasource of GEO_DATASOURCES) {
      yield* deleteFromDatasource(datasource, condition);
    }
    yield* Effect.tryPromise(() =>
      advancePurgeGeneration("geo", input.organizationId)
    );
  });
  return Effect.runPromise(program);
}

/**
 * Removes every GEO and web analytics row of a deleted project. Only submits
 * the delete jobs: nothing reads a deleted project, so the request does not
 * wait for Tinybird to finish.
 */
export function purgeDeletedProjectAnalytics(
  input: PurgeGeoProjectInput
): Promise<void> {
  if (!process.env.TINYBIRD_TOKEN) {
    return Promise.resolve();
  }
  const condition = `organization_id = '${sanitize(input.organizationId)}' AND project_id = '${sanitize(input.projectId)}'`;
  return Effect.runPromise(
    Effect.forEach(
      [...GEO_DATASOURCES, ...WEB_DATASOURCES],
      (datasource) => deleteFromDatasource(datasource, condition, false),
      { discard: true }
    )
  );
}
