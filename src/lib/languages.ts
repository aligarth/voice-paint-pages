export type SpeechLanguage = { code: string; label: string };

/** Browser speech-recognition locales, covering the widely supported set. */
export const SPEECH_LANGUAGES: SpeechLanguage[] = [
  { code: "af-ZA", label: "Afrikaans" },
  { code: "am-ET", label: "አማርኛ (Amharic)" },
  { code: "ar-SA", label: "العربية (Arabic)" },
  { code: "az-AZ", label: "Azərbaycan" },
  { code: "bn-BD", label: "বাংলা (Bengali)" },
  { code: "bg-BG", label: "Български" },
  { code: "ca-ES", label: "Català" },
  { code: "cs-CZ", label: "Čeština" },
  { code: "da-DK", label: "Dansk" },
  { code: "de-DE", label: "Deutsch" },
  { code: "el-GR", label: "Ελληνικά" },
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "en-IN", label: "English (India)" },
  { code: "es-ES", label: "Español (España)" },
  { code: "es-MX", label: "Español (México)" },
  { code: "et-EE", label: "Eesti" },
  { code: "eu-ES", label: "Euskara" },
  { code: "fa-IR", label: "فارسی (Persian)" },
  { code: "fi-FI", label: "Suomi" },
  { code: "fil-PH", label: "Filipino" },
  { code: "fr-FR", label: "Français" },
  { code: "gl-ES", label: "Galego" },
  { code: "gu-IN", label: "ગુજરાતી" },
  { code: "he-IL", label: "עברית (Hebrew)" },
  { code: "hi-IN", label: "हिन्दी (Hindi)" },
  { code: "hr-HR", label: "Hrvatski" },
  { code: "hu-HU", label: "Magyar" },
  { code: "hy-AM", label: "Հայերեն" },
  { code: "id-ID", label: "Bahasa Indonesia" },
  { code: "is-IS", label: "Íslenska" },
  { code: "it-IT", label: "Italiano" },
  { code: "ja-JP", label: "日本語 (Japanese)" },
  { code: "jv-ID", label: "Basa Jawa" },
  { code: "ka-GE", label: "ქართული" },
  { code: "kk-KZ", label: "Қазақша" },
  { code: "km-KH", label: "ភាសាខ្មែរ" },
  { code: "kn-IN", label: "ಕನ್ನಡ" },
  { code: "ko-KR", label: "한국어 (Korean)" },
  { code: "lo-LA", label: "ລາວ" },
  { code: "lt-LT", label: "Lietuvių" },
  { code: "lv-LV", label: "Latviešu" },
  { code: "ml-IN", label: "മലയാളം" },
  { code: "mn-MN", label: "Монгол" },
  { code: "mr-IN", label: "मराठी" },
  { code: "ms-MY", label: "Bahasa Melayu" },
  { code: "my-MM", label: "မြန်မာ" },
  { code: "ne-NP", label: "नेपाली" },
  { code: "nl-NL", label: "Nederlands" },
  { code: "nb-NO", label: "Norsk bokmål" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ" },
  { code: "pl-PL", label: "Polski" },
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "pt-PT", label: "Português (Portugal)" },
  { code: "ro-RO", label: "Română" },
  { code: "ru-RU", label: "Русский (Russian)" },
  { code: "si-LK", label: "සිංහල" },
  { code: "sk-SK", label: "Slovenčina" },
  { code: "sl-SI", label: "Slovenščina" },
  { code: "sr-RS", label: "Српски" },
  { code: "su-ID", label: "Basa Sunda" },
  { code: "sv-SE", label: "Svenska" },
  { code: "sw-KE", label: "Kiswahili" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "te-IN", label: "తెలుగు" },
  { code: "th-TH", label: "ไทย (Thai)" },
  { code: "tr-TR", label: "Türkçe" },
  { code: "uk-UA", label: "Українська" },
  { code: "ur-PK", label: "اردو (Urdu)" },
  { code: "uz-UZ", label: "O‘zbek" },
  { code: "vi-VN", label: "Tiếng Việt" },
  { code: "zh-CN", label: "中文 (普通话)" },
  { code: "zh-HK", label: "中文 (粵語)" },
  { code: "zh-TW", label: "中文 (台灣)" },
  { code: "zu-ZA", label: "isiZulu" },
];

/** Sentinel value meaning "figure the language out for me". */
export const AUTO_LANG = "auto";

/** Picks the closest supported locale for the visitor's browser language. */
export function detectLanguage(preferred?: string): string {
  const wanted = (preferred ?? "").toLowerCase();
  if (!wanted) return "en-US";
  const exact = SPEECH_LANGUAGES.find((l) => l.code.toLowerCase() === wanted);
  if (exact) return exact.code;
  const base = wanted.split("-")[0];
  const partial = SPEECH_LANGUAGES.find((l) => l.code.toLowerCase().startsWith(`${base}-`));
  return partial?.code ?? "en-US";
}

/**
 * Locales to try, in order, when auto-detecting: every language the device
 * advertises, then English as a final fallback.
 */
export function candidateLocales(preferred?: readonly string[]): string[] {
  const list = (preferred && preferred.length ? preferred : ["en-US"]).map((l) =>
    detectLanguage(l),
  );
  const out: string[] = [];
  for (const code of [...list, "en-US"]) {
    if (!out.includes(code)) out.push(code);
  }
  return out;
}

const SCRIPT_LOCALES: { test: RegExp; code: string }[] = [
  { test: /[\u0600-\u06ff]/, code: "ar-SA" },
  { test: /[\u0590-\u05ff]/, code: "he-IL" },
  { test: /[\u0400-\u04ff]/, code: "ru-RU" },
  { test: /[\u0370-\u03ff]/, code: "el-GR" },
  { test: /[\u0900-\u097f]/, code: "hi-IN" },
  { test: /[\u0980-\u09ff]/, code: "bn-BD" },
  { test: /[\u0a00-\u0a7f]/, code: "pa-IN" },
  { test: /[\u0a80-\u0aff]/, code: "gu-IN" },
  { test: /[\u0b80-\u0bff]/, code: "ta-IN" },
  { test: /[\u0c00-\u0c7f]/, code: "te-IN" },
  { test: /[\u0c80-\u0cff]/, code: "kn-IN" },
  { test: /[\u0d00-\u0d7f]/, code: "ml-IN" },
  { test: /[\u0e00-\u0e7f]/, code: "th-TH" },
  { test: /[\u1000-\u109f]/, code: "my-MM" },
  { test: /[\u10a0-\u10ff]/, code: "ka-GE" },
  { test: /[\u0530-\u058f]/, code: "hy-AM" },
  { test: /[\uac00-\ud7af\u1100-\u11ff]/, code: "ko-KR" },
  { test: /[\u3040-\u30ff]/, code: "ja-JP" },
  { test: /[\u4e00-\u9fff]/, code: "zh-CN" },
];

/**
 * Guesses the spoken locale from a recognized transcript's script, so the next
 * capture can switch to it automatically. Returns null for Latin script, where
 * the script alone tells us nothing.
 */
export function detectLocaleFromText(text: string): string | null {
  for (const { test, code } of SCRIPT_LOCALES) {
    if (test.test(text)) return code;
  }
  return null;
}
