import { describe, expect, test } from "bun:test";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";

function runSlackChannel(scenario: string) {
  const runtime = realpathSync(
    resolve(import.meta.dir, "../node_modules/eve/dist/src")
  );
  const channelPath = resolve(import.meta.dir, "../agent/channels/slack.ts");
  const mirrorPath = resolve(
    import.meta.dir,
    "../agent/lib/utils/slack-chat-mirror.ts"
  );
  const controlsPath = resolve(
    import.meta.dir,
    "../agent/lib/utils/slack-controls.ts"
  );
  const postToXPath = resolve(
    import.meta.dir,
    "../agent/lib/utils/slack-post-x.ts"
  );
  const result = Bun.spawnSync(
    [
      process.execPath,
      "--no-env-file",
      "--eval",
      `
import { mock } from "bun:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { Effect } from "effect";
const scenario = ${JSON.stringify(scenario)};
const runtimePath = ${JSON.stringify(runtime)};
if (scenario === "chart-failure-with-publish") {
  mock.module(runtimePath + "/context/build-callback-context.js", () => ({
    buildCallbackContext: () => ({ session: { id: "session-1", auth: { current: null, initiator: null } } }),
  }));
}
process.env.SLACK_AGENT_SIGNING_SECRET = "fixture-signing-secret";
const installations = [
  { slackTeamId: "T-install", organizationId: "org-install", enabled: true, allowedChannelIds: scenario === "owner-policy" ? ["C-other"] : null, botToken: "fixture-install" },
  { slackTeamId: "T-actor", organizationId: "org-actor", enabled: true, allowedChannelIds: null, botToken: "fixture-actor" },
];
mock.module("@notra/ai/integrations/slack-workspace", () => ({
  getEnabledSlackIntegrations: async () => installations,
  getSlackIntegrationByTeamId: async (teamId) => installations.find((row) => row.slackTeamId === teamId) ?? null,
  getSlackIntegrationBotToken: (row) => row.botToken,
  disableSlackIntegrationByTeamId: async () => {},
  postSlackNotification: async () => {},
}));
const redisStore = new Map();
mock.module("@notra/ai/utils/redis", () => ({ redis: {
  get: async (key) => redisStore.get(key) ?? null,
  set: async (key, value, options) => {
    if (options?.xx && !redisStore.has(key)) return null;
    redisStore.set(key, value);
    return "OK";
  },
  getdel: async (key) => { const value = redisStore.get(key) ?? null; redisStore.delete(key); return value; },
} }));
const linkedLookups = [];
mock.module("@notra/tools/utils/social-accounts", () => ({
  isTwitterPublishConfigured: () => true,
  getLinkedTwitterAccounts: async (organizationId) => {
    linkedLookups.push(organizationId);
    return [{ id: "acct-" + organizationId, username: organizationId + "-x" }, { id: "alt-" + organizationId, username: organizationId + "-alt" }];
  },
}));
const published = [];
mock.module("@notra/tools/utils/social-publish", () => ({
  publishTwitterPost: (params) => Effect.sync(() => { published.push(params); return { postUrl: "https://x.com/example/status/1", confirmed: true }; }),
}));
mock.module("@notra/db/drizzle", () => ({ db: { select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ slug: "example" }] }) }) }) } }));
let enterMirror;
let releaseMirror;
const mirrorEntered = new Promise((resolve) => { enterMirror = resolve; });
const mirrorReleased = new Promise((resolve) => { releaseMirror = resolve; });
mock.module(${JSON.stringify(mirrorPath)}, () => ({ mirrorPublicSlackThread: () => Effect.promise(async () => {
  if (scenario === "leave-race" || scenario === "initial-status") { enterMirror(); await mirrorReleased; }
  return null;
}) }));
const outbound = [];
globalThis.fetch = async (url, init) => {
  outbound.push({ url: String(url), raw: String(init.body), authorization: new Headers(init.headers).get("authorization"), body: Object.fromEntries(new URLSearchParams(String(init.body))) });
  const name = new URL(String(url)).pathname.split("/").at(-1);
  if (name === "conversations.info") return Response.json({ ok: true, channel: { id: "C-room", is_private: false } });
  if (name === "conversations.replies") return Response.json({ ok: true, messages: [{ ts: "1.5", user: "U-other", text: "Prior topic" }] });
  return Response.json({ ok: true, ts: "posted-message" });
};
const { createSession } = await import(runtimePath + "/channel/session.js");
const { createChannelAddress } = await import(runtimePath + "/channel/channel-address.js");
let owner = "original-session";
let resets = 0;
const exactSends = [];
const created = [];
let addressSends = 0;
const runtime = {
  resolveContinuation: async () => owner ? { sessionId: owner } : undefined,
  dispatchSession: async ({ sessionId, command }) => {
    if (command.kind === "send") exactSends.push({ sessionId, command });
    if (sessionId !== owner) return { status: "session_not_active" };
    if (command.kind === "reset") { resets++; owner = undefined; return { status: "reset", previousSessionId: sessionId }; }
    return { status: "accepted", sessionId, deliveryId: "fixture-delivery" };
  },
  dispatchContinuation: async ({ command }) => {
    addressSends++;
    return owner ? { status: "accepted", sessionId: owner, deliveryId: "fixture-delivery" } : { status: "session_not_active" };
  },
  createSession: async (input) => { created.push(input); owner = "replacement-session"; return { sessionId: owner }; },
};
const originalSession = createSession(owner, runtime);
const address = createChannelAddress({ channelName: "slack", continuationToken: "C-room:1.0", adapter: { kind: "slack", state: {} }, runtime });
const { default: channel } = await import(${JSON.stringify(channelPath)});
const { handleSlackControl } = await import(${JSON.stringify(controlsPath)});
const { buildSlackBinding } = await import(runtimePath + "/public/channels/slack/api.js");
const binding = buildSlackBinding({ botToken: "fixture-install", channelId: "C-room", threadTs: "1.0", installationTeamId: "T-install", teamId: "T-actor" });
let eventId = 0;
const tasks = [];
const args = {
  from: () => address,
  resolveSession: async () => owner ? createSession(owner, runtime) : undefined,
  waitUntil: (task) => tasks.push(task), params: {}, requestIp: null,
};
async function request(payload, interactivity = false) {
  const body = interactivity ? new URLSearchParams({ payload: JSON.stringify(payload) }).toString() : JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = "v0=" + createHmac("sha256", "fixture-signing-secret").update("v0:" + timestamp + ":" + body).digest("hex");
  const response = await channel.routes[0].handler(new Request("http://localhost/eve/v1/slack", {
    method: "POST", body, headers: { "content-type": interactivity ? "application/x-www-form-urlencoded" : "application/json", "x-slack-request-timestamp": timestamp, "x-slack-signature": signature },
  }), args);
  assert.equal(response.status, 200);
}
async function message(text, mention = false) {
  await request({ type: "event_callback", team_id: "T-install", api_app_id: "A-notra", event_id: "event-" + (++eventId), authorizations: [{ is_bot: true, team_id: "T-install", user_id: "U-notra" }],
    event: { type: mention ? "app_mention" : "message", channel: "C-room", ...(scenario === "initial-status" ? {} : { thread_ts: "1.0" }), ts: "2." + eventId, user: "U-human", text } });
}
if (scenario === "initial-status") {
  owner = undefined;
  await message("<@U-notra> chart our GEO performance", true);
  await mirrorEntered;
  const statuses = outbound.filter((call) => call.url.endsWith("assistant.threads.setStatus"));
  assert.equal(statuses.length, 1);
  assert.equal(statuses[0].authorization, "Bearer fixture-install");
  assert.equal(statuses[0].body.channel_id, "C-room");
  assert.equal(statuses[0].body.thread_ts, "2.1");
  assert.equal(statuses[0].body.status, "Thinking...");
  assert.equal(created.length, 0);
  releaseMirror();
  await Promise.all(tasks);
  assert.equal(created.length, 1);
} else if (scenario === "chart-failure-with-publish") {
  for (const outcome of ["publish", "draft"]) {
    const messages = [];
    const state = {
      teamId: "T-install",
      notraChartFailureTurnId: "turn-1",
      ...(outcome === "publish" ? {
        notraPostToXTurnId: "turn-1",
        notraPostToXOutcome: { turnId: "turn-1", postUrl: "https://x.com/example/status/123", failed: false, confirmed: true },
      } : { notraDraftCompletion: { turnId: "turn-1", count: 1 } }),
    };
    await channel.adapter["message.completed"](
      { turnId: "turn-1", finishReason: "stop", message: "Done" },
      { state, thread: { post: async (text) => messages.push(text) } },
    );
    assert.equal(messages.length, 2);
    assert(messages[0].includes("couldn't render or upload"));
    assert(messages[1].includes(outcome === "publish" ? "Posted to X:" : "Saved as a draft."));
    assert.equal(state.notraChartFailureTurnId, undefined);
    assert.equal(state.notraPostToXTurnId, undefined);
    assert.equal(state.notraDraftCompletion, undefined);
  }
} else if (scenario === "owner-policy" || scenario === "external-actor") {
  await request({ type: "block_actions", app_installed_team_id: "T-install", team: { id: "T-install" }, user: { id: "U-human", team_id: scenario === "external-actor" ? "T-unknown" : "T-actor" },
    channel: { id: "C-room" }, message: { ts: "card-1", thread_ts: "1.0" }, actions: [{ action_id: "notra_leave_thread", value: JSON.stringify({ sessionId: "original-session", turnId: "turn-0" }) }] }, true);
  await Promise.all(tasks);
  assert.equal(resets, scenario === "owner-policy" ? 0 : 1);
  if (scenario === "external-actor") {
    assert.equal(outbound.length, 1);
    assert(outbound.every((call) => call.authorization === "Bearer fixture-install"));
  }
} else if (scenario === "post-x-slack-connect") {
  const pending = (organizationId) => JSON.stringify({ organizationId, accountId: "acct-" + organizationId, username: organizationId + "-x", text: "Hello" });
  redisStore.set("slack:post-x:call-install", pending("org-install"));
  redisStore.set("slack:post-x:call-actor", pending("org-actor"));
  const click = (action) => request({ type: "block_actions", app_installed_team_id: "T-install", team: { id: "T-install" }, user: { id: "U-human", team_id: "T-actor" },
    channel: { id: "C-room" }, message: { ts: "card-1", thread_ts: "1.0" }, actions: [action] }, true);
  for (const callId of ["call-install", "call-actor"]) {
    await click({ action_id: "notra_post_x_confirm:req-1", value: JSON.stringify({ requestId: "req-1", callId, username: "x" }) });
  }
  await click({ action_id: "notra_post_x_account:call-actor", selected_option: { value: JSON.stringify({ callId: "call-actor", accountId: "acct-install", username: "install" }) } });
  await Promise.all(tasks);
  assert.deepEqual(linkedLookups, ["org-install"]);
  const cards = outbound.filter((call) => call.url.endsWith("chat.postMessage"));
  assert.equal(cards.length, 1);
  assert(cards[0].raw.includes("org-install-alt"));
  assert(!cards[0].raw.includes("org-actor"));
  assert.equal(JSON.parse(redisStore.get("slack:post-x:call-actor")).accountId, "acct-org-actor");
} else if (scenario === "post-x-once") {
  const { publishPendingPostToX } = await import(${JSON.stringify(postToXPath)});
  redisStore.set("slack:post-x:call-1", JSON.stringify({ organizationId: "org-install", accountId: "acct-1", username: "notra", text: "Hello" }));
  const outcomes = await Promise.all([publishPendingPostToX("call-1", "turn-1"), publishPendingPostToX("call-1", "turn-1")]);
  assert.equal(published.length, 1);
  assert.equal(outcomes.filter(Boolean).length, 1);
  assert.equal(await publishPendingPostToX("call-1", "turn-2"), undefined);
  assert.equal(published.length, 1);
  // An account switch that read the post before the claim must not revive it.
  const { savePendingPostToX } = await import(${JSON.stringify(postToXPath)});
  assert.equal(await savePendingPostToX("call-1", { organizationId: "org-install", accountId: "acct-2", username: "other", text: "Hello" }, { onlyIfExists: true }), false);
  assert(!redisStore.has("slack:post-x:call-1"));
} else if (scenario === "leave-race") {
  await message("follow-up");
  await mirrorEntered;
  await handleSlackControl("leave", { thread: binding.thread, resolveSession: async () => originalSession });
  releaseMirror();
  await Promise.all(tasks);
  assert.equal(resets, 1);
  assert.equal(created.length, 0);
  assert.equal(addressSends, 0);
  assert.equal(exactSends.length, 1);
  assert.equal(exactSends[0].sessionId, "original-session");
  assert.equal(owner, undefined);
} else if (scenario === "reply") {
  await message("follow-up");
  await Promise.all(tasks);
  assert.equal(addressSends, 0);
  assert.equal(exactSends.length, 1);
  const content = JSON.stringify(exactSends[0].command.payload.message);
  assert(content.includes("follow-up"));
  assert(content.includes("Prior topic"));
  assert(content.includes("U-human"));
  assert.equal(exactSends[0].command.auth.attributes.organizationId, "org-install");
} else if (scenario === "mention-after-leave") {
  await handleSlackControl("leave", { thread: binding.thread, resolveSession: async () => originalSession });
  await message("unmentioned follow-up");
  await Promise.all(tasks);
  assert.equal(created.length, 0);
  await message("<@U-notra> start again", true);
  await Promise.all(tasks);
  assert.equal(created.length, 1);
  assert.equal(owner, "replacement-session");
}
`,
    ],
    { cwd: resolve(import.meta.dir, ".."), timeout: 30_000 }
  );
  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString());
  }
  expect(result.exitCode).toBe(0);
}

describe("Slack native channel boundaries", () => {
  test("the first top-level mention sets native status before preparing the session", () =>
    runSlackChannel("initial-status"));
  test("a chart failure does not hide successful publishing or draft creation", () =>
    runSlackChannel("chart-failure-with-publish"));
  test("Slack Connect checks the installation policy, not the actor policy", () =>
    runSlackChannel("owner-policy"));
  test("a valid installation's controls work for an external actor", () =>
    runSlackChannel("external-actor"));
  test("Post to X in Slack Connect only uses the installing organization", () =>
    runSlackChannel("post-x-slack-connect"));
  test("a pending Post to X publishes at most once", () =>
    runSlackChannel("post-x-once"));
  test("an in-flight ordinary reply cannot recreate a thread after Leave", () =>
    runSlackChannel("leave-race"));
  test("pinned replies preserve speaker attribution and thread context", () =>
    runSlackChannel("reply"));
  test("unmentioned replies stay ignored after Leave and a mention restarts the thread", () =>
    runSlackChannel("mention-after-leave"));
});
