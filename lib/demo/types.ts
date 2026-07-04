export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  participant?: "a" | "b";
};

export type DemoPhaseId =
  | "private_a"
  | "private_b"
  | "invite"
  | "mediated_intro"
  | "guided_exchange"
  | "resolution";

export type DemoScript = {
  id: string;
  label: string;
  description?: string;
  stepMs: number;
  pauseAfterTypeMs?: number;
  phases: {
    id: DemoPhaseId;
    title: string;
    subtitle?: string;
  }[];
  beats: DemoBeat[];
};

export type DemoBeat =
  | {
      kind: "type_user";
      participant: "a" | "b";
      text: string;
    }
  | {
      kind: "assistant";
      participant?: "a" | "b";
      text: string;
    }
  | {
      kind: "invite_sent";
      toName: string;
    }
  | {
      kind: "joint_system";
      text: string;
    }
  | {
      kind: "summary_panel";
      headline: string;
      bullets: [string, string];
      guidance: string;
    }
  | {
      kind: "joint_message";
      participant: "a" | "b";
      text: string;
    }
  | {
      kind: "resolution";
      text: string;
    };
