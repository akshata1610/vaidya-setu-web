export type AudioWindow = { start: number; end: number };
export type AudioSegment = AudioWindow & { text: string };
export const TRANSCRIPT_LIMIT = 50_000;

type SarvamTiming = {
  timestamps?: {
    words?: unknown[];
    chunks?: unknown[];
    start_time_seconds?: unknown[];
    end_time_seconds?: unknown[];
  };
  diarized_transcript?: {
    entries?: Array<{ transcript?: unknown; start_time_seconds?: unknown; end_time_seconds?: unknown }>;
  };
};

export function readSarvamSegments(input: unknown, duration = 0): AudioSegment[] {
  if (!input || typeof input !== "object" || !Number.isFinite(duration) || duration <= 0) return [];
  const { timestamps, diarized_transcript } = input as SarvamTiming;
  const segments: AudioSegment[] = [];

  function add(text: unknown, start: unknown, end: unknown) {
    if (
      typeof text !== "string" || !text.trim() ||
      typeof start !== "number" || !Number.isFinite(start) || start < 0 || start >= duration ||
      typeof end !== "number" || !Number.isFinite(end) || end <= start || end > duration + 1
    ) return;
    segments.push({ text: text.trim(), start, end: Math.min(end, duration) });
  }

  const phrases = timestamps?.chunks ?? timestamps?.words;
  const starts = timestamps?.start_time_seconds;
  const ends = timestamps?.end_time_seconds;
  if (Array.isArray(phrases) && Array.isArray(starts) && Array.isArray(ends)) {
    phrases.forEach((text, index) => add(text, starts[index], ends[index]));
  }
  if (!segments.length && Array.isArray(diarized_transcript?.entries)) {
    for (const entry of diarized_transcript.entries) {
      if (entry) add(entry.transcript, entry.start_time_seconds, entry.end_time_seconds);
    }
  }
  return segments.sort((a, b) => a.start - b.start);
}

export function readSarvamTranscript(input: unknown, duration?: number) {
  const result = input && typeof input === "object"
    ? input as { transcript?: unknown; language_code?: unknown }
    : null;
  const full = typeof result?.transcript === "string" ? result.transcript.trim() : "";
  const segments = readSarvamSegments(input, duration);
  const transcript = full || segments.map(segment => segment.text).join(" ");
  if (!transcript) return { problem: "empty" } as const;
  if (transcript.length > TRANSCRIPT_LIMIT) return { problem: "too_long" } as const;
  return {
    transcript,
    segments,
    language: typeof result?.language_code === "string" ? result.language_code : undefined,
  } as const;
}

function spokenText(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, " ").trim();
}

// Match copied source wording to provider timing, including quotes across adjacent phrases.
export function evidenceWindows(segments: AudioSegment[], quote: string | null | undefined): AudioWindow[] {
  const phrase = spokenText(quote ?? "");
  if (!phrase) return [];
  let transcript = " ";
  const positions: Array<{ from: number; to: number; segment: AudioSegment }> = [];
  for (const segment of segments) {
    const text = spokenText(segment.text);
    if (!text) continue;
    positions.push({ from: transcript.length, to: transcript.length + text.length, segment });
    transcript += text + " ";
  }

  const windows: AudioWindow[] = [];
  const needle = " " + phrase + " ";
  for (let match = transcript.indexOf(needle); match !== -1; match = transcript.indexOf(needle, match + 1)) {
    const first = positions.find(({ from, to }) => from <= match + 1 && match + 1 < to);
    const last = positions.find(({ from, to }) => from <= match + phrase.length && match + phrase.length < to);
    if (!first || !last) continue;
    const window = { start: first.segment.start, end: Math.max(first.segment.end, last.segment.end) };
    if (!windows.some(({ start, end }) => start === window.start && end === window.end)) windows.push(window);
  }
  return windows;
}

export function recordingTime(seconds: number) {
  const whole = Math.floor(seconds);
  return String(Math.floor(whole / 60)).padStart(2, "0") + ":" + String(whole % 60).padStart(2, "0");
}
