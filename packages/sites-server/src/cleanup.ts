import { siteDeployments } from "@notra/db/schema";
import { SITE_DEPLOYMENT_IN_PROGRESS_STATUSES } from "@notra/sites-core/constants/sites";
import { and, eq, gt, inArray, isNull, or } from "drizzle-orm";

import { readLiveDeployments } from "./activation";
import { DEPLOYMENT_SETTLE_MS } from "./constants/deployments";
import {
  getProductionDeploymentHistory,
  getSite,
  transitionDeployment,
} from "./deployments";
import { publishSiteDeploymentChange } from "./live";
import { r2DeletePrefix, r2ListPrefixes } from "./r2";
import type { SiteStorageTransaction } from "./types/deployments";
import type { SiteCleanupResult } from "./types/sites";
import { withSiteStorageLock } from "./utils/site-storage-lock";

async function listUnsettledDeploymentIds(
  siteId: string,
  tx: SiteStorageTransaction,
  deploymentId?: string
) {
  const settledBefore = new Date(Date.now() - DEPLOYMENT_SETTLE_MS);
  return await tx
    .select({ id: siteDeployments.id })
    .from(siteDeployments)
    .where(
      and(
        eq(siteDeployments.siteId, siteId),
        deploymentId ? eq(siteDeployments.id, deploymentId) : undefined,
        or(
          inArray(siteDeployments.status, [
            ...SITE_DEPLOYMENT_IN_PROGRESS_STATUSES,
          ]),
          and(
            eq(siteDeployments.status, "ready"),
            or(
              isNull(siteDeployments.finishedAt),
              gt(siteDeployments.finishedAt, settledBefore)
            )
          )
        )
      )
    );
}

export async function cleanupSiteDeployments(
  siteId: string
): Promise<SiteCleanupResult> {
  const cleanup = await withSiteStorageLock(siteId, async (tx) => {
    const site = await getSite(siteId, tx);
    if (!site) {
      return { deleted: [], organizationId: null };
    }
    const [unsettled, history] = await Promise.all([
      listUnsettledDeploymentIds(site.id, tx),
      getProductionDeploymentHistory(site.id, tx),
    ]);
    const { ids: protectedIds } = await readLiveDeployments(site.id);
    for (const row of [...unsettled, ...history]) {
      protectedIds.add(row.id);
    }
    const root = `deployments/${site.id}/`;
    const deleted: string[] = [];
    for (const prefix of await r2ListPrefixes(root)) {
      const deploymentId = prefix.slice(root.length).replace(/\/$/, "");
      if (protectedIds.has(deploymentId)) {
        continue;
      }
      if (
        (await listUnsettledDeploymentIds(site.id, tx, deploymentId)).length > 0
      ) {
        continue;
      }
      await r2DeletePrefix(prefix);
      await transitionDeployment(deploymentId, "expired", {}, tx);
      deleted.push(deploymentId);
    }
    return { deleted, organizationId: site.organizationId };
  });
  if (cleanup.organizationId && cleanup.deleted.length > 0) {
    await publishSiteDeploymentChange(cleanup.organizationId, siteId);
  }
  return { deleted: cleanup.deleted };
}
