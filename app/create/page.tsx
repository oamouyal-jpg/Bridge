"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WarmPageFrame } from "@/components/WarmPageFrame";
import { saveSession } from "@/lib/bridge-session";
import {
  ROOM_PARTICIPANT_CAP_MAX,
  ROOM_PARTICIPANT_CAP_MIN,
  suggestedMaxParticipants,
} from "@/lib/room-capacity";
import type { RoomCategory } from "@/lib/types";

const categories: { id: RoomCategory; label: string }[] = [
  { id: "relationship", label: "Relationship" },
  { id: "family", label: "Family" },
  { id: "friendship", label: "Friendship" },
  { id: "workplace", label: "Workplace" },
  { id: "other", label: "Other" },
];

export default function CreateRoomPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<RoomCategory>("relationship");
  const [maxParticipants, setMaxParticipants] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMaxParticipants(suggestedMaxParticipants(category));
  }, [category]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Bridge room",
          displayName: name,
          category,
          maxParticipants: category === "relationship" ? 2 : maxParticipants,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        room?: { id: string };
        participant?: { id: string; displayName: string };
      };
      if (!res.ok) throw new Error(data.error ?? "Could not create room.");
      if (!data.room || !data.participant) throw new Error("Invalid response.");
      saveSession(data.room.id, {
        participantId: data.participant.id,
        displayName: data.participant.displayName,
      });
      router.push(`/room/${data.room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <WarmPageFrame>
      <main className="min-h-screen px-4 py-12 sm:py-20">
        <div className="mx-auto max-w-lg">
          <Link href="/" className="text-sm text-bridge-stone transition-colors hover:text-bridge-ink">
            ← Back home
          </Link>
          <Card className="mt-6 border-bridge-mist shadow-[0_20px_60px_-24px_rgba(47,40,35,0.1)]">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Create a room</CardTitle>
              <CardDescription>
                Private intake first, then a shared mediated thread. Couple rooms are for two
                people; family and workplace rooms can include more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-5">
                <label className="block text-sm font-medium text-bridge-ink">
                  Room title
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-2"
                    placeholder="e.g. About last weekend"
                    disabled={loading}
                  />
                </label>
                <label className="block text-sm font-medium text-bridge-ink">
                  Your display name
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2"
                    placeholder="How you want to appear"
                    disabled={loading}
                  />
                </label>
                <div>
                  <p className="text-sm font-medium text-bridge-ink">Context</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          category === c.id
                            ? "border-bridge-ink bg-bridge-ink text-bridge-cream"
                            : "border-bridge-mist bg-white text-bridge-stone"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                {category !== "relationship" && (
                  <label className="block text-sm font-medium text-bridge-ink">
                    How many people total?
                    <span className="mt-1 block text-xs font-normal text-bridge-stone">
                      Including you. {ROOM_PARTICIPANT_CAP_MIN}–{ROOM_PARTICIPANT_CAP_MAX} — everyone
                      gets private intake before the shared thread.
                    </span>
                    <select
                      className="mt-2 w-full rounded-lg border border-bridge-mist bg-white px-3 py-2 text-sm text-bridge-ink"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(Number(e.target.value))}
                      disabled={loading}
                    >
                      {Array.from(
                        {
                          length: ROOM_PARTICIPANT_CAP_MAX - ROOM_PARTICIPANT_CAP_MIN + 1,
                        },
                        (_, i) => i + ROOM_PARTICIPANT_CAP_MIN
                      ).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {error && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-bridge-warn">
                    {error}
                  </p>
                )}
                <Button type="submit" disabled={loading} className="w-full rounded-full">
                  {loading ? "Creating…" : "Create room"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </WarmPageFrame>
  );
}
