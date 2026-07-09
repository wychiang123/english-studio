let englishVoices: SpeechSynthesisVoice[] = [];
let selectedVoice: SpeechSynthesisVoice | null = null;
let selectedVoiceKey: string | null = null;
let voicesLoggedOnce = false;
let speakToken = 0;

function voiceKey(voice: SpeechSynthesisVoice): string {
  return voice.voiceURI || `${voice.name}|${voice.lang}`;
}

// Priority order, confirmed by manual testing: Google voices consistently
// speak the first word correctly, while Microsoft voices tend to clip it.
// Each entry is matched against `voice.name` (case-insensitive substring).
const VOICE_PRIORITY = [
  "google us english",
  "google uk english female",
  "google uk english male",
];

function pickPreferredVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  for (const preferredName of VOICE_PRIORITY) {
    const match = voices.find((voice) => voice.name.toLowerCase().includes(preferredName));
    if (match) return match;
  }

  // Any other Google English voice.
  const otherGoogle = voices.find((voice) => voice.name.toLowerCase().includes("google"));
  if (otherGoogle) return otherGoogle;

  // Any other English voice.
  return voices[0] ?? null;
}

function logAvailableVoices(voices: SpeechSynthesisVoice[]): void {
  if (!import.meta.env.DEV) return;
  const lines = voices.map(
    (voice, index) => `[${index}] ${voice.name} | ${voice.lang} | local=${voice.localService}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    [
      "--------------------------------------------------",
      "Available English voices:",
      ...lines,
    ].join("\n"),
  );
}

function logSelectedVoice(voice: SpeechSynthesisVoice, reason: string): void {
  if (!import.meta.env.DEV) return;
  // eslint-disable-next-line no-console
  console.log(
    ["Selected voice" + reason + ":", voice.name, "--------------------------------------------------"].join(
      "\n",
    ),
  );
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
    if (replacement) {
      logSelectedVoice(replacement, " (previous voice unavailable, re-selected)");
    }
    return;
  }

  if (!voicesLoggedOnce) {
    voicesLoggedOnce = true;
    logAvailableVoices(englishVoices);
  }

  const picked = pickPreferredVoice(englishVoices);
  selectedVoice = picked;
  selectedVoiceKey = picked ? voiceKey(picked) : null;
  if (picked) {
    logSelectedVoice(picked, "");
  }
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

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(`Speak voice: ${selectedVoice ? selectedVoice.name : "(browser default)"}`);
    }

    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = "en-US";
    if (selectedVoice) utterance.voice = selectedVoice;
    synth.speak(utterance);
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
