import { OutboxEnqueueError } from "@notra/ai/autonomy/errors";
import type {
  EnqueueOutboxMessageInput,
  EnqueueOutboxMessageResult,
} from "@notra/ai/types/autonomy";
import { db } from "@notra/db/drizzle";
import { autonomyOutbox } from "@notra/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { Effect } from "effect";

const CANCELABLE_OUTBOX_STATUSES = ["pending", "attempting", "failed"] as const;

export const enqueueOutboxMessage = Effect.fn("iris.outbox.enqueue")(function* (
  input: EnqueueOutboxMessageInput
) {
  const now = new Date();
  const outboxId = crypto.randomUUID();

  const inserted = yield* Effect.tryPromise({
    try: () =>
      db
        .insert(autonomyOutbox)
        .values({
          id: outboxId,
          organizationId: input.organizationId,
          runId: input.runId,
          destination: input.destination,
          dedupeKey: input.dedupeKey,
          payload: input.payload,
          status: "pending",
          attempts: 0,
          nextAttemptAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing({
          target: [
            autonomyOutbox.organizationId,
            autonomyOutbox.destination,
            autonomyOutbox.dedupeKey,
          ],
        })
        .returning({ id: autonomyOutbox.id }),
    catch: (cause) =>
      new OutboxEnqueueError({
        message: "Failed to enqueue outbox message",
        cause,
      }),
  });

  const insertedId = inserted.at(0)?.id;
  if (insertedId !== undefined) {
    yield* Effect.annotateLogs(Effect.logInfo("iris.outbox.enqueued"), {
      organizationId: input.organizationId,
      runId: input.runId,
      outboxId: insertedId,
      destination: input.destination,
    });
    return {
      outboxId: insertedId,
      deduplicated: false,
    } satisfies EnqueueOutboxMessageResult;
  }

  const existing = yield* Effect.tryPromise({
    try: () =>
      db
        .select({ id: autonomyOutbox.id })
        .from(autonomyOutbox)
        .where(
          and(
            eq(autonomyOutbox.organizationId, input.organizationId),
            eq(autonomyOutbox.destination, input.destination),
            eq(autonomyOutbox.dedupeKey, input.dedupeKey)
          )
        )
        .limit(1),
    catch: (cause) =>
      new OutboxEnqueueError({
        message: "Failed to load deduplicated outbox message",
        cause,
      }),
  });

  const existingId = existing.at(0)?.id;
  if (existingId === undefined) {
    return yield* Effect.fail(
      new OutboxEnqueueError({
        message: "Outbox insert conflicted but no existing row was found",
        cause: null,
      })
    );
  }

  yield* Effect.annotateLogs(Effect.logDebug("iris.outbox.deduplicated"), {
    organizationId: input.organizationId,
    outboxId: existingId,
    destination: input.destination,
  });

  return {
    outboxId: existingId,
    deduplicated: true,
  } satisfies EnqueueOutboxMessageResult;
});

export const cancelPendingOutboxForOrganization = Effect.fn(
  "iris.outbox.cancelPending"
)(function* (organizationId: string) {
  const now = new Date();

  const rows = yield* Effect.tryPromise({
    try: () =>
      db
        .update(autonomyOutbox)
        .set({ status: "canceled", updatedAt: now })
        .where(
          and(
            eq(autonomyOutbox.organizationId, organizationId),
            inArray(autonomyOutbox.status, [...CANCELABLE_OUTBOX_STATUSES])
          )
        )
        .returning({ id: autonomyOutbox.id }),
    catch: (cause) =>
      new OutboxEnqueueError({
        message: "Failed to cancel pending outbox messages",
        cause,
      }),
  });

  yield* Effect.annotateLogs(Effect.logInfo("iris.outbox.canceled"), {
    organizationId,
    canceledCount: rows.length,
  });

  return rows.length;
});
