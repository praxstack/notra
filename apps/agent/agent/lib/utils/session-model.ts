import { gatewayAttributionOptions } from "@notra/ai/utils/usage-attribution";
import { getOrganizationId } from "@notra/tools/utils/organization";
import { defineDynamic } from "eve";

import { createAgentModel, getStepTurnId } from "./model";

export function createSessionAgentModel(
  modelId: string,
  tag: string,
  modelContextWindowTokens: number
) {
  const model = createAgentModel(modelId, tag);
  return defineDynamic({
    events: {
      "step.started": (event, ctx) => ({
        model,
        modelContextWindowTokens,
        modelOptions: {
          providerOptions: {
            gateway: gatewayAttributionOptions({
              organizationId: getOrganizationId(ctx),
              sessionId: ctx.session.id,
              turnId: getStepTurnId(event),
            }),
          },
        },
      }),
    },
  });
}
