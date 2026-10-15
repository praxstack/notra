import type { IrisOutboxArtifact } from "@notra/ai/schemas/autonomy/outbox";
import {
  type IrisWorkflowPayload,
  irisWorkflowPayloadSchema,
} from "@notra/schemas/dashboard/workflows/iris";
import { flattenError } from "zod";

import type {
  IrisControllerProgress,
  IrisControllerResult,
} from "@/types/iris";
import {
  buildIrisHeadline,
  buildIrisNoOpHeadline,
} from "@/utils/iris-signal-summary";
import {
  collectDependentTaskIds,
  collectRemainingTaskIds,
} from "@/utils/iris-task-graph";

import {
  acquireIrisLease,
  cancelIrisTasks,
  claimIrisExecution,
  closeOpenIrisRun,
  coalesceIrisSignals,
  createIrisRun,
  ensureIrisRunCollection,
  evaluateIrisGate,
  finalizeIrisRun,
  gatherIrisContext,
  isIrisMandateActive,
  isRepeatedIrisGateBlock,
  loadIrisMandate,
  markIrisSignalsProcessed,
  persistIrisPlan,
  persistIrisPlannerOutput,
  persistIrisRunCost,
  planIrisRun,
  pollIrisSourcesStep,
  publishIrisOutbox,
  reapIrisExpiredClaims,
  recordIrisNoOpRun,
  releaseIrisLease,
  renewIrisLease,
  resolveIrisFlagForRun,
  restoreIrisSignals,
  runIrisTask,
  sweepIrisOutbox,
} from "./steps/iris-steps";

const LOG_PREFIX = "Iris";
const LEASE_LOST_REASON = "controller lease lost";

export async function irisControllerRun(
  payload: IrisWorkflowPayload
): Promise<IrisControllerResult> {
  "use workflow";

  const parseResult = irisWorkflowPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    console.error(
      `[${LOG_PREFIX}] Invalid payload:`,
      flattenError(parseResult.error)
    );
    return { status: "invalid_payload", runId: null, reason: null };
  }

  const { organizationId, trigger, executionId } = parseResult.data;
  const claimToken = `iris-claim-${executionId}`;
  const leaseToken = `iris-lease-${executionId}`;

  const claim = await claimIrisExecution({
    organizationId,
    executionId,
    claimToken,
  });
  if (!claim.claimed) {
    console.warn(
      `[${LOG_PREFIX}] Duplicate execution ${executionId} for org ${organizationId}, skipping`
    );
    return { status: "duplicate_execution", runId: null, reason: null };
  }

  const lease = await acquireIrisLease({
    organizationId,
    ownerToken: leaseToken,
  });
  if (!lease.acquired) {
    console.warn(
      `[${LOG_PREFIX}] Another controller holds the lease for org ${organizationId}, skipping`
    );
    return { status: "controller_busy", runId: null, reason: null };
  }

  const progress: IrisControllerProgress = {
    runId: null,
    coalescedSignalIds: [],
  };

  try {
    return await runIrisMission({
      organizationId,
      trigger,
      leaseToken,
      progress,
    });
  } catch (error) {
    if (progress.runId !== null) {
      await closeOpenIrisRun({ organizationId, runId: progress.runId });
    }
    await restoreIrisSignals({
      organizationId,
      signalIds: progress.coalescedSignalIds,
    });
    await releaseIrisLease({ organizationId, ownerToken: leaseToken });
    throw error;
  }
}

async function runIrisMission(input: {
  organizationId: string;
  trigger: IrisWorkflowPayload["trigger"];
  leaseToken: string;
  progress: IrisControllerProgress;
}): Promise<IrisControllerResult> {
  const { organizationId, trigger, leaseToken, progress } = input;
  const releaseLease = () =>
    releaseIrisLease({ organizationId, ownerToken: leaseToken });

  const context = await loadIrisMandate(organizationId);
  const mandate = context.mandate;
  if (!mandate) {
    await releaseLease();
    return { status: "no_active_mandate", runId: null, reason: null };
  }

  const flagState = await resolveIrisFlagForRun(organizationId);
  if (flagState === "disabled") {
    await releaseLease();
    return { status: "flag_disabled", runId: null, reason: null };
  }

  if (trigger === "wake" || trigger === "manual") {
    await pollIrisSourcesStep({ organizationId });
    await sweepIrisOutbox({ organizationId });
  }

  const gathered = await gatherIrisContext(organizationId);
  const gate = await evaluateIrisGate({
    mandate,
    pendingSignalCount: gathered.pendingSignalCount,
    actionsInLast24h: gathered.actionsInLast24h,
    costCentsInLast24h: gathered.costCentsInLast24h,
  });

  if (!gate.proceed) {
    let noOpRunId: string | null = null;
    const isManualTrigger = trigger === "manual";
    const repeatedGateBlock =
      isManualTrigger || gathered.pendingSignalCount === 0
        ? false
        : await isRepeatedIrisGateBlock({
            organizationId,
            reason: gate.reason,
          });

    if (
      isManualTrigger ||
      (gathered.pendingSignalCount > 0 && !repeatedGateBlock)
    ) {
      const created = await createIrisRun({
        organizationId,
        mandateId: mandate.id,
        mandateVersion: mandate.version,
        trigger,
      });
      noOpRunId = created.runId;
      progress.runId = noOpRunId;

      await recordIrisNoOpRun({
        runId: noOpRunId,
        mandate,
        reason: gate.reason,
        consumedSignalIds: gathered.pendingSignalIds,
      });

      if (isManualTrigger) {
        await publishIrisOutbox({
          organizationId,
          runId: noOpRunId,
          allowedDestinations: mandate.policy.allowedDestinations,
          payload: {
            kind: "no_op",
            runId: noOpRunId,
            headline: buildIrisNoOpHeadline(
              gathered.pendingSignalCount,
              gate.reason
            ),
            signalCount: gathered.pendingSignalCount,
            artifacts: [],
            trigger,
            organizationSlug: context.organizationSlug,
          },
        });
      }
    }

    await releaseLease();
    await reapIrisExpiredClaims();
    return { status: "gate_blocked", runId: noOpRunId, reason: gate.reason };
  }

  const created = await createIrisRun({
    organizationId,
    mandateId: mandate.id,
    mandateVersion: mandate.version,
    trigger,
  });
  const runId = created.runId;
  progress.runId = runId;

  const coalesced = await coalesceIrisSignals({
    organizationId,
    signalIds: gathered.pendingSignalIds,
  });
  progress.coalescedSignalIds = coalesced.signalIds;
  const markSignalsProcessed = () =>
    markIrisSignalsProcessed({
      organizationId,
      signalIds: coalesced.signalIds,
    });

  const plan = await planIrisRun({
    runId,
    mandate,
    signalSummaries: coalesced.summaries,
    recentActionSummaries: gathered.recentActionSummaries,
  });

  const output = plan.output;
  const finalizeWithoutGoal = (status: "completed" | "failed") =>
    finalizeIrisRun({
      organizationId,
      runId,
      status,
      costCents: plan.costCents,
      goalId: null,
      goalStatus: null,
    });

  if (output !== null && plan.inputHash !== undefined) {
    await persistIrisPlannerOutput({
      runId,
      plannerOutput: output,
      plannerInputHash: plan.inputHash,
      costCents: plan.costCents,
    });
  }

  if (plan.status === "rejected" || output === null) {
    await finalizeWithoutGoal("failed");
    await markSignalsProcessed();
    await releaseLease();
    return {
      status: "plan_rejected",
      runId,
      reason: plan.violations.join("; ") || "The plan was rejected",
    };
  }

  if (output.decision === "no_op") {
    await finalizeWithoutGoal("completed");
    await markSignalsProcessed();
    await releaseLease();
    return { status: "no_op", runId, reason: output.reason };
  }

  if (output.decision === "escalate") {
    await finalizeWithoutGoal("completed");
    await publishIrisOutbox({
      organizationId,
      runId,
      allowedDestinations: mandate.policy.allowedDestinations,
      payload: {
        kind: "no_op",
        runId,
        headline: `Iris needs a decision from you: ${output.reason}`,
        signalCount: coalesced.signalIds.length,
        artifacts: [],
        trigger,
        organizationSlug: context.organizationSlug,
      },
    });
    await markSignalsProcessed();
    await releaseLease();
    return { status: "escalated", runId, reason: output.reason };
  }

  const goal = output.goal;
  if (!goal) {
    await finalizeWithoutGoal("failed");
    await markSignalsProcessed();
    await releaseLease();
    return {
      status: "plan_rejected",
      runId,
      reason: "The plan did not include a goal",
    };
  }

  const [persisted, collection] = await Promise.all([
    persistIrisPlan({
      organizationId,
      mandateId: mandate.id,
      runId,
      goal,
      tasks: output.tasks,
      originSignalIds: coalesced.signalIds,
    }),
    ensureIrisRunCollection({
      organizationId,
      runId,
    }),
  ]);

  const canceledTaskIds = new Set<string>();
  const artifacts: IrisOutboxArtifact[] = [];
  let succeededCount = 0;
  let tasksAttempted = 0;
  let costCents = plan.costCents;

  let mandateRevoked = false;
  let leaseLost = false;

  for (const task of persisted.tasks) {
    if (canceledTaskIds.has(task.taskId)) {
      continue;
    }
    const cancelRemainingTasks = (reason: string) =>
      cancelIrisTasks({
        taskIds: collectRemainingTaskIds(
          persisted.tasks,
          canceledTaskIds,
          task.taskId
        ),
        reason,
      });

    const projectedActions = gathered.actionsInLast24h + tasksAttempted;
    const projectedCostCents = gathered.costCentsInLast24h + costCents;
    if (
      projectedActions >= mandate.policy.maxActionsPerDay ||
      projectedCostCents >= mandate.policy.maxCostCentsPerDay
    ) {
      await cancelRemainingTasks(
        "The daily action or spend budget was reached"
      );
      break;
    }

    const leaseHeld = await renewIrisLease({
      organizationId,
      ownerToken: leaseToken,
    });
    if (!leaseHeld) {
      leaseLost = true;
      await cancelRemainingTasks("The controller lease was lost");
      break;
    }

    const stillActive = await isIrisMandateActive(organizationId);
    if (!stillActive) {
      mandateRevoked = true;
      await cancelRemainingTasks("Iris was paused");
      break;
    }

    const outcome = await runIrisTask({
      organizationId,
      runId,
      mandate,
      collectionId: collection.collectionId,
      task,
      signalContext: {
        primarySignal: coalesced.primarySignal,
        summaries: coalesced.summaries,
      },
    });

    tasksAttempted += 1;
    costCents += outcome.costCents;
    await persistIrisRunCost({ organizationId, runId, costCents });

    if (outcome.status === "succeeded") {
      succeededCount += 1;
      artifacts.push(...outcome.artifacts);
      continue;
    }

    const blocked = collectDependentTaskIds(
      persisted.tasks,
      task.taskId
    ).filter((taskId) => !canceledTaskIds.has(taskId));

    for (const taskId of blocked) {
      canceledTaskIds.add(taskId);
    }

    await cancelIrisTasks({
      taskIds: blocked,
      reason: `Blocked by failed task ${task.localId}`,
    });
  }

  if (leaseLost) {
    await restoreIrisSignals({
      organizationId,
      signalIds: coalesced.signalIds,
    });
    await finalizeIrisRun({
      organizationId,
      runId,
      status: "failed",
      costCents,
      goalId: persisted.goalId,
      goalStatus: "abandoned",
    });
    console.warn(
      `[${LOG_PREFIX}] Lost the controller lease for org ${organizationId}, stopping run ${runId}`
    );
    return { status: "failed", runId, reason: LEASE_LOST_REASON };
  }

  const runStatus = succeededCount > 0 ? "completed" : "failed";

  await finalizeIrisRun({
    organizationId,
    runId,
    status: runStatus,
    costCents,
    goalId: persisted.goalId,
    goalStatus: succeededCount > 0 ? "completed" : "abandoned",
  });

  if (mandateRevoked) {
    await markSignalsProcessed();
    await releaseLease();
    return { status: runStatus, runId, reason: "Iris was paused" };
  }

  await publishIrisOutbox({
    organizationId,
    runId,
    allowedDestinations: mandate.policy.allowedDestinations,
    payload: {
      kind: "run_summary",
      runId,
      headline: buildIrisHeadline(artifacts.length, coalesced.signalIds.length),
      signalCount: coalesced.signalIds.length,
      artifacts,
      trigger,
      organizationSlug: context.organizationSlug,
    },
  });

  await markSignalsProcessed();

  await releaseLease();
  await reapIrisExpiredClaims();

  return { status: runStatus, runId, reason: null };
}
