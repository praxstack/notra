import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import {
  trackMarketingSignupCompleted,
  trackMarketingSignupPlanSelected,
} from "@/lib/databuddy";

const requestSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("signup_completed"),
    source: z.string().optional(),
    landingPageH1Variant: z.string().optional(),
    landingPageH1Copy: z.string().optional(),
    signupMethod: z.enum(["email", "google", "github"]).optional(),
  }),
  z.object({
    event: z.literal("signup_plan_selected"),
    source: z.string().optional(),
    landingPageH1Variant: z.string().optional(),
    landingPageH1Copy: z.string().optional(),
    signupMethod: z.enum(["email", "google", "github"]).optional(),
    selectedProduct: z.enum(["basic", "pro", "other"]),
    selectedPlanId: z.string(),
    billingPeriod: z.enum(["monthly", "yearly"]),
  }),
]);

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (parsed.data.event === "signup_completed") {
    await trackMarketingSignupCompleted({
      landingPageH1Copy: parsed.data.landingPageH1Copy,
      landingPageH1Variant: parsed.data.landingPageH1Variant,
      organizationId: session.session.activeOrganizationId ?? undefined,
      signupMethod: parsed.data.signupMethod,
      source: parsed.data.source,
      userId: session.user.id,
    });

    return NextResponse.json({ ok: true });
  }

  await trackMarketingSignupPlanSelected({
    billingPeriod: parsed.data.billingPeriod,
    landingPageH1Copy: parsed.data.landingPageH1Copy,
    landingPageH1Variant: parsed.data.landingPageH1Variant,
    organizationId: session.session.activeOrganizationId ?? undefined,
    selectedPlanId: parsed.data.selectedPlanId,
    selectedProduct: parsed.data.selectedProduct,
    signupMethod: parsed.data.signupMethod,
    source: parsed.data.source,
    userId: session.user.id,
  });

  return NextResponse.json({ ok: true });
}
