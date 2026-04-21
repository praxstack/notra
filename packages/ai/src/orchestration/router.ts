import { gateway } from "@notra/ai/gateway";
import {
  type AILogTarget,
  wrapModelWithObservability,
} from "@notra/ai/observability";
import { ROUTING_PROMPT } from "@notra/ai/prompts/router";
import { routingDecisionSchema } from "@notra/ai/schemas/orchestration";
import type {
  RoutingDecision,
  RoutingResult,
} from "@notra/ai/types/orchestration";
import { generateText, Output } from "ai";

const MODELS = {
  router: "openai/gpt-oss-120b",
  simple: "openai/gpt-5.1-instant",
  complex: "anthropic/claude-haiku-4.5",
} as const;

const TRIVIAL_MESSAGE_PATTERNS = [
  /^(hi|hello|hey|yo|sup|hallo|moin|servus)\b[\s!.?]*$/i,
  /^(thanks?|thank you|thx|danke|ty)\b[\s!.?]*$/i,
  /^(ok(ay)?|cool|nice|got it|alles klar)\b[\s!.?]*$/i,
  /^(bye|cya|tschüss|ciao)\b[\s!.?]*$/i,
];

export function isTrivialMessage(userMessage: string): boolean {
  const trimmed = userMessage.trim();
  if (!trimmed || trimmed.length > 40) {
    return false;
  }
  return TRIVIAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function matchTrivialFastPath(
  userMessage: string,
  hasIntegrationContext: boolean
): RoutingDecision | undefined {
  if (hasIntegrationContext) {
    return undefined;
  }
  if (!isTrivialMessage(userMessage)) {
    return undefined;
  }
  return {
    complexity: "simple",
    requiresTools: false,
    reasoning: "Trivial greeting/acknowledgement — skipped router call",
  };
}

export async function routeMessage(
  userMessage: string,
  hasIntegrationContext: boolean,
  log?: AILogTarget
): Promise<RoutingDecision> {
  const fastPath = matchTrivialFastPath(userMessage, hasIntegrationContext);
  if (fastPath) {
    return fastPath;
  }

  const contextHint = hasIntegrationContext
    ? "\n\nNote: The user has connected integration context (for example GitHub or Linear), so they may want help using external project data."
    : "";

  const routerModel = wrapModelWithObservability(gateway(MODELS.router), log);

  const { output } = await generateText({
    model: routerModel,
    output: Output.object({ schema: routingDecisionSchema }),
    system: ROUTING_PROMPT,
    prompt: `Classify this user message:

"${userMessage}"${contextHint}`,
  });

  return output;
}

export function selectModel(decision: RoutingDecision): string {
  if (decision.complexity === "complex") {
    return MODELS.complex;
  }
  return MODELS.simple;
}

export async function routeAndSelectModel(
  userMessage: string,
  hasIntegrationContext: boolean,
  log?: AILogTarget
): Promise<RoutingResult> {
  const decision = await routeMessage(userMessage, hasIntegrationContext, log);
  const model = selectModel(decision);

  return {
    model,
    complexity: decision.complexity,
    requiresTools: decision.requiresTools,
    reasoning: decision.reasoning,
  };
}
