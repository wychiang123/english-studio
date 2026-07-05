let englishVoices: SpeechSynthesisVoice[] = [];
let nextVoiceIndex = 0;

function refreshEnglishVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  englishVoices = window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith("en"));
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  refreshEnglishVoices();
  window.speechSynthesis.onvoiceschanged = refreshEnglishVoices;
}

export function speakEnglish(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = "en-US";

  // Alternate between available English voices when there's more than
  // one, so repeated Speak clicks don't always sound identical. Falls
  // back to the browser's default voice for `utterance.lang` when no
  // English voices are exposed yet (or at all).
  if (englishVoices.length > 0) {
    utterance.voice = englishVoices[nextVoiceIndex % englishVoices.length];
    nextVoiceIndex++;
  }

  window.speechSynthesis.speak(utterance);
}
