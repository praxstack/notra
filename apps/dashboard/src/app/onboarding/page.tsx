import { redirect } from "next/navigation";
import {
  getAllUserOrganizations,
  getLastActiveOrganization,
  getSession,
} from "@/lib/auth/actions";
import { hasPaidSubscriptionHistory } from "@/lib/billing/subscription";
import { PricingClient } from "./pricing-client";

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const organization = await getLastActiveOrganization(session.user.id);

  if (!organization) {
    redirect("/login");
  }

  const allOrgs = await getAllUserOrganizations(session.user.id);
  for (const org of allOrgs) {
    if (await hasPaidSubscriptionHistory(org.id)) {
      redirect(`/${org.slug}`);
    }
  }

  return <PricingClient slug={organization.slug} />;
}
