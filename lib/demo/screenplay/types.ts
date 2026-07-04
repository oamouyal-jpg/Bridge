export type ScreenplayParticipantId = "him" | "her" | "bridge";

export type ScreenplayParticipant = {
  id: ScreenplayParticipantId;
  displayName: string;
  role: "participantA" | "participantB" | "mediator";
};

export type ScreenplayStep =
  | {
      type: "screenTitle";
      id: string;
      durationMs: number;
      title: string;
      subtitle?: string;
    }
  | {
      type: "privateSessionStart";
      id: string;
      durationMs: number;
      participant: Exclude<ScreenplayParticipantId, "bridge">;
      label: string;
    }
  | {
      type: "userMessage";
      id: string;
      durationMs: number;
      participant: Exclude<ScreenplayParticipantId, "bridge">;
      message: string;
    }
  | {
      type: "aiMessage";
      id: string;
      durationMs: number;
      participant: "bridge";
      message: string;
    }
  | {
      type: "inviteState";
      id: string;
      durationMs: number;
      title: string;
      subtitle?: string;
    }
  | {
      type: "bridgeSummary";
      id: string;
      durationMs: number;
      title: string;
      bullets: string[];
      insight?: string;
    }
  | {
      type: "bridgePrompt";
      id: string;
      durationMs: number;
      message: string;
    }
  | {
      type: "jointMessage";
      id: string;
      durationMs: number;
      participant: Exclude<ScreenplayParticipantId, "bridge">;
      message: string;
    }
  | {
      type: "endCard";
      id: string;
      durationMs: number;
      title: string;
      subtitle?: string;
      brand?: string;
      cta?: string;
    };

export type ScreenplayManifest = {
  id: string;
  title: string;
  category?: string;
  durationSeconds?: number;
  autoplay?: boolean;
  steps: ScreenplayStep[];
  participants: {
    him: ScreenplayParticipant;
    her: ScreenplayParticipant;
    bridge: ScreenplayParticipant;
  };
};
