import { NextResponse } from "next/server";
import { joinRoom, resolveRoomIdFromCode } from "@/lib/room-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: raw } = await context.params;
    const codeOrId = resolveRoomIdFromCode(raw) ?? raw;
    const body = (await request.json()) as { displayName?: string };
    const displayName = (body.displayName ?? "").trim();
    if (!displayName) {
      return NextResponse.json({ error: "Display name is required." }, { status: 400 });
    }
    const { room, participant } = joinRoom({
      inviteCode: codeOrId,
      displayName,
    });
    return NextResponse.json({ room, participant });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not join.";
    const status = msg.includes("already") || msg.includes("full") ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
