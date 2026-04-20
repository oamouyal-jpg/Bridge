/** Bridge — AI-mediated communication. Not therapy or clinical service. */

export type RoomCategory = "relationship" | "family" | "friendship" | "workplace" | "other";

export type RoomStatus =
  | "waiting_for_second_participant"
  | "intake_in_progress"
  | "ready_for_mediation"
  | "active"
  | "paused"
  | "completed";

/** Paid/unlocked capabilities for a room (subscription-style flags). */
export type RoomEntitlements = {
  unlimitedMessages: boolean;
  /** Workplace pack: structured agenda tone, HR summary option, role labels */
  businessMode: boolean;
};

/** One-time generation credits (purchase adds +1). */
export type RoomCredits = {
  resolution: number;
  insightReport: number;
  prepareConversation: number;
};

export type Room = {
  id: string;
  title: string;
  inviteCode: string;
  category: RoomCategory;
  status: RoomStatus;
  participantIds: string[];
  /** Total seats including the host (min 2, max 12). Couple rooms use 2; family/work can be higher. */
  maxParticipants: number;
  createdAt: string;
  updatedAt: string;
  /** True when category is workplace — business pack still requires entitlement */
  isBusiness: boolean;
  entitlements: RoomEntitlements;
};

export type ResolutionGenerationType =
  | "repair"
  | "boundary"
  | "closure"
  | "prepare_meeting";

export type ResolutionGeneration = {
  type: ResolutionGenerationType;
  title: string;
  steps: string[];
  exampleMessage: string;
  guidance: string[];
  createdAt: string;
};

export type AdvancedInsightReport = {
  emotionalPatterns: string[];
  dynamicBetweenParticipants: string;
  repeatedTriggers: string[];
  riskPatterns: string[];
  communicationStrategy: string[];
  summary: string;
  createdAt: string;
};

export type PrepareConversationKind = "in_person" | "phone" | "final_message";

export type PrepareConversationResult = {
  kind: PrepareConversationKind;
  whatToSay: string[];
  whatToAvoid: string[];
  triggersToWatch: string[];
  toneGuidance: string;
  createdAt: string;
};

export type PaymentProductType =
  | "resolution"
  | "insight"
  | "extend_session"
  | "subscription"
  | "business"
  | "prepare";

export type TranslationMode = "softened" | "direct_respectful" | "emotionally_honest";

export type Participant = {
  id: string;
  roomId: string;
  displayName: string;
  joinedAt: string;
  translationMode: TranslationMode;
  intakeCompleted: boolean;
};

export type IntakeMessage = {
  id: string;
  roomId: string;
  participantId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type PrivateRawMessage = {
  id: string;
  roomId: string;
  participantId: string;
  content: string;
  createdAt: string;
};

/**
 * Per-message structured signal extracted by the mediator. Optional because
 * mediation pre-dates this field (older rooms will not have it) and the
 * sender may choose to override the mediated version with their own wording,
 * in which case no analysis is computed.
 */
export type MessageAnalysis = {
  feelings: string[];
  needs: string[];
  fears: string[];
  intent: string;
  /** 1–10 subjective emotional intensity the mediator inferred. */
  intensity: number;
};

export type SharedMediatedMessage = {
  id: string;
  roomId: string;
  sourceParticipantId: string;
  mediatedContent: string;
  detectedIntent?: string;
  createdAt: string;
  /** 1–10 inferred escalation risk of this specific mediated line. */
  escalationRisk?: number;
  /** Present when Bridge actually mediated the text. Absent when the sender
   *  chose to deliver their own wording verbatim (still screened for safety). */
  analysis?: MessageAnalysis;
  /**
   * How this message reached the shared thread:
   *  - "mediated": AI rewrite of the raw draft (default).
   *  - "mediated_edited": sender saw the mediation and edited it before sending.
   *  - "sender_original": sender chose to send their own wording.
   */
  deliveryMode?: "mediated" | "mediated_edited" | "sender_original";
};

export type InsightCardType = "reflection" | "warning" | "goal" | "reframe" | "pattern";

export type InsightCard = {
  id: string;
  roomId: string;
  participantId: string;
  title: string;
  body: string;
  type: InsightCardType;
  createdAt: string;
};

export type EmotionalPrimary =
  | "hurt"
  | "angry"
  | "fearful"
  | "overwhelmed"
  | "shut_down"
  | "confused"
  | "resentful";

export type ParticipantProfile = {
  participantId: string;
  presentingComplaint: string;
  emotionalState: {
    primary: EmotionalPrimary;
    secondary?: string;
    intensity: number;
  };
  coreNeeds: string[];
  dominantFears: string[];
  triggers: string[];
  conflictStyle:
    | "pursuing"
    | "withdrawing"
    | "defensive"
    | "appeasing"
    | "controlling"
    | "mixed";
  communicationRisks: string[];
  desiredOutcome:
    | "repair"
    | "clarity"
    | "apology"
    | "boundary"
    | "space"
    | "closure"
    | "unknown";
  opennessToRepair: number;
  readinessForMediation: number;
  summary: string;
};

export type ConflictMap = {
  roomId: string;
  surfaceIssue: string;
  underlyingIssue: string;
  participantAView: string;
  participantBView: string;
  sharedNeeds: string[];
  opposingNeeds: string[];
  escalationRisks: string[];
  mediationGoals: string[];
  recommendedTone: "gentle" | "direct" | "structured";
  summary: string;
};

export type RealityFlagType =
  | "absolute_language"
  | "mind_reading"
  | "fact_feeling_mix"
  | "accountability_gap"
  | "double_standard"
  | "contradiction"
  | "unsupported_claim"
  | "blame_heavy"
  | "guilt_framing"
  | "selective_framing";

export type RealityCheckResult = {
  hasConcern: boolean;
  severity: number;
  flags: {
    type: RealityFlagType;
    title: string;
    body: string;
  }[];
  suggestedAction: "send" | "revise_before_send" | "add_context";
};

export type SessionDebrief = {
  whatEachSideNeeds: string[];
  coreStruggle: string;
  misunderstandings: string[];
  bestNextStep: string;
  repairMessage?: string;
  boundaryMessage?: string;
  closureMessage?: string;
};

/** Observable interaction patterns only — never a diagnosis or person-label. */
export type RoomRiskState = {
  score: number;
  level: "low" | "medium" | "high";
  signals: string[];
  message: string;
  lastUpdated: string;
};

export type IntakeSignals = {
  possible_emotions: string[];
  possible_needs: string[];
  possible_fears: string[];
  possible_desired_outcomes: string[];
};

export type IntakeTurnResult = {
  message: string;
  enough_information: boolean;
  signals: IntakeSignals;
};
