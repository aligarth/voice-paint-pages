import { useCallback, useEffect, useRef, useState } from "react";

type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

export function useSpeech() {
  const recognitionRef = useRef<Recognition | null>(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        const alt = event.results[i]?.[0];
        if (alt) text += alt.transcript;
      }
      setTranscript(text.trim());
    };
    rec.onerror = (e) => {
      setError(
        e.error === "not-allowed"
          ? "Microphone access was blocked. Allow it in your browser settings."
          : "I couldn't hear that — try again.",
      );
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    return () => {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    };
  }, []);

  const start = useCallback(() => {
    setError(null);
    setTranscript("");
    try {
      recognitionRef.current?.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }, []);

  return { supported, listening, transcript, error, start, stop, setTranscript };
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

/** Pulls a page count out of natural speech and returns the cleaned subject. */
export function parseRequest(input: string): { subject: string; pages: number } {
  const text = input.trim();
  let pages = 0;
  const digit = text.match(/(\d{1,2})\s*(?:pages?|pictures?|drawings?|sheets?)/i);
  if (digit?.[1]) pages = parseInt(digit[1], 10);
  if (!pages) {
    const word = text.match(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b\s*(?:pages?|pictures?|drawings?|sheets?)/i,
    );
    const key = word?.[1]?.toLowerCase();
    if (key) pages = NUMBER_WORDS[key] ?? 0;
  }
  const subject = text
    .replace(
      /\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b\s*(pages?|pictures?|drawings?|sheets?)\b/gi,
      "",
    )
    .replace(
      /^(i want|i'd like|i would like|please|can you|could you|make|draw|create|give me|a coloring book of|of)\s+/gi,
      "",
    )
    .replace(/\s{2,}/g, " ")
    .replace(/^(of|for|with)\s+/i, "")
    .replace(/^(a|an|the)\s+/i, "")
    .replace(/[.,!]+$/, "")
    .trim();

  return { subject, pages: Math.min(Math.max(pages || 1, 1), 12) };
}
