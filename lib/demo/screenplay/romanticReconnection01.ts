import type { ScreenplayManifest } from "./types";

/** JSON-driven demo — romantic reconnection narrative (~35s). */
export const romanticReconnection01: ScreenplayManifest = {
  id: "romantic_reconnection_01",
  title: "Romantic Reconnection",
  category: "romantic",
  durationSeconds: 35,
  autoplay: true,
  steps: [
    {
      type: "screenTitle",
      id: "title_1",
      durationMs: 2200,
      title: "We didn’t stop loving each other.",
      subtitle: "We stopped understanding each other.",
    },
    {
      type: "privateSessionStart",
      id: "private_a_start",
      durationMs: 1200,
      participant: "him",
      label: "Private session",
    },
    {
      type: "userMessage",
      id: "private_a_msg_1",
      durationMs: 3200,
      participant: "him",
      message: "I feel like no matter what I do, it’s never enough for her… and I’m tired.",
    },
    {
      type: "aiMessage",
      id: "private_a_ai_1",
      durationMs: 3600,
      participant: "bridge",
      message:
        "It sounds like you're not just tired — you're feeling defeated, like you've lost before you even try.",
    },
    {
      type: "privateSessionStart",
      id: "private_b_start",
      durationMs: 1200,
      participant: "her",
      label: "Private session",
    },
    {
      type: "userMessage",
      id: "private_b_msg_1",
      durationMs: 3200,
      participant: "her",
      message:
        "I feel like he’s not really there for me anymore… like I’m alone even when he’s with me.",
    },
    {
      type: "aiMessage",
      id: "private_b_ai_1",
      durationMs: 3600,
      participant: "bridge",
      message: "You’re not just missing him — you’re grieving the closeness you used to feel.",
    },
    {
      type: "inviteState",
      id: "invite_1",
      durationMs: 1800,
      title: "Invite sent",
      subtitle: "Starting shared session",
    },
    {
      type: "bridgeSummary",
      id: "summary_1",
      durationMs: 5000,
      title: "Before we begin…",
      bullets: [
        "One of you feels like you're never enough.",
        "One of you feels alone even when together.",
      ],
      insight: "You’re both protecting yourselves… but missing each other.",
    },
    {
      type: "bridgePrompt",
      id: "prompt_1",
      durationMs: 2000,
      message: "Let’s speak from that place.",
    },
    {
      type: "jointMessage",
      id: "joint_msg_1",
      durationMs: 3000,
      participant: "him",
      message: "I think I stopped trying because I felt like I was failing you anyway.",
    },
    {
      type: "jointMessage",
      id: "joint_msg_2",
      durationMs: 3000,
      participant: "her",
      message: "I think I stopped opening up because I felt like you weren’t really there anymore.",
    },
    {
      type: "jointMessage",
      id: "joint_msg_3",
      durationMs: 2400,
      participant: "him",
      message: "I didn’t realise you felt that alone…",
    },
    {
      type: "jointMessage",
      id: "joint_msg_4",
      durationMs: 2400,
      participant: "her",
      message: "I didn’t realise you felt like you were failing…",
    },
    {
      type: "endCard",
      id: "end_1",
      durationMs: 3200,
      title: "You don’t need more arguments.",
      subtitle: "You need understanding.",
      brand: "Bridge",
      cta: "Start the conversation differently",
    },
  ],
  participants: {
    him: { id: "him", displayName: "Him", role: "participantA" },
    her: { id: "her", displayName: "Her", role: "participantB" },
    bridge: { id: "bridge", displayName: "Bridge AI", role: "mediator" },
  },
};
