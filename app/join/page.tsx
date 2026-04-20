"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WarmPageFrame } from "@/components/WarmPageFrame";
import { saveSession } from "@/lib/bridge-session";

export default function JoinRoomPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromLink = params.get("code")?.trim();
    if (fromLink) setCode(fromLink);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const trimmed = code.trim();
      const res = await fetch(`/api/rooms/${encodeURIComponent(trimmed)}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      });
      const data = (await res.json()) as {
        error?: string;
        room?: { id: string };
        participant?: { id: string; displayName: string };
      };
      if (!res.ok) throw new Error(data.error ?? "Could not join.");
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
              <CardTitle className="font-display text-2xl">Join a room</CardTitle>
              <CardDescription>
                You were invited into a gentler kind of conversation. If they&apos;re still in their
                private background chat, that&apos;s okay — you&apos;ll get your own space first, then
                the shared room opens when you&apos;re both ready.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-5">
                <label className="block text-sm font-medium text-bridge-ink">
                  Invite code
                  <Input
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="mt-2 font-mono"
                    placeholder="6 characters"
                    disabled={loading}
                  />
                </label>
                <label className="block text-sm font-medium text-bridge-ink">
                  Display name
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2"
                    disabled={loading}
                  />
                </label>
                {error && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-bridge-warn">
                    {error}
                  </p>
                )}
                <Button type="submit" disabled={loading} className="w-full rounded-full">
                  {loading ? "Joining…" : "Join room"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </WarmPageFrame>
  );
}
