import { organizations } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import type { Context } from "hono";

import { ORGANIZATION_SCOPED_API_KEY_ERROR } from "../constants/skills";
import type { DbClient } from "../types/db";
import type { ApiEnv } from "../types/env";
import { getOrganizationId } from "./auth";

export async function getOrganizationResponse(
  db: DbClient,
  organizationId: string
) {
  return db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    columns: {
      id: true,
      slug: true,
      name: true,
      logo: true,
    },
  });
}

export async function resolveRequestOrganization(c: Context<ApiEnv>) {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return {
      response: c.json({ error: ORGANIZATION_SCOPED_API_KEY_ERROR }, 403),
    };
  }

  const organization = await getOrganizationResponse(c.get("db"), orgId);
  if (!organization) {
    return { response: c.json({ error: "Organization not found" }, 404) };
  }

  return { orgId, organization };
}
