import { createRoute } from "@hono/zod-openapi";
import {
  loadGeoContentGaps,
  refreshGeoContentGapsBestEffort,
} from "@notra/geo-core/geo/gaps";
import {
  approveAndStartGeoWriter,
  getGeoContentBrief,
  listGeoContentBriefs,
} from "@notra/geo-core/geo/writer";
import { POSTHOG_EVENTS } from "@notra/posthog/events";
import {
  approveBriefResponseSchema,
  briefParamsSchema,
  briefResponseSchema,
  contentGapsResponseSchema,
  listBriefsResponseSchema,
  planBriefRequestSchema,
  planBriefResponseSchema,
} from "@notra/schemas/api/geo-content";
import { projectParamsSchema } from "@notra/schemas/api/geo-params";
import { Effect } from "effect";

import { API_TRIGGER_SOURCE } from "../constants/analytics";
import {
  GEO_COMMON_ERROR_RESPONSES,
  GEO_OPENAPI_TAG,
} from "../constants/geo-openapi";
import { runGeoEffect, runRemoteGeoEffect } from "../runtime/geo";
import { GEO_REMOTE_WRITER_PLAN } from "../runtime/geo-remote";
import { trackApiEvent } from "../utils/analytics";
import {
  attachGeoOrganization,
  geoErrorResponse,
  geoOutcomeResponse,
  geoRemoteErrorResponse,
} from "../utils/geo";
import { getInternalWorkflowUrl } from "../utils/internal-workflow";
import { createOpenApiApp } from "../utils/openapi-app";
import { errorResponse, rateLimitResponse } from "../utils/openapi-responses";
import { enforceRatelimit, RATE_LIMITS, ratelimit } from "../utils/ratelimit";

export const geoBriefsRoutes = createOpenApiApp();

const listGapsRoute = createRoute({
  method: "get",
  path: "/projects/{projectId}/geo/gaps",
  tags: [GEO_OPENAPI_TAG],
  operationId: "listGeoContentGaps",
  summary: "List content gaps",
  description:
    "Prompts where competitors are mentioned and this brand is not, plus Search Console queries with no tracked prompt. Each row carries the brief already written for it, when there is one.",
  request: { params: projectParamsSchema },
  responses: {
    200: {
      description: "Gaps fetched successfully",
      content: { "application/json": { schema: contentGapsResponseSchema } },
    },
    ...GEO_COMMON_ERROR_RESPONSES,
  },
});

const listBriefsRoute = createRoute({
  method: "get",
  path: "/projects/{projectId}/geo/briefs",
  tags: [GEO_OPENAPI_TAG],
  operationId: "listGeoContentBriefs",
  summary: "List content briefs",
  request: { params: projectParamsSchema },
  responses: {
    200: {
      description: "Briefs fetched successfully",
      content: { "application/json": { schema: listBriefsResponseSchema } },
    },
    ...GEO_COMMON_ERROR_RESPONSES,
  },
});

const getBriefRoute = createRoute({
  method: "get",
  path: "/projects/{projectId}/geo/briefs/{briefId}",
  tags: [GEO_OPENAPI_TAG],
  operationId: "getGeoContentBrief",
  summary: "Get a single content brief",
  request: { params: briefParamsSchema },
  responses: {
    200: {
      description: "Brief fetched successfully",
      content: { "application/json": { schema: briefResponseSchema } },
    },
    ...GEO_COMMON_ERROR_RESPONSES,
  },
});

const planBriefRoute = createRoute({
  method: "post",
  path: "/projects/{projectId}/geo/briefs",
  tags: [GEO_OPENAPI_TAG],
  operationId: "planGeoContentBrief",
  summary: "Plan a content brief",
  description:
    "Researches the topic and writes a brief, then saves it as a draft article. This books AI credits and is billed. Planning happens inside Notra, which owns the model credentials. Set `autoApprove` to start the writer in the same call. When `sourceKind` and `sourceId` point at a gap that already has an open brief, that brief is returned instead of a new one being planned. If planning exceeds four minutes, the API returns 409 while work may still finish in Notra. Do not retry; list the project's GEO briefs to find the result.",
  request: {
    params: projectParamsSchema,
    body: {
      required: true,
      content: { "application/json": { schema: planBriefRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "Brief planned successfully",
      content: { "application/json": { schema: planBriefResponseSchema } },
    },
    ...GEO_COMMON_ERROR_RESPONSES,
    409: errorResponse(
      "Brief planning is still running after the internal timeout; do not retry the plan"
    ),
    429: rateLimitResponse(
      RATE_LIMITS.writerPlan.requests,
      RATE_LIMITS.writerPlan.window
    ),
  },
});

const approveBriefRoute = createRoute({
  method: "post",
  path: "/projects/{projectId}/geo/briefs/{briefId}/approve",
  tags: [GEO_OPENAPI_TAG],
  operationId: "approveGeoContentBrief",
  summary: "Approve a brief and start the writer",
  description:
    "Claims the brief and queues the writer with the Notra dashboard. Only briefs in `draft` or `failed` can be approved; anything else returns 409.",
  request: { params: briefParamsSchema },
  responses: {
    202: {
      description: "Writer accepted",
      content: { "application/json": { schema: approveBriefResponseSchema } },
    },
    ...GEO_COMMON_ERROR_RESPONSES,
    429: rateLimitResponse(
      RATE_LIMITS.writerApprove.requests,
      RATE_LIMITS.writerApprove.window
    ),
  },
});

geoBriefsRoutes.openapi(listGapsRoute, async (c) => {
  const base = c.get("geo");
  const { projectId } = c.req.valid("param");

  const outcome = await runGeoEffect(
    "contentGaps",
    loadGeoContentGaps({ organizationId: base.organizationId, projectId })
  );
  return geoOutcomeResponse(c, outcome, 200);
});

geoBriefsRoutes.openapi(listBriefsRoute, async (c) => {
  const base = c.get("geo");
  const { projectId } = c.req.valid("param");

  const outcome = await runGeoEffect(
    "briefsList",
    listGeoContentBriefs({ organizationId: base.organizationId, projectId })
  );
  return geoOutcomeResponse(c, outcome, 200);
});

geoBriefsRoutes.openapi(getBriefRoute, async (c) => {
  const base = c.get("geo");
  const { projectId, briefId } = c.req.valid("param");

  const outcome = await runGeoEffect(
    "briefGet",
    getGeoContentBrief(
      { organizationId: base.organizationId, projectId },
      briefId
    ).pipe(Effect.map((brief) => ({ brief })))
  );
  return geoOutcomeResponse(c, outcome, 200);
});

geoBriefsRoutes.openapi(planBriefRoute, async (c) => {
  const base = c.get("geo");
  const { projectId } = c.req.valid("param");
  const url = getInternalWorkflowUrl(c.env, GEO_REMOTE_WRITER_PLAN.path);
  if (!url) {
    return c.json({ error: GEO_REMOTE_WRITER_PLAN.unavailableMessage }, 503);
  }

  const rateLimited = await enforceRatelimit(
    c,
    ratelimit.writerPlan,
    "organization"
  );
  if (rateLimited) {
    return rateLimited;
  }

  const outcome = await runRemoteGeoEffect(GEO_REMOTE_WRITER_PLAN, url, {
    ...c.req.valid("json"),
    organizationId: base.organizationId,
    projectId,
  });
  if (!outcome.ok) {
    return geoRemoteErrorResponse(c, outcome.failure);
  }
  trackApiEvent(c, {
    event: POSTHOG_EVENTS.GEO_BRIEF_PLANNED,
    organizationId: base.organizationId,
    projectId,
    properties: {
      trigger: API_TRIGGER_SOURCE,
      brief_id: outcome.value.briefId,
      status: outcome.value.status,
      auto_started: outcome.value.runId !== null,
    },
  });

  return c.json(attachGeoOrganization(base.organization, outcome.value), 200);
});

geoBriefsRoutes.openapi(approveBriefRoute, async (c) => {
  const base = c.get("geo");
  const { projectId, briefId } = c.req.valid("param");

  const rateLimited = await enforceRatelimit(
    c,
    ratelimit.writerApprove,
    "organization"
  );
  if (rateLimited) {
    return rateLimited;
  }

  const scope = { organizationId: base.organizationId, projectId };
  const refreshGaps = refreshGeoContentGapsBestEffort(scope);
  const outcome = await runGeoEffect(
    "writerStart",
    approveAndStartGeoWriter(scope, briefId).pipe(
      Effect.tap(() => refreshGaps),
      Effect.tapError(() => refreshGaps)
    )
  );
  if (!outcome.ok) {
    return geoErrorResponse(c, outcome.failure);
  }

  trackApiEvent(c, {
    event: POSTHOG_EVENTS.GEO_WRITER_STARTED,
    organizationId: base.organizationId,
    projectId,
    properties: {
      trigger: API_TRIGGER_SOURCE,
      brief_id: briefId,
      run_id: outcome.value.runId,
    },
  });

  return c.json(
    { runId: outcome.value.runId, organization: base.organization },
    202
  );
});
