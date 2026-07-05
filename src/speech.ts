export function speakEnglish(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}
