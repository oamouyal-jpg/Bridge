import type { DemoScript } from "../types";

export const friendsRepairScript: DemoScript = {
  id: "friends-repair",
  label: "Friends · repair after distance",
  description: "Alternate script — swap from the demo toolbar.",
  stepMs: 38,
  pauseAfterTypeMs: 600,
  phases: [
    { id: "private_a", title: "Private session", subtitle: "You" },
    { id: "private_b", title: "Private session", subtitle: "Friend" },
    { id: "invite", title: "Invitation", subtitle: "Entering together" },
    {
      id: "mediated_intro",
      title: "Shared session",
      subtitle: "Bridge is present",
    },
    {
      id: "guided_exchange",
      title: "Guided exchange",
      subtitle: "Speaking from the real place",
    },
    {
      id: "resolution",
      title: "A shift",
      subtitle: "Something lands",
    },
  ],
  beats: [
    {
      kind: "type_user",
      participant: "a",
      text: "I've been carrying this quiet resentment… like you only reach out when it's convenient.",
    },
    {
      kind: "assistant",
      participant: "a",
      text: "Underneath that edge, it sounds like you miss being chosen — not just included when it's easy.",
    },
    {
      kind: "type_user",
      participant: "b",
      text: "I've been overwhelmed and embarrassed to say I'm not okay… so I go quiet instead of showing up messy.",
    },
    {
      kind: "assistant",
      participant: "b",
      text: "That silence isn't indifference — it's shame trying not to disappoint someone you care about.",
    },
    { kind: "invite_sent", toName: "Friend" },
    {
      kind: "summary_panel",
      headline: "Before we begin, here's what each of you is experiencing:",
      bullets: [
        "One feels dropped when life gets full",
        "One feels ashamed to need help out loud",
      ],
      guidance: "Let's speak from that place",
    },
    {
      kind: "joint_message",
      participant: "a",
      text: "I don't need a perfect friend… I need to know I still matter to you when things are hard.",
    },
    {
      kind: "joint_message",
      participant: "b",
      text: "You do matter. I pull back when I'm drowning — not because you don't.",
    },
    { kind: "resolution", text: "That I can hear…" },
  ],
};
