import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Ensures at most one sentence records at a time across the whole app.
 * Deliberately a tiny module-level store rather than lifted React state —
 * this is UI coordination only, never persisted, and keeps the feature
 * self-contained in this one component.
 */
let activeRecording: { sentenceId: string; stop: () => void } | null = null;
const activeListeners = new Set<() => void>();

function notifyActiveListeners() {
  for (const listener of activeListeners) listener();
}

function subscribeActiveRecording(listener: () => void): () => void {
  activeListeners.add(listener);
  return () => activeListeners.delete(listener);
}

function beginActiveRecording(sentenceId: string, stop: () => void) {
  activeRecording = { sentenceId, stop };
  notifyActiveListeners();
}

function endActiveRecording(sentenceId: string) {
  if (activeRecording?.sentenceId === sentenceId) {
    activeRecording = null;
    notifyActiveListeners();
  }
}

const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function pickSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
    return undefined;
  }
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function describeMicrophoneError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Microphone permission was denied. Allow microphone access in your browser and try again.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "Microphone access is unavailable. Connect a microphone and try again.";
  }
  return "Could not access the microphone. Connect a microphone and try again.";
}

interface PronunciationRecorderProps {
  sentenceId: string;
}

export function PronunciationRecorder({
  sentenceId,
}: PronunciationRecorderProps) {
  const [status, setStatus] = useState<"idle" | "recording" | "recorded">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [otherRecordingActive, setOtherRecordingActive] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const playerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return subscribeActiveRecording(() => {
      setOtherRecordingActive(
        activeRecording !== null && activeRecording.sentenceId !== sentenceId,
      );
    });
  }, [sentenceId]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  // Unmount cleanup: stop any in-flight recording, release the microphone,
  // revoke the object URL, and unregister from the single-active-recording
  // coordinator so a stale entry can't block other sentences.
  useEffect(() => {
    return () => {
      stopRecording();
      stopTracks(streamRef.current);
      streamRef.current = null;
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.src = "";
      }
      endActiveRecording(sentenceId);
    };
  }, [sentenceId, stopRecording]);

  async function handleRecord() {
    setError(null);

    if (typeof MediaRecorder === "undefined") {
      setError("This browser does not support audio recording.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone access is unavailable. Connect a microphone and try again.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setError(describeMicrophoneError(err));
      return;
    }

    let recorder: MediaRecorder;
    try {
      const mimeType = pickSupportedMimeType();
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch {
      stopTracks(stream);
      setError("Could not start recording on this device.");
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = URL.createObjectURL(blob);

      stopTracks(streamRef.current);
      streamRef.current = null;
      endActiveRecording(sentenceId);
      setStatus("recorded");
    };

    recorder.onerror = () => {
      stopTracks(streamRef.current);
      streamRef.current = null;
      endActiveRecording(sentenceId);
      setError("Recording failed. Please try again.");
      setStatus(audioUrlRef.current ? "recorded" : "idle");
    };

    recorderRef.current = recorder;

    try {
      recorder.start();
    } catch {
      stopTracks(stream);
      streamRef.current = null;
      setError("Could not start recording. Please try again.");
      return;
    }

    beginActiveRecording(sentenceId, stopRecording);
    setStatus("recording");
  }

  function handlePlay() {
    setError(null);
    if (!audioUrlRef.current) return;

    let player = playerRef.current;
    if (!player) {
      player = new Audio();
      playerRef.current = player;
    }
    if (player.src !== audioUrlRef.current) {
      player.src = audioUrlRef.current;
    }
    player.onerror = () => setError("Playback failed. Please try again.");
    player.pause();
    player.currentTime = 0;
    player.play().catch(() => setError("Playback failed. Please try again."));
  }

  const recordDisabled = status === "recording" || otherRecordingActive;

  return (
    <div className="pronunciation-recorder">
      <div className="pronunciation-recorder-controls">
        <button
          type="button"
          className="record-btn"
          onClick={handleRecord}
          disabled={recordDisabled}
          aria-label={status === "recorded" ? "Record again" : "Record your voice"}
        >
          {status === "recorded" ? "🎤 Record Again" : "🎤 Record"}
        </button>

        {status === "recording" && (
          <button
            type="button"
            className="stop-btn"
            onClick={stopRecording}
            aria-label="Stop recording"
          >
            ⏹ Stop
          </button>
        )}

        {status === "recorded" && (
          <button
            type="button"
            className="play-voice-btn"
            onClick={handlePlay}
            aria-label="Play your recorded voice"
          >
            ▶ Play My Voice
          </button>
        )}
      </div>

      {status === "recording" && (
        <p className="recording-status" role="status">
          ● Recording…
        </p>
      )}

      {otherRecordingActive && status !== "recording" && (
        <p className="recording-status" role="status">
          Another recording is in progress.
        </p>
      )}

      {error && (
        <p className="recording-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
