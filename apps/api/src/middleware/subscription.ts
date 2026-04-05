import { Autumn } from "autumn-js";
import type { Context, Next } from "hono";
import { getOrganizationId } from "../utils/auth";

const RESTRICTED_METHODS = new Set(["POST", "PUT", "PATCH"]);

const PAID_OR_LEGACY_PLAN_IDS = new Set([
  "free",
  "basic",
  "basic_yearly",
  "pro",
  "pro_yearly",
]);

export function subscriptionMiddleware() {
  return async (c: Context, next: Next) => {
    if (!RESTRICTED_METHODS.has(c.req.method)) {
      return next();
    }

    const secretKey = c.env.AUTUMN_SECRET_KEY as string | undefined;
    if (!secretKey) {
      return next();
    }

    const orgId = getOrganizationId(c);
    if (!orgId) {
      return next();
    }

    const autumn = new Autumn({ secretKey });

    try {
      const customer = await autumn.customers.getOrCreate({
        customerId: orgId,
      });

      const hasActivePlan = customer.subscriptions.some(
        (subscription) =>
          !subscription.addOn &&
          subscription.status === "active" &&
          PAID_OR_LEGACY_PLAN_IDS.has(subscription.planId)
      );

      if (!hasActivePlan) {
        return c.json({ error: "Active subscription required" }, 402);
      }
    } catch {
      return c.json({ error: "Failed to verify subscription status" }, 500);
    }

    return next();
  };
}
