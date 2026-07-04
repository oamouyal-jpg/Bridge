"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage, DemoPhaseId, DemoScript } from "./types";

let idCounter = 0;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export type DemoPlayback = {
  script: DemoScript;
  phase: DemoPhaseId;
  sessionKind: "private" | "joint";
  privateParticipant: "a" | "b";
  messages: ChatMessage[];
  composerText: string;
  composerDisabled: boolean;
  showAssistantTyping: boolean;
  inviteVisible: boolean;
  summary: null | {
    headline: string;
    bullets: [string, string];
    guidance: string;
  };
  summaryVisible: boolean;
  isRunning: boolean;
  isComplete: boolean;
  replay: () => void;
  setScript: (script: DemoScript) => void;
};

export function useDemoPlayback(initialScript: DemoScript): DemoPlayback {
  const scriptRef = useRef(initialScript);
  const cancelRef = useRef(false);
  const runIdRef = useRef(0);

  const [script, setScriptState] = useState(initialScript);
  const [phase, setPhase] = useState<DemoPhaseId>("private_a");
  const [sessionKind, setSessionKind] = useState<"private" | "joint">("private");
  const [privateParticipant, setPrivateParticipant] = useState<"a" | "b">("a");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composerText, setComposerText] = useState("");
  const [composerDisabled, setComposerDisabled] = useState(true);
  const [showAssistantTyping, setShowAssistantTyping] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [summary, setSummary] = useState<DemoPlayback["summary"]>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
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

  const runSequence = useCallback(async () => {
    const scriptLocal = scriptRef.current;
    const pauseAfterType = scriptLocal.pauseAfterTypeMs ?? 650;
    const step = scriptLocal.stepMs;

    setPhase("private_a");
    setSessionKind("private");
    setPrivateParticipant("a");
    setMessages([]);
    setComposerText("");
    setComposerDisabled(true);
    setShowAssistantTyping(false);
    setInviteVisible(false);
    setSummary(null);
    setSummaryVisible(false);
    setIsComplete(false);

    const push = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    const typeInComposer = async (text: string) => {
      setComposerText("");
      for (let i = 0; i < text.length; i += 1) {
        const ch = text[i];
        setComposerText((prev) => prev + ch);
        await waitUnlessCancelled(step);
      }
    };

    try {
      for (let i = 0; i < scriptLocal.beats.length; i += 1) {
        const beat = scriptLocal.beats[i];

        if (beat.kind === "type_user") {
          if (beat.participant === "a") {
            setPrivateParticipant("a");
            setPhase("private_a");
          }
          if (beat.participant === "b") {
            setPrivateParticipant("b");
            setPhase("private_b");
            setMessages([]);
            setComposerText("");
          }

          setSessionKind("private");
          setComposerDisabled(true);
          await typeInComposer(beat.text);
          await waitUnlessCancelled(pauseAfterType);

          push({
            id: nextId("u"),
            role: "user",
            content: beat.text,
            participant: beat.participant,
          });
          setComposerText("");
          await waitUnlessCancelled(320);
          continue;
        }

        if (beat.kind === "assistant") {
          if (beat.participant === "a") setPhase("private_a");
          if (beat.participant === "b") setPhase("private_b");
          setShowAssistantTyping(true);
          await waitUnlessCancelled(520);
          setShowAssistantTyping(false);

          push({
            id: nextId("a"),
            role: "assistant",
            content: beat.text,
            participant: beat.participant,
          });
          await waitUnlessCancelled(720);
          continue;
        }

        if (beat.kind === "invite_sent") {
          setInviteVisible(true);
          setPhase("invite");
          await waitUnlessCancelled(2400);
          setInviteVisible(false);
          setMessages([]);
          setComposerText("");
          setSessionKind("joint");
          setPhase("mediated_intro");
          await waitUnlessCancelled(420);
          continue;
        }

        if (beat.kind === "summary_panel") {
          setSummary({
            headline: beat.headline,
            bullets: beat.bullets,
            guidance: beat.guidance,
          });
          setSummaryVisible(false);
          await waitUnlessCancelled(120);
          setSummaryVisible(true);
          await waitUnlessCancelled(2600);
          continue;
        }

        if (beat.kind === "joint_message") {
          setSessionKind("joint");
          setPhase("guided_exchange");
          push({
            id: nextId("u"),
            role: "user",
            content: beat.text,
            participant: beat.participant,
          });
          await waitUnlessCancelled(900);
          continue;
        }

        if (beat.kind === "resolution") {
          setPhase("resolution");
          setShowAssistantTyping(true);
          await waitUnlessCancelled(520);
          setShowAssistantTyping(false);
          push({
            id: nextId("r"),
            role: "assistant",
            content: beat.text,
          });
          await waitUnlessCancelled(1200);
          continue;
        }

        if (beat.kind === "joint_system") {
          push({
            id: nextId("s"),
            role: "system",
            content: beat.text,
          });
          await waitUnlessCancelled(700);
        }
      }

      setIsComplete(true);
      setIsRunning(false);
    } catch {
      /* cancelled run */
    }
  }, [waitUnlessCancelled]);

  useEffect(() => {
    scriptRef.current = script;
  }, [script]);

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
  }, [isRunning, script.id, runSequence]);

  const replay = useCallback(() => {
    cancelRef.current = true;
    runIdRef.current += 1;
    setIsRunning(false);
    window.setTimeout(() => {
      setIsRunning(true);
    }, 0);
  }, []);

  const setScript = useCallback((next: DemoScript) => {
    cancelRef.current = true;
    runIdRef.current += 1;
    scriptRef.current = next;
    setScriptState(next);
    setIsRunning(false);
    window.setTimeout(() => {
      setIsRunning(true);
    }, 0);
  }, []);

  return useMemo(
    () => ({
      script,
      phase,
      sessionKind,
      privateParticipant,
      messages,
      composerText,
      composerDisabled,
      showAssistantTyping,
      inviteVisible,
      summary,
      summaryVisible,
      isRunning,
      isComplete,
      replay,
      setScript,
    }),
    [
      script,
      phase,
      sessionKind,
      privateParticipant,
      messages,
      composerText,
      composerDisabled,
      showAssistantTyping,
      inviteVisible,
      summary,
      summaryVisible,
      isRunning,
      isComplete,
      replay,
      setScript,
    ],
  );
}
