import { useCallback, useEffect, useRef, useState } from "react";
import { AUTO_LANG, candidateLocales, detectLocaleFromText } from "./languages";


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

/**
 * How long we wait after speech stops before closing the mic.
 * Long enough that natural mid-sentence pauses ("five pages of… um… dragons")
 * don't cut people off, short enough that it doesn't feel stuck.
 */
const SILENCE_AFTER_FINAL_MS = 1800;
/** Interim words are still arriving, so wait noticeably longer. */
const SILENCE_AFTER_INTERIM_MS = 3200;
/** A request this short is probably unfinished — give extra room to continue. */
const SHORT_REQUEST_WORDS = 4;
const SHORT_REQUEST_GRACE_MS = 1200;

function silenceDelay(text: string, isFinal: boolean): number {
  const base = isFinal ? SILENCE_AFTER_FINAL_MS : SILENCE_AFTER_INTERIM_MS;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return words > 0 && words < SHORT_REQUEST_WORDS ? base + SHORT_REQUEST_GRACE_MS : base;
}

export function useSpeech() {
  const recognitionRef = useRef<Recognition | null>(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  // "auto" = let the app work the language out; anything else is a manual pick.
  const [lang, setLang] = useState<string>(AUTO_LANG);
  const [detectedLang, setDetectedLang] = useState("en-US");

  const listeningRef = useRef(listening);
  const transcriptRef = useRef(transcript);
  const silenceTimerRef = useRef<number | null>(null);
  const manualStopRef = useRef(false);
  const langRef = useRef(lang);
  const candidatesRef = useRef<string[]>(["en-US"]);
  const candidateIndexRef = useRef(0);

  useEffect(() => { listeningRef.current = listening; }, [listening]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  // Build the auto-detect candidate list from every language the device advertises.
  useEffect(() => {
    const nav = navigator as Navigator & { languages?: readonly string[] };
    const remembered = localStorage.getItem("say-and-color:lang");
    const list = candidateLocales(nav.languages ?? [nav.language]);
    if (remembered) {
      candidatesRef.current = [remembered, ...list.filter((c) => c !== remembered)];
    } else {
      candidatesRef.current = list;
    }
    candidateIndexRef.current = 0;
    setDetectedLang(candidatesRef.current[0] ?? "en-US");
  }, []);

  /** The locale recognition should actually run in right now. */
  const resolveLang = useCallback(() => {
    if (langRef.current !== AUTO_LANG) return langRef.current;
    return candidatesRef.current[candidateIndexRef.current] ?? "en-US";
  }, []);

  const resolveLangRef = useRef(resolveLang);
  useEffect(() => { resolveLangRef.current = resolveLang; }, [resolveLang]);

  /** Remembers a locale we know worked so later sessions start there. */
  const rememberLang = useCallback((code: string) => {
    candidatesRef.current = [code, ...candidatesRef.current.filter((c) => c !== code)];
    candidateIndexRef.current = 0;
    setDetectedLang(code);
    try {
      localStorage.setItem("say-and-color:lang", code);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const rememberLangRef = useRef(rememberLang);
  useEffect(() => { rememberLangRef.current = rememberLang; }, [rememberLang]);

  // Apply the chosen language, restarting recognition if it is already running.
  useEffect(() => {
    langRef.current = lang;
    if (lang !== AUTO_LANG) setDetectedLang(lang);
    const rec = recognitionRef.current;
    if (!rec) return;
    rec.lang = resolveLang();
    if (listeningRef.current) {
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    }
  }, [lang, resolveLang]);


  const autoStop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }, []);

  const stopRef = useRef(autoStop);
  useEffect(() => { stopRef.current = autoStop; }, [autoStop]);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);
    const rec = new Ctor();
    rec.lang = resolveLangRef.current();
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        const alt = event.results[i]?.[0];
        if (alt) text += alt.transcript;
      }

      // Words came through, so the current locale works — lock it in. If the
      // script says another language, remember that one for the next capture.
      if (text.trim()) {
        const current = resolveLangRef.current();
        const fromScript = detectLocaleFromText(text);
        if (langRef.current === AUTO_LANG) {
          rememberLangRef.current(fromScript ?? current);
        }
      }


      const lastResult = event.results[event.results.length - 1];
      const spoken = text.trim();
      setTranscript(spoken);

      // Every new result (interim included) pushes the auto-stop back, so the
      // mic only closes after a real pause in speech.
      if (spoken) {
        if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = window.setTimeout(
          () => stopRef.current(),
          silenceDelay(spoken, Boolean(lastResult?.isFinal)),
        );
      }
    };
    rec.onerror = (e) => {
      // In auto mode, nothing heard / unsupported locale means try the next
      // language the device advertises before bothering the user.
      const retryable =
        e.error === "no-speech" || e.error === "no-match" || e.error === "language-not-supported";
      if (langRef.current === AUTO_LANG && retryable) {
        const next = (candidateIndexRef.current + 1) % candidatesRef.current.length;
        candidateIndexRef.current = next;
        setDetectedLang(candidatesRef.current[next] ?? "en-US");
        if (recognitionRef.current) recognitionRef.current.lang = resolveLangRef.current();
        setListening(false);
        return;
      }
      const msg =
        e.error === "not-allowed"
          ? "Microphone access was blocked. Allow it in your browser settings."
          : "I couldn't hear that — try again.";
      setError(msg);
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      if (silenceTimerRef.current) {
        window.clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      // A captured request goes up for confirmation, unless the user tapped stop themselves.
      if (!manualStopRef.current) {
        const command = transcriptRef.current;
        if (command) setPendingCommand(command);
      }
      manualStopRef.current = false;
    };
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
    setPendingCommand(null);
    try {
      if (recognitionRef.current) recognitionRef.current.lang = resolveLangRef.current();
      recognitionRef.current?.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    autoStop();
  }, [autoStop]);

  const clearPendingCommand = useCallback(() => {
    setPendingCommand(null);
  }, []);

  return {
    supported,
    listening,
    transcript,
    error,
    start,
    stop,
    setTranscript,
    pendingCommand,
    lang,
    setLang,
    detectedLang,

    clearPendingCommand,
  };
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
    .trim()
    .replace(
      /\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b\s*(pages?|pictures?|drawings?|sheets?)\b/gi,
      "",
    )
    .trim()
    .replace(
      /^(i want|i'd like|i would like|please|can you|could you|make|draw|create|give me|a coloring book of|of)\s+/gi,
      "",
    )
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/^(of|for|with)\s+/i, "")
    .replace(/^(a|an|the)\s+/i, "")
    .replace(/[.,!]+$/, "")
    .trim();

  return { subject: subject, pages: Math.min(Math.max(pages || 1, 1), 12) };
}
