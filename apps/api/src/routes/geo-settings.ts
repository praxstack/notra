import { createRoute } from "@hono/zod-openapi";
import { loadGeoSettings } from "@notra/geo-core/geo/programs";
import { projectParamsSchema } from "@notra/schemas/api/geo-params";
import {
  patchSettingsRequestSchema,
  settingsResponseSchema,
} from "@notra/schemas/api/geo-settings";

import {
  GEO_COMMON_ERROR_RESPONSES,
  GEO_OPENAPI_TAG,
} from "../constants/geo-openapi";
import { upsertGeoSettingsWithValidation } from "../programs/geo";
import { runGeoEffect } from "../runtime/geo";
import { geoOutcomeResponse, refreshGeoGapsAfter } from "../utils/geo";
import { createOpenApiApp } from "../utils/openapi-app";

export const geoSettingsRoutes = createOpenApiApp();

const getSettingsRoute = createRoute({
  method: "get",
  path: "/projects/{projectId}/geo/settings",
  tags: [GEO_OPENAPI_TAG],
  operationId: "getGeoSettings",
  summary: "Get a project's GEO settings",
  request: { params: projectParamsSchema },
  responses: {
    200: {
      description: "Settings fetched successfully",
      content: { "application/json": { schema: settingsResponseSchema } },
    },
    ...GEO_COMMON_ERROR_RESPONSES,
  },
});

const patchSettingsRoute = createRoute({
  method: "patch",
  path: "/projects/{projectId}/geo/settings",
  tags: [GEO_OPENAPI_TAG],
  operationId: "updateGeoSettings",
  summary: "Replace a project's GEO settings",
  description:
    "Writes the full settings document and re-arms the recurring scan. Engines must be ids from the model catalog this organization can see (the ones `GET /geo/settings` returns) and languages must be supported languages; an unknown value is rejected with a 400 instead of being replaced by a default. Zero data retention is forced off without the ZDR add-on, and engines that are not visible to this caller keep their stored selection. Competitors are managed through the competitors endpoints and are not part of this payload. The language the project's prompts are written in always stays tracked: leaving it out of `languages` adds it back as the first entry, and a full list without it is rejected with a 400.",
  request: {
    params: projectParamsSchema,
    body: {
      required: true,
      content: { "application/json": { schema: patchSettingsRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "Settings updated successfully",
      content: { "application/json": { schema: settingsResponseSchema } },
    },
    ...GEO_COMMON_ERROR_RESPONSES,
  },
});

geoSettingsRoutes.openapi(getSettingsRoute, async (c) => {
  const base = c.get("geo");
  const { projectId } = c.req.valid("param");
  const outcome = await runGeoEffect(
    "settings",
    loadGeoSettings({ organizationId: base.organizationId, projectId })
  );
  return geoOutcomeResponse(c, outcome, 200);
});

geoSettingsRoutes.openapi(patchSettingsRoute, async (c) => {
  const base = c.get("geo");
  const { projectId } = c.req.valid("param");
  const scope = { organizationId: base.organizationId, projectId };
  const outcome = await runGeoEffect(
    "settingsUpsert",
    upsertGeoSettingsWithValidation({
      ...c.req.valid("json"),
      ...scope,
      competitors: [],
    }).pipe(refreshGeoGapsAfter(scope))
  );
  return geoOutcomeResponse(c, outcome, 200);
});
