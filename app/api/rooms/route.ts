import { NextResponse } from "next/server";
import { createRoom } from "@/lib/room-service";
import type { RoomCategory } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      displayName?: string;
      category?: RoomCategory;
      maxParticipants?: unknown;
    };
    const title = (body.title ?? "").trim();
    const displayName = (body.displayName ?? "").trim();
    if (!displayName) {
      return NextResponse.json({ error: "Display name is required." }, { status: 400 });
    }
    const category = body.category ?? "other";
    const { room, participant } = createRoom({
      title: title || "Conversation",
      displayName,
      category,
      maxParticipants: body.maxParticipants,
    });
    return NextResponse.json({ room, participant });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create room.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
