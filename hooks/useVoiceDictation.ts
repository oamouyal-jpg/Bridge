"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Browser speech-to-text (Chrome / Edge / Safari 16.4+). Runs on-device where supported.
 */
export function useVoiceDictation(options: {
  /** BCP-47 language tag */
  lang?: string;
  /** Full composed text: prefix at start + recognized speech (final + interim). */
  onText: (text: string) => void;
}) {
  const { lang = "en-US", onText } = options;
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);
  const finalBuf = useRef("");
  const prefixRef = useRef("");

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()));
  }, []);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    recRef.current = null;
    setListening(false);
  }, []);

  const start = useCallback(
    (prefix: string) => {
      setVoiceError(null);
      const Rec = getSpeechRecognition();
      if (!Rec) {
        setVoiceError("Voice isn’t available in this browser. Try Chrome or Edge on desktop.");
        return;
      }
      try {
        recRef.current?.stop();
      } catch {
        /* */
      }
      finalBuf.current = "";
      prefixRef.current = prefix.trimEnd();

      const recognition = new Rec();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          const piece = r[0]?.transcript ?? "";
          if (r.isFinal) {
            finalBuf.current += piece;
          } else {
            interim += piece;
          }
        }
        const v = (finalBuf.current + interim).trim();
        const p = prefixRef.current;
        const combined = p && v ? `${p} ${v}` : p || v;
        onText(combined);
      };

      recognition.onerror = (e) => {
        if (e.error === "aborted") return;
        if (e.error === "no-speech") return;
        if (e.error === "not-allowed") {
          setVoiceError("Microphone blocked — allow access in your browser settings.");
        } else {
          setVoiceError(`Voice: ${e.error}`);
        }
        setListening(false);
        recRef.current = null;
      };

      recognition.onend = () => {
        setListening(false);
        recRef.current = null;
      };

      recRef.current = recognition;
      try {
        recognition.start();
        setListening(true);
      } catch {
        setVoiceError("Could not start voice. Try again.");
        setListening(false);
        recRef.current = null;
      }
    },
    [lang, onText]
  );

  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* */
      }
    };
  }, []);

  return { supported, listening, voiceError, start, stop, setVoiceError };
}
