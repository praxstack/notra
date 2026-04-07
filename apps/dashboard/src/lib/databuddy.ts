import { Databuddy } from "@databuddy/sdk/node";
import type {
  ContentCreatedTrackingEvent,
  ContentFailedTrackingEvent,
} from "@notra/content-generation/databuddy";
import {
  buildContentCreatedDatabuddyProperties,
  buildContentFailedDatabuddyProperties,
  CONTENT_CREATED_DATABUDDY_EVENT,
  CONTENT_FAILED_DATABUDDY_EVENT,
} from "@notra/content-generation/databuddy";

const apiKey = process.env.DATABUDDY_API_KEY;

if (!apiKey) {
  console.warn(
    "DATABUDDY_API_KEY not configured. Server-side Databuddy tracking will be disabled."
  );
}

export const databuddy = apiKey
  ? new Databuddy({
      websiteId: process.env.DATABUDDY_DASHBOARD_WEBSITE_ID,
      apiKey,
      enableBatching: false,
    })
  : null;

const marketingWebsiteId = process.env.NEXT_PUBLIC_DATABUDDY_WEB_WEBSITE_ID;

export const marketingDatabuddy =
  apiKey && marketingWebsiteId
    ? new Databuddy({
        websiteId: marketingWebsiteId,
        apiKey,
        enableBatching: false,
      })
    : null;

const isDevelopment = process.env.NODE_ENV === "development";

interface MarketingSignupCompletedEvent {
  userId: string;
  organizationId?: string;
  source?: string;
  landingPageH1Variant?: string;
  landingPageH1Copy?: string;
  signupMethod?: "email" | "google" | "github";
}

interface MarketingSignupPlanSelectedEvent
  extends MarketingSignupCompletedEvent {
  selectedProduct: "basic" | "pro" | "other";
  selectedPlanId: string;
  billingPeriod: "monthly" | "yearly";
}

async function trackMarketingEvent(
  name: string,
  properties: Record<string, unknown>
): Promise<void> {
  if (!marketingDatabuddy) {
    return;
  }

  try {
    const result = await marketingDatabuddy.track({
      name,
      namespace: "signup",
      source: "dashboard",
      properties,
    });

    if (!result.success && isDevelopment) {
      console.warn(`[Databuddy] ${name} failed`, {
        error: result.error,
        properties,
      });
    }
  } catch (error) {
    if (isDevelopment) {
      console.warn(`[Databuddy] ${name} error`, {
        error,
        properties,
      });
    }
  }
}

export async function trackMarketingSignupCompleted(
  event: MarketingSignupCompletedEvent
): Promise<void> {
  await trackMarketingEvent("signup_completed", {
    landing_page_h1_copy: event.landingPageH1Copy,
    landing_page_h1_variant: event.landingPageH1Variant,
    organization_id: event.organizationId,
    signup_method: event.signupMethod,
    source: event.source,
    user_id: event.userId,
  });
}

export async function trackMarketingSignupPlanSelected(
  event: MarketingSignupPlanSelectedEvent
): Promise<void> {
  await trackMarketingEvent("signup_plan_selected", {
    billing_period: event.billingPeriod,
    landing_page_h1_copy: event.landingPageH1Copy,
    landing_page_h1_variant: event.landingPageH1Variant,
    organization_id: event.organizationId,
    selected_plan_id: event.selectedPlanId,
    selected_product: event.selectedProduct,
    signup_method: event.signupMethod,
    source: event.source,
    user_id: event.userId,
  });
}

export async function trackScheduledContentCreated(
  event: ContentCreatedTrackingEvent
): Promise<void> {
  if (!databuddy) {
    return;
  }

  try {
    const result = await databuddy.track({
      name: CONTENT_CREATED_DATABUDDY_EVENT,
      namespace: "workflows",
      source: event.source ?? "schedule",
      properties: buildContentCreatedDatabuddyProperties(event),
    });

    if (!result.success && isDevelopment) {
      console.warn("[Databuddy] scheduled_content_created failed", {
        triggerId: event.triggerId,
        postId: event.postId,
        error: result.error,
      });
    }
  } catch (error) {
    if (isDevelopment) {
      console.warn("[Databuddy] scheduled_content_created error", {
        triggerId: event.triggerId,
        postId: event.postId,
        error,
      });
    }
  }
}

export async function trackScheduledContentFailed(
  event: ContentFailedTrackingEvent
): Promise<void> {
  if (!databuddy) {
    return;
  }

  try {
    const result = await databuddy.track({
      name: CONTENT_FAILED_DATABUDDY_EVENT,
      namespace: "workflows",
      source: event.source ?? "schedule",
      properties: buildContentFailedDatabuddyProperties(event),
    });

    if (!result.success && isDevelopment) {
      console.warn("[Databuddy] scheduled_content_failed failed", {
        triggerId: event.triggerId,
        error: result.error,
      });
    }
  } catch (error) {
    if (isDevelopment) {
      console.warn("[Databuddy] scheduled_content_failed error", {
        triggerId: event.triggerId,
        error,
      });
    }
  }
}
