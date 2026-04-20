/**
 * Quick end-to-end check that the SQLite store round-trips a populated
 * aggregate (Maps, nested arrays, undefined optional fields, everything).
 * Run with: `npx tsx scripts/smoke-sqlite-store.ts`
 *
 * This is not part of the app's runtime — it's a dev-only sanity script.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
  const tmp = mkdtempSync(join(tmpdir(), "bridge-smoke-"));
  const dbPath = join(tmp, "bridge.db");
  process.env.BRIDGE_DB_PATH = dbPath;
  process.env.NODE_ENV = "test";

  const store = await import("../lib/store");
  const { createRoom } = await import("../lib/room-service");

  const { room, participant, aggregate } = createRoom({
    title: "Smoke test",
    displayName: "Alice",
    category: "relationship",
  });
  console.log("created:", { roomId: room.id, code: room.inviteCode, participant: participant.id });

  aggregate.privateRawMessages.push({
    id: "m1",
    roomId: room.id,
    participantId: participant.id,
    createdAt: new Date().toISOString(),
    rawText: "hello",
  });
  aggregate.intakeMessages.set(participant.id, [
    {
      id: "im1",
      roomId: room.id,
      participantId: participant.id,
      role: "assistant",
      content: "what brings you here?",
      createdAt: new Date().toISOString(),
    },
  ]);
  aggregate.intakeAssistantTurns.set(participant.id, 1);
  store.saveRoomAggregate(aggregate);

  const reloaded = store.getOrCreateAggregate(room.id);
  if (!reloaded) throw new Error("aggregate disappeared");

  const checks = [
    ["participants.size", reloaded.participants.size, 1],
    ["intakeMessages.size", reloaded.intakeMessages.size, 1],
    ["intakeMessages[0].content",
      reloaded.intakeMessages.get(participant.id)?.[0]?.content,
      "what brings you here?"],
    ["intakeAssistantTurns",
      reloaded.intakeAssistantTurns.get(participant.id),
      1],
    ["privateRawMessages.length", reloaded.privateRawMessages.length, 1],
    ["privateRawMessages[0].rawText",
      reloaded.privateRawMessages[0]?.rawText,
      "hello"],
  ] as const;

  let allOk = true;
  for (const [label, got, want] of checks) {
    const ok = got === want;
    console.log(`${ok ? "ok" : "FAIL"}  ${label}: got=${String(got)} want=${String(want)}`);
    if (!ok) allOk = false;
  }

  const byCode = store.resolveRoomIdFromInviteCode(room.inviteCode);
  console.log(`${byCode === room.id ? "ok" : "FAIL"}  resolveRoomIdFromInviteCode: got=${byCode}`);
  if (byCode !== room.id) allOk = false;

  console.log(`\nDB file: ${dbPath}`);

  // Clean up the tmp dir so smoke runs don't pile up. Best-effort.
  try {
    rmSync(tmp, { recursive: true, force: true });
  } catch {
    /* ignore */
  }

  if (!allOk) {
    console.error("smoke test FAILED");
    process.exit(1);
  }
  console.log("smoke test passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
