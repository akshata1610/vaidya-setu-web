import assert from "node:assert/strict";
import test from "node:test";
import { evidenceWindows, readSarvamSegments, readSarvamTranscript, TRANSCRIPT_LIMIT } from "../lib/audio-evidence.ts";
import { byteRange, readSourceAudio } from "../lib/source-audio.ts";
import { approvalProblems, emptyMedicine } from "../lib/domain.ts";

test("REST phrase timestamps link a partially inaudible medicine to its surrounding words", () => {
  const segments = readSarvamSegments({
    timestamps: {
      words: ["Let me check that.", "Take [inaudible] one tablet", "after dinner for two days."],
      start_time_seconds: [0.2, 4.8, 7.1],
      end_time_seconds: [3.6, 6.7, 9.4],
    },
  }, 10);
  assert.deepEqual(evidenceWindows(segments, "Take [inaudible] one tablet after dinner"), [{ start: 4.8, end: 9.4 }]);
  assert.deepEqual(evidenceWindows(segments, "Unspoken medicine"), []);
});

test("batch timestamps preserve separate candidate mentions and timed words in other scripts", () => {
  const segments = readSarvamSegments({
    timestamps: {
      chunks: ["आपने Demo A लिया।", "आज Demo A के बारे में बात हुई।", "Invalid time"],
      start_time_seconds: [4, 21, 91],
      end_time_seconds: [6, 25, 95],
    },
  }, 40);
  assert.equal(segments.length, 2);
  assert.deepEqual(evidenceWindows(segments, "Demo A"), [{ start: 4, end: 6 }, { start: 21, end: 25 }]);
  assert.deepEqual(evidenceWindows(segments, "लिया"), [{ start: 4, end: 6 }]);
  assert.deepEqual(evidenceWindows(segments, "em"), []);
});

test("dated cases can use valid speaker timings when phrase timing arrays are unavailable", () => {
  const segments = readSarvamSegments({
    diarized_transcript: {
      entries: [
        { transcript: "Use Demo B", start_time_seconds: 71.5, end_time_seconds: 74.1 },
        { transcript: "Missing start", end_time_seconds: 5 },
        null,
      ],
    },
  }, 74);
  assert.deepEqual(evidenceWindows(segments, "Use Demo B"), [{ start: 71.5, end: 74 }]);
  assert.deepEqual(readSarvamSegments({}, 74), []);
});

test("a blank full transcript can use Sarvam's timed phrases in recording order", () => {
  const input = {
    transcript: " ",
    language_code: "en-IN",
    timestamps: {
      chunks: ["Second fictional phrase.", "First fictional phrase."],
      start_time_seconds: [7.5, 2],
      end_time_seconds: [9, 5],
    },
  };
  const result = readSarvamTranscript(input, 10);
  assert.equal(result.transcript, "First fictional phrase. Second fictional phrase.");
  assert.equal(result.language, "en-IN");
  assert.deepEqual(evidenceWindows(result.segments, "Second fictional phrase."), [{ start: 7.5, end: 9 }]);
});

test("speech results distinguish a blank response from a transcript that exceeds the limit", () => {
  assert.equal(readSarvamTranscript(null, 20).problem, "empty");
  assert.equal(readSarvamTranscript({ transcript: "" }, 20).problem, "empty");
  assert.equal(readSarvamTranscript({ transcript: "x".repeat(TRANSCRIPT_LIMIT + 1) }, 20).problem, "too_long");
  assert.equal(readSarvamTranscript({ transcript: " The full text is available. " }, 20).transcript, "The full text is available.");
});

test("an uncertain medicine name must be resolved to include it in an approved plan", () => {
  const medicine = { ...emptyMedicine("m1"), action: "stop" };
  const consultation = {
    reviewed: [medicine], referenceVerified: false, reviewer: "Fixture reviewer", reviewAcknowledged: true,
  };
  assert.match(approvalProblems(consultation).join(" "), /medicine name is missing/);
  medicine.action = "discussed";
  assert.deepEqual(approvalProblems(consultation), []);
});

test("audio seeks request bounded ranges and receive correct response metadata and bytes", async () => {
  const file = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7]);
  const storage = {
    head: async () => ({ size: file.length }),
    get: async (_key, options) => {
      const range = options?.range;
      const bytes = range ? file.slice(range.offset, range.offset + range.length) : file;
      return { size: file.length, body: new Blob([bytes]).stream() };
    },
  };
  assert.deepEqual(byteRange("bytes=-3", file.length), { offset: 5, length: 3 });
  assert.deepEqual(byteRange("bytes=3-99", file.length), { offset: 3, length: 5 });
  assert.equal(byteRange("bytes=3-2", file.length), null);
  assert.equal(byteRange("bytes=0-1,3-4", file.length), null);
  const whole = await readSourceAudio(storage, "fixture.wav", null);
  assert.equal(whole.status, 200);
  assert.equal(whole.headers.get("Accept-Ranges"), "bytes");
  const part = await readSourceAudio(storage, "fixture.wav", "bytes=3-");
  assert.equal(part.status, 206);
  assert.equal(part.headers.get("Content-Range"), "bytes 3-7/8");
  assert.equal(part.headers.get("Content-Length"), "5");
  assert.equal(part.headers.get("Cache-Control"), "private, no-store");
  assert.deepEqual(new Uint8Array(await part.arrayBuffer()), file.slice(3));
  const invalid = await readSourceAudio(storage, "fixture.wav", "bytes=9-");
  assert.equal(invalid.status, 416);
  assert.equal(invalid.headers.get("Content-Range"), "bytes */8");
});
