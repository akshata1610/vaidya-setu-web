import { useState, type Ref } from "react";
import { ArrowUpRight, AudioLines, Headphones } from "lucide-react";
import { evidenceWindows, recordingTime, type AudioSegment } from "@/lib/audio-evidence";

export function TimedTranscript({ segments, onListen, detailsRef }: {
  segments: AudioSegment[];
  onListen: (seconds: number) => void;
  detailsRef: Ref<HTMLDetailsElement>;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = segments.filter(segment => {
    return segment.text.toLowerCase().includes(needle) || recordingTime(segment.start).includes(needle);
  });
  return (
    <details className="nested timed-transcript" ref={detailsRef}>
      <summary><AudioLines size={16} /> Browse timed transcript</summary>
      <label className="field-label">
        Find a word or time
        <input value={query} placeholder="Search the transcript" onChange={event => setQuery(event.target.value)} />
      </label>
      <ul>
        {visible.map(({ text, start, end }, index) => (
          <li key={start + "-" + end + "-" + index}>
            <button type="button" className="audio-timestamp" aria-label={"Listen at " + recordingTime(start)} onClick={() => onListen(start)}>
              <Headphones size={14} /> {recordingTime(start)}
            </button>
            <span>{text}</span>
          </li>
        ))}
      </ul>
      {!visible.length && <p className="microcopy">No matching phrases. Try a different word or time.</p>}
    </details>
  );
}

export function MedicineEvidence({ quote, hasRecording, segments, onListen, onBrowse }: {
  quote?: string | null;
  hasRecording: boolean;
  segments: AudioSegment[];
  onListen: (seconds: number) => void;
  onBrowse: () => void;
}) {
  const matches = hasRecording ? evidenceWindows(segments, quote) : [];
  if (!quote && !hasRecording) return null;

  return (
    <div className="medicine-evidence">
      {quote && <blockquote><b>Source quote</b> {quote}</blockquote>}
      {matches.length > 0 && (
        <div className="evidence-audio-links">
          <p>{matches.length === 1 ? "Recording excerpt" : "Possible recording excerpts. Check which one supports this instruction."}</p>
          {matches.slice(0, 4).map(({ start, end }) => (
            <button type="button" className="audio-timestamp" key={start + "-" + end} onClick={() => onListen(start)}>
              <Headphones size={15} aria-hidden="true" /> Listen at {recordingTime(start)}
            </button>
          ))}
          {matches.length > 4 && <button type="button" className="text-button" onClick={onBrowse}>Browse all timed phrases</button>}
        </div>
      )}
      {hasRecording && matches.length === 0 && (
        <div className="evidence-audio-links">
          <p>{segments.length ? "Check this mention against the timed transcript." : "This recording has no saved phrase timings."}</p>
          <button type="button" className="audio-timestamp" onClick={onBrowse}>
            <Headphones size={15} aria-hidden="true" /> {segments.length ? "Open timed transcript" : "Open source recording"}
          </button>
        </div>
      )}
    </div>
  );
}

export function MedicineNameReferences() {
  return (
    <details className="panel medicine-references">
      <summary>Look up a medicine name</summary>
      <p>Use these references to check spelling and compare names. Confirm the intended medicine, strength and form with the doctor before editing the draft.</p>
      <div className="button-row">
        <a className="source-link" href="https://cdscoonline.gov.in/CDSCO/brandNames" target="_blank" rel="noreferrer">
          CDSCO brand-name search <ArrowUpRight size={14} aria-hidden="true" />
        </a>
        <a className="source-link" href="https://www.cdsco.gov.in/opencms/opencms/en/consumer/Essential-Medicines/" target="_blank" rel="noreferrer">
          National List of Essential Medicines <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
    </details>
  );
}
