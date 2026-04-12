import { createModel } from "@notra/ai/model";
import { getStandaloneChatPrompt } from "@notra/ai/prompts/standalone-chat";
import {
  createCreatePostTool,
  createUpdatePostTool,
  createViewPostTool,
} from "@notra/ai/tools/post";
import type {
  IntegrationFetchers,
  ValidatedIntegration,
} from "@notra/ai/types/orchestration";
import type { PostToolsResult } from "@notra/ai/types/post-tools";
import type {
  OrchestrateResult,
  StandaloneChatContextItem,
  StandaloneChatDeps,
  StandaloneChatInput,
} from "@notra/ai/types/standalone-chat";
import {
  convertToModelMessages,
  smoothStream,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import {
  hasEnabledGitHubIntegration,
  hasEnabledLinearIntegration,
} from "./integration-validator";
import { routeAndSelectModel } from "./router";
import {
  buildStandaloneToolSet,
  getLinearContextFromIntegrations,
  getRepoContextFromIntegrations,
} from "./standalone-tool-registry";

export async function orchestrateStandaloneChat(
  input: StandaloneChatInput,
  deps?: StandaloneChatDeps
): Promise<OrchestrateResult> {
  const {
    organizationId,
    messages,
    context = [],
    maxSteps = 5,
    log: inputLog,
  } = input;

  const log = deps?.log ?? inputLog;

  const validatedIntegrations = await validateStandaloneIntegrations(
    organizationId,
    context,
    deps?.integrationFetchers
  );

  const hasGitHub = hasEnabledGitHubIntegration(validatedIntegrations);
  const hasLinear = hasEnabledLinearIntegration(validatedIntegrations);
  const hasDataSources = hasGitHub || hasLinear;

  const lastUserMessage = getLastUserMessage(messages);
  const routingDecision = await routeAndSelectModel(
    lastUserMessage,
    hasDataSources,
    log
  );

  const modelWithMemory = createModel(
    organizationId,
    routingDecision.model,
    undefined,
    log
  );

  const postResult: PostToolsResult = {};

  const { tools, descriptions } = buildStandaloneToolSet(
    {
      organizationId,
      validatedIntegrations,
      postResult,
    },
    {
      resolveContext: deps?.resolveContext,
      resolveLinearContext: deps?.resolveLinearContext,
    }
  );

  const repoContext = getRepoContextFromIntegrations(validatedIntegrations);
  const linearContext = getLinearContextFromIntegrations(validatedIntegrations);

  const systemPrompt = getStandaloneChatPrompt({
    repoContext,
    linearContext,
    toolDescriptions: descriptions,
    hasGitHubEnabled: hasGitHub,
    hasLinearEnabled: hasLinear,
  });

  const stream = streamText({
    model: modelWithMemory,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(maxSteps),
    experimental_transform: smoothStream(),
    onFinish({ totalUsage }) {
      deps?.onUsage?.(totalUsage, routingDecision.model);
    },
    onError({ error }) {
      console.error("[Standalone Chat Stream Error]", {
        organizationId,
        model: routingDecision.model,
        error: error instanceof Error ? error.message : String(error),
      });
    },
  });

  return { stream, routingDecision };
}

async function validateStandaloneIntegrations(
  organizationId: string,
  contextItems: StandaloneChatContextItem[],
  fetchers?: IntegrationFetchers
): Promise<ValidatedIntegration[]> {
  if (!contextItems.length || !fetchers) {
    return [];
  }

  const validatedIntegrations: ValidatedIntegration[] = [];

  const githubItems = contextItems.filter((c) => c.type === "github-repo");
  const linearItems = contextItems.filter((c) => c.type === "linear-team");

  if (githubItems.length > 0 && fetchers.getGitHubIntegrationById) {
    const integrationIds = [
      ...new Set(githubItems.map((c) => c.integrationId)),
    ];

    for (const integrationId of integrationIds) {
      try {
        const integration =
          await fetchers.getGitHubIntegrationById(integrationId);

        if (
          !integration ||
          integration.organizationId !== organizationId ||
          !integration.enabled
        ) {
          continue;
        }

        const contextRepos = githubItems
          .filter((c) => c.integrationId === integrationId)
          .map((c) => ({ owner: c.owner, repo: c.repo }));

        const enabledRepos = integration.repositories
          .filter((r) => {
            if (!r.enabled) {
              return false;
            }
            return contextRepos.some(
              (cr) => cr.owner === r.owner && cr.repo === r.repo
            );
          })
          .map((r) => ({
            id: r.id,
            owner: r.owner,
            repo: r.repo,
            defaultBranch: r.defaultBranch ?? null,
            enabled: r.enabled,
          }));

        if (enabledRepos.length === 0) {
          continue;
        }

        validatedIntegrations.push({
          id: integration.id,
          type: "github",
          enabled: integration.enabled,
          displayName: integration.displayName,
          organizationId: integration.organizationId,
          repositories: enabledRepos,
        });
      } catch (error) {
        console.error(
          `[Standalone Chat] Error validating GitHub integration ${integrationId}:`,
          error
        );
      }
    }
  }

  if (linearItems.length > 0 && fetchers.getLinearIntegrationById) {
    const integrationIds = [
      ...new Set(linearItems.map((c) => c.integrationId)),
    ];

    for (const integrationId of integrationIds) {
      try {
        const integration =
          await fetchers.getLinearIntegrationById(integrationId);

        if (
          !integration ||
          integration.organizationId !== organizationId ||
          !integration.enabled
        ) {
          continue;
        }

        validatedIntegrations.push({
          id: integration.id,
          type: "linear",
          enabled: integration.enabled,
          displayName: integration.displayName,
          organizationId: integration.organizationId,
          linearTeamId: integration.linearTeamId,
          linearTeamName: integration.linearTeamName,
        });
      } catch (error) {
        console.error(
          `[Standalone Chat] Error validating Linear integration ${integrationId}:`,
          error
        );
      }
    }
  }

  return validatedIntegrations;
}

function getLastUserMessage(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (!message) {
      continue;
    }
    if (message.role === "user") {
      const parts = message.parts;
      if (Array.isArray(parts)) {
        for (const part of parts) {
          if (part.type === "text") {
            return part.text;
          }
        }
      }
    }
  }
  return "";
}
