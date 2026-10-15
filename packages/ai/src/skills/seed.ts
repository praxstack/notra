import { db } from "@notra/db/drizzle";
import { skills } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { UNSLOP_DESCRIPTION } from "./constants";
import { buildSystemSkills } from "./system-skills";
import { UNSLOP_CONTENT } from "./unslop-content";

export async function seedSystemSkills(
  organizationId: string
): Promise<number> {
  const definitions = buildSystemSkills();

  const rows = definitions.map((def) => ({
    id: nanoid(),
    organizationId,
    name: def.name,
    description: def.description,
    content: def.content,
    isSystem: true,
  }));

  const inserted = await db
    .insert(skills)
    .values(rows)
    .onConflictDoNothing({
      target: [skills.organizationId, skills.name],
    })
    .returning({ id: skills.id });

  return inserted.length;
}

/**
 * Organizations known to have the system unslop row. System skills can't be
 * deleted, so later chat turns can skip the round trip. A conflicting custom
 * skill named "unslop" can be renamed or deleted, so that case keeps retrying.
 */
const unslopEnsuredOrganizations = new Set<string>();

/** Add the new system skill to organizations created before it was seeded. */
export async function ensureUnslopSkill(organizationId: string) {
  if (unslopEnsuredOrganizations.has(organizationId)) {
    return;
  }
  const inserted = await db
    .insert(skills)
    .values({
      id: nanoid(),
      organizationId,
      name: "unslop",
      description: UNSLOP_DESCRIPTION,
      content: UNSLOP_CONTENT,
      isSystem: true,
    })
    .onConflictDoNothing({ target: [skills.organizationId, skills.name] })
    .returning({ id: skills.id });
  const existing =
    inserted.length > 0
      ? { isSystem: true }
      : await db.query.skills.findFirst({
          where: and(
            eq(skills.organizationId, organizationId),
            eq(skills.name, "unslop")
          ),
          columns: { isSystem: true },
        });
  if (existing?.isSystem) {
    unslopEnsuredOrganizations.add(organizationId);
  }
}
