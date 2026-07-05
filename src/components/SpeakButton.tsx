import { speakEnglish } from "../speech";

interface SpeakButtonProps {
  text: string;
}

export function SpeakButton({ text }: SpeakButtonProps) {
  if (!text.trim()) return null;

  return (
    <button
      type="button"
      className="speak-btn"
      title="Speak English"
      onClick={() => speakEnglish(text)}
    >
      🔊
    </button>
  );
}
