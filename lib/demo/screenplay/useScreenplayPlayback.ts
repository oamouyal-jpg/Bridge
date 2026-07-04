"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "../types";
import type { ScreenplayManifest, ScreenplayParticipantId } from "./types";

let idCounter = 0;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function toChatParticipant(p: Exclude<ScreenplayParticipantId, "bridge">): "a" | "b" {
  return p === "him" ? "a" : "b";
}

export type ScreenplayPlayback = {
  manifest: ScreenplayManifest;
  messages: ChatMessage[];
  composerText: string;
  sessionKind: "private" | "joint";
  /** Active private voice for typing / labels */
  privateParticipant: Exclude<ScreenplayParticipantId, "bridge">;
  showAssistantTyping: boolean;
  screenTitle: null | { title: string; subtitle?: string };
  invite: null | { title: string; subtitle?: string };
  endCard: null | { title: string; subtitle?: string; brand?: string; cta?: string };
  summary: null | { title: string; bullets: string[]; insight?: string };
  summaryVisible: boolean;
  bridgePrompt: null | { message: string };
  bridgePromptVisible: boolean;
  stepIndex: number;
  phaseLabel: string;
  isRunning: boolean;
  isComplete: boolean;
  replay: () => void;
};

export function useScreenplayPlayback(manifest: ScreenplayManifest): ScreenplayPlayback {
  const manifestRef = useRef(manifest);
  const cancelRef = useRef(false);
  const runIdRef = useRef(0);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composerText, setComposerText] = useState("");
  const [sessionKind, setSessionKind] = useState<"private" | "joint">("private");
  const [privateParticipant, setPrivateParticipant] =
    useState<Exclude<ScreenplayParticipantId, "bridge">>("him");
  const [showAssistantTyping, setShowAssistantTyping] = useState(false);
  const [screenTitle, setScreenTitle] = useState<ScreenplayPlayback["screenTitle"]>(null);
  const [invite, setInvite] = useState<ScreenplayPlayback["invite"]>(null);
  const [endCard, setEndCard] = useState<ScreenplayPlayback["endCard"]>(null);
  const [summary, setSummary] = useState<ScreenplayPlayback["summary"]>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [bridgePrompt, setBridgePrompt] = useState<ScreenplayPlayback["bridgePrompt"]>(null);
  const [bridgePromptVisible, setBridgePromptVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [phaseLabel, setPhaseLabel] = useState("");
  const [isRunning, setIsRunning] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  const sleep = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }, []);

  const waitUnlessCancelled = useCallback(
    async (ms: number) => {
      const id = runIdRef.current;
      await sleep(ms);
      if (cancelRef.current || runIdRef.current !== id) {
        throw new Error("cancelled");
      }
    },
    [sleep],
  );

  const withBudget = useCallback(
    async (durationMs: number, run: () => Promise<void>) => {
      const t0 = Date.now();
      await run();
      const elapsed = Date.now() - t0;
      const rest = durationMs - elapsed;
      if (rest > 0) await waitUnlessCancelled(rest);
    },
    [waitUnlessCancelled],
  );

  const runSequence = useCallback(async () => {
    const m = manifestRef.current;
    const push = (msg: ChatMessage) => setMessages((prev) => [...prev, msg]);

    setMessages([]);
    setComposerText("");
    setSessionKind("private");
    setPrivateParticipant("him");
    setShowAssistantTyping(false);
    setScreenTitle(null);
    setInvite(null);
    setEndCard(null);
    setSummary(null);
    setSummaryVisible(false);
    setBridgePrompt(null);
    setBridgePromptVisible(false);
    setStepIndex(0);
    setPhaseLabel("");
    setIsComplete(false);

    const typeUserMessage = async (
      text: string,
      side: Exclude<ScreenplayParticipantId, "bridge">,
      durationMs: number,
    ) => {
      const typeBudget = Math.max(500, Math.floor(durationMs * 0.58));
      const perChar = Math.min(52, Math.max(14, Math.floor(typeBudget / Math.max(text.length, 1))));
      setComposerText("");
      for (let i = 0; i < text.length; i += 1) {
        setComposerText((prev) => prev + text[i]);
        await waitUnlessCancelled(perChar);
      }
      await waitUnlessCancelled(Math.min(380, Math.floor(durationMs * 0.08)));
      push({
        id: nextId("u"),
        role: "user",
        content: text,
        participant: toChatParticipant(side),
      });
      setComposerText("");
    };

    let activePrivate: Exclude<ScreenplayParticipantId, "bridge"> = "him";

    try {
      for (let i = 0; i < m.steps.length; i += 1) {
        const step = m.steps[i];
        setStepIndex(i);

        switch (step.type) {
          case "screenTitle": {
            setPhaseLabel("Opening");
            setScreenTitle({ title: step.title, subtitle: step.subtitle });
            await waitUnlessCancelled(step.durationMs);
            setScreenTitle(null);
            break;
          }

          case "privateSessionStart": {
            setSessionKind("private");
            activePrivate = step.participant;
            setPrivateParticipant(step.participant);
            setPhaseLabel(step.label);
            if (step.participant === "her") {
              setMessages([]);
              setComposerText("");
            }
            await waitUnlessCancelled(step.durationMs);
            break;
          }

          case "userMessage": {
            setSessionKind("private");
            activePrivate = step.participant;
            setPrivateParticipant(step.participant);
            setPhaseLabel("Private session");
            await withBudget(step.durationMs, async () => {
              await typeUserMessage(step.message, step.participant, step.durationMs);
            });
            break;
          }

          case "aiMessage": {
            setPhaseLabel("Private session");
            await withBudget(step.durationMs, async () => {
              setShowAssistantTyping(true);
              await waitUnlessCancelled(Math.min(640, Math.floor(step.durationMs * 0.18)));
              setShowAssistantTyping(false);
              push({
                id: nextId("a"),
                role: "assistant",
                content: step.message,
                participant: toChatParticipant(activePrivate),
              });
            });
            break;
          }

          case "inviteState": {
            setPhaseLabel("Invitation");
            setInvite({ title: step.title, subtitle: step.subtitle });
            await waitUnlessCancelled(step.durationMs);
            setInvite(null);
            setMessages([]);
            setComposerText("");
            setSessionKind("joint");
            setPhaseLabel("Shared session");
            break;
          }

          case "bridgeSummary": {
            setSummary({
              title: step.title,
              bullets: step.bullets,
              insight: step.insight,
            });
            setSummaryVisible(true);
            await waitUnlessCancelled(step.durationMs);
            break;
          }

          case "bridgePrompt": {
            setBridgePrompt({ message: step.message });
            setBridgePromptVisible(true);
            await waitUnlessCancelled(step.durationMs);
            setBridgePromptVisible(false);
            setBridgePrompt(null);
            break;
          }

          case "jointMessage": {
            setSessionKind("joint");
            setPhaseLabel("Guided exchange");
            await withBudget(step.durationMs, async () => {
              push({
                id: nextId("j"),
                role: "user",
                content: step.message,
                participant: toChatParticipant(step.participant),
              });
            });
            break;
          }

          case "endCard": {
            setPhaseLabel("Closing");
            setEndCard({
              title: step.title,
              subtitle: step.subtitle,
              brand: step.brand,
              cta: step.cta,
            });
            await waitUnlessCancelled(step.durationMs);
            /* Keep the end card on screen until Replay (clearing only at sequence start). */
            break;
          }
        }
      }

      setIsComplete(true);
      setIsRunning(false);
    } catch {
      /* cancelled */
    }
  }, [waitUnlessCancelled, withBudget]);

  useEffect(() => {
    manifestRef.current = manifest;
  }, [manifest]);

  useEffect(() => {
    if (!isRunning) return undefined;

    cancelRef.current = false;
    runIdRef.current += 1;
    const id = runIdRef.current;

    void (async () => {
      await runSequence();
      if (runIdRef.current !== id) return;
    })();

    return () => {
      cancelRef.current = true;
      runIdRef.current += 1;
    };
  }, [isRunning, manifest.id, runSequence]);

  const replay = useCallback(() => {
    cancelRef.current = true;
    runIdRef.current += 1;
    setIsRunning(false);
    window.setTimeout(() => setIsRunning(true), 0);
  }, []);

  return useMemo(
    () => ({
      manifest,
      messages,
      composerText,
      sessionKind,
      privateParticipant,
      showAssistantTyping,
      screenTitle,
      invite,
      endCard,
      summary,
      summaryVisible,
      bridgePrompt,
      bridgePromptVisible,
      stepIndex,
      phaseLabel,
      isRunning,
      isComplete,
      replay,
    }),
    [
      manifest,
      messages,
      composerText,
      sessionKind,
      privateParticipant,
      showAssistantTyping,
      screenTitle,
      invite,
      endCard,
      summary,
      summaryVisible,
      bridgePrompt,
      bridgePromptVisible,
      stepIndex,
      phaseLabel,
      isRunning,
      isComplete,
      replay,
    ],
  );
}
