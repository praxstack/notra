import { autumnHandler } from "autumn-js/next";
import { auth } from "@/lib/auth/server";

type RouteHandler = (request: Request) => Response | Promise<Response>;

const handlers: { GET: RouteHandler; POST: RouteHandler } = autumnHandler({
  identify: async (request) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!(session?.user && session?.session?.activeOrganizationId)) {
      return null;
    }

    return {
      customerId: session.session.activeOrganizationId,
      customerData: {
        name: session.user.name,
        email: session.user.email,
      },
    };
  },
});

export const { GET, POST } = handlers;
