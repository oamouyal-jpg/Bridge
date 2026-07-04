import type { DemoScript } from "../types";

export const defaultCoupleScript: DemoScript = {
  id: "default-couple",
  label: "Couple · presence vs. pressure",
  description: "Default screen-recording narrative.",
  stepMs: 42,
  pauseAfterTypeMs: 650,
  phases: [
    { id: "private_a", title: "Private session", subtitle: "You" },
    { id: "private_b", title: "Private session", subtitle: "Partner" },
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
      text: "I feel like she disappears when I need her most… and it hurts more than I admit.",
    },
    {
      kind: "assistant",
      participant: "a",
      text: "It sounds like you're not just feeling ignored — you're feeling alone in moments that matter.",
    },
    {
      kind: "type_user",
      participant: "b",
      text: "I feel like I'm constantly failing her… whatever I do isn't enough.",
    },
    {
      kind: "assistant",
      participant: "b",
      text: "You're not withdrawing because you don't care — you're protecting yourself from feeling inadequate.",
    },
    { kind: "invite_sent", toName: "Partner" },
    {
      kind: "summary_panel",
      headline: "Before we begin, here's what each of you is experiencing:",
      bullets: [
        "One feels alone when it matters most",
        "One feels overwhelmed and afraid of failing",
      ],
      guidance: "Let's speak from that place",
    },
    {
      kind: "joint_message",
      participant: "a",
      text: "I don't need you to be perfect… I just need to feel like you're there with me",
    },
    {
      kind: "joint_message",
      participant: "b",
      text: "I care about you… I just shut down when I feel like I can't get it right",
    },
    { kind: "resolution", text: "That I can hear…" },
  ],
};
