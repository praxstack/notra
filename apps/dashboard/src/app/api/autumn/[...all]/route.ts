import { db } from "@notra/db/drizzle";
import { organizations } from "@notra/db/schema";
import { autumnHandler } from "autumn-js/next";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { ensureAutumnCustomer } from "@/lib/billing/autumn";

export const { GET, POST } = autumnHandler({
  identify: async (request) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!(session?.user && session?.session?.activeOrganizationId)) {
      return null;
    }

    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, session.session.activeOrganizationId),
      columns: {
        id: true,
        name: true,
      },
    });

    await ensureAutumnCustomer({
      customerId: session.session.activeOrganizationId,
      name: organization?.name ?? session.user.name,
      email: session.user.email,
      metadata: {
        orgId: session.session.activeOrganizationId,
      },
    });

    return {
      customerId: session.session.activeOrganizationId,
      customerData: {
        name: session.user.name,
        email: session.user.email,
      },
    };
  },
});
