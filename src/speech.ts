let englishVoices: SpeechSynthesisVoice[] = [];
let selectedVoice: SpeechSynthesisVoice | null = null;
let selectedVoiceKey: string | null = null;
let speakToken = 0;

function voiceKey(voice: SpeechSynthesisVoice): string {
  return voice.voiceURI || `${voice.name}|${voice.lang}`;
}

// Deprioritized, confirmed by cross-browser manual testing: these voices
// tend to clip the first word, so they are only used when no better
// English voice exists. Matched against `voice.name` (case-insensitive
// substring).
const DEPRIORITIZED_VOICE_NAMES = ["microsoft mark", "microsoft david"];

function isDeprioritizedVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  return DEPRIORITIZED_VOICE_NAMES.some((deprioritized) => name.includes(deprioritized));
}

function pickPreferredVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  // 1. Exact name: "Google US English".
  const googleUS = voices.find((voice) => voice.name === "Google US English");
  if (googleUS) return googleUS;

  // 2. A voice whose name contains both "Microsoft Aria Online" and
  // "English (United States)".
  const ariaOnline = voices.find(
    (voice) =>
      voice.name.includes("Microsoft Aria Online") &&
      voice.name.includes("English (United States)"),
  );
  if (ariaOnline) return ariaOnline;

  // 3. Exact name: "Microsoft Zira - English (United States)".
  const zira = voices.find((voice) => voice.name === "Microsoft Zira - English (United States)");
  if (zira) return zira;

  // 4. Any other en-US voice, excluding deprioritized voices.
  const otherEnUS = voices.find(
    (voice) => voice.lang.toLowerCase() === "en-us" && !isDeprioritizedVoice(voice),
  );
  if (otherEnUS) return otherEnUS;

  // 5. Any other English voice, excluding deprioritized voices.
  const otherEnglish = voices.find((voice) => !isDeprioritizedVoice(voice));
  if (otherEnglish) return otherEnglish;

  // Nothing better exists; fall back to a deprioritized voice, or whatever
  // is first in the list.
  return voices[0] ?? null;
}

// Selects and caches one English voice for the whole session. Once chosen,
// the same voice is reused for every call so playback always sounds like
// the same narrator; it is only re-picked if it disappears from the
// browser's voice list.
function ensureSelectedVoice(): void {
  if (englishVoices.length === 0) return;

  if (selectedVoice) {
    const stillAvailable = englishVoices.some(
      (voice) => voiceKey(voice) === selectedVoiceKey,
    );
    if (stillAvailable) return;

    const replacement = pickPreferredVoice(englishVoices);
    selectedVoice = replacement;
    selectedVoiceKey = replacement ? voiceKey(replacement) : null;
    return;
  }

  const picked = pickPreferredVoice(englishVoices);
  selectedVoice = picked;
  selectedVoiceKey = picked ? voiceKey(picked) : null;
}

function refreshEnglishVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  englishVoices = window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith("en"));

  ensureSelectedVoice();
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  refreshEnglishVoices();
  window.speechSynthesis.onvoiceschanged = refreshEnglishVoices;
}

export function speakEnglish(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const synth = window.speechSynthesis;
  const token = ++speakToken;

  // Stop whatever is currently queued/playing right away so rapid repeat
  // clicks don't overlap or talk over each other.
  synth.cancel();
  refreshEnglishVoices();

  const speakNow = () => {
    // A newer call to speakEnglish() has superseded this one; bail out
    // instead of speaking over it.
    if (token !== speakToken) return;

    synth.cancel();

    let realSpeechStarted = false;

    const speakRealSentence = () => {
      if (realSpeechStarted) return;
      realSpeechStarted = true;

      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = "en-US";
      if (selectedVoice) utterance.voice = selectedVoice;
      synth.speak(utterance);
    };

    const warmupUtterance = new SpeechSynthesisUtterance(".");
    warmupUtterance.voice = selectedVoice;
    warmupUtterance.lang = selectedVoice?.lang || "en-US";
    warmupUtterance.rate = 1;
    warmupUtterance.pitch = 1;
    warmupUtterance.volume = 0.01;
    warmupUtterance.onend = () => {
      speakRealSentence();
    };
    warmupUtterance.onerror = () => {
      speakRealSentence();
    };
    synth.speak(warmupUtterance);
  };

  if (englishVoices.length === 0) {
    // Voices can load asynchronously; give them a brief chance to arrive
    // before falling back to the browser's default voice.
    setTimeout(() => {
      refreshEnglishVoices();
      speakNow();
    }, 150);
  } else {
    speakNow();
  }
}
