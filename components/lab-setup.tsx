import { useId, useState, type FormEvent, type Ref } from "react";
import { Activity, ArrowRight, ArrowUpRight, AudioLines, Check, FileCheck2, LockKeyhole, LogIn, Play } from "lucide-react";

export function LabBrand() {
  return (
    <a className="brand" href="/" aria-label="Vaidya Setu home">
      <span className="brand-mark"><Activity size={24} /></span>
      <span>vaidya<span className="brand-light">setu</span><small>REVIEW LAB</small></span>
    </a>
  );
}

export function LabFooter() {
  return <footer className="lab-footer">Made by Akshata · Powered by Sarvam</footer>;
}

export function SarvamKeyForm({
  initialKey = "",
  submitLabel,
  onSubmit,
  onTest,
}: {
  initialKey?: string;
  submitLabel: string;
  onSubmit: (key: string) => void;
  onTest?: (key: string) => Promise<unknown>;
}) {
  const id = useId();
  const [input, setInput] = useState(initialKey);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [testing, setTesting] = useState(false);

  function readKey() {
    const candidate = input.trim();
    setSuccess("");
    if (!candidate || candidate.length > 500 || !/^[!-~]+$/.test(candidate)) {
      setError("Paste the full API key from your Sarvam dashboard.");
      return null;
    }
    setError("");
    return candidate;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = readKey();
    if (candidate) onSubmit(candidate);
  }

  async function testConnection() {
    if (!onTest) return;
    const candidate = readKey();
    if (!candidate) return;
    setTesting(true);
    try {
      await onTest(candidate);
      setSuccess("Sarvam’s chat service responded successfully.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sarvam did not respond. Try again.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <form className="sarvam-key-form" onSubmit={submit}>
      <label className="field-label" htmlFor={id}>Sarvam API key</label>
      <input
        id={id}
        type="password"
        autoComplete="off"
        spellCheck={false}
        placeholder="Paste your Sarvam API key"
        aria-describedby={error ? id + "-help " + id + "-error" : id + "-help"}
        aria-invalid={error ? true : undefined}
        disabled={testing}
        value={input}
        onChange={(event) => {
          setInput(event.target.value);
          setError("");
          setSuccess("");
        }}
      />
      <a className="source-link" href="https://indus.sarvam.ai/key-management" target="_blank" rel="noreferrer">
        Get a Sarvam API key <ArrowUpRight size={14} aria-hidden="true" />
      </a>
      <p id={id + "-help"} className="key-help">
        <LockKeyhole size={14} aria-hidden="true" /> This tab keeps your key in memory until you refresh or close it.
      </p>
      {error && <p id={id + "-error"} className="warning-text" role="alert">{error}</p>}
      {success && <p className="key-feedback" role="status">{success}</p>}
      <button className="button primary wide" type="submit" disabled={testing}>
        {submitLabel} <ArrowRight size={17} aria-hidden="true" />
      </button>
      {onTest && (
        <div className="key-test">
          <button className="button secondary" type="button" disabled={testing} onClick={() => void testConnection()}>
            {testing ? "Testing connection…" : "Test API connection"}
          </button>
          <p className="microcopy">The optional test makes one small billable chat request using sample text.</p>
        </div>
      )}
    </form>
  );
}

export function LabSetup({
  signedIn,
  signInHref,
  headingRef,
  onContinue,
  onDemo,
  onArchive,
  onGuide,
}: {
  signedIn: boolean;
  signInHref: string;
  headingRef: Ref<HTMLHeadingElement>;
  onContinue: (key: string) => void;
  onDemo: () => void;
  onArchive: () => void;
  onGuide: () => void;
}) {
  const step = signedIn ? 1 : 0;
  return (
    <div className="setup-shell">
      <header className="setup-header">
        <LabBrand />
        <button className="text-button" type="button" onClick={onGuide}>How it works <ArrowRight size={15} aria-hidden="true" /></button>
      </header>
      <main className="setup-layout">
        <div className="setup-intro">
          <h1>From conversation to clarity.</h1>
          <p>Vaidya Setu turns a completed teleconsultation into a prescription draft. Doctors can review and edit the draft, saving time on post-consultation typing.</p>
          <div className="setup-workflow">
            <span><AudioLines size={20} aria-hidden="true" /> Recording or transcript</span>
            <ArrowRight size={17} aria-hidden="true" />
            <span><FileCheck2 size={20} aria-hidden="true" /> Medication draft to review</span>
          </div>
        </div>

        <section className="setup-card" aria-labelledby="setup-heading">
          <ol className="setup-progress" aria-label="Consultation setup">
            {["Sign in", "API key", "Consultation"].map((label, index) => (
              <li key={label} aria-current={index === step ? "step" : undefined} className={index < step ? "complete" : ""}>
                <span className="setup-step-number">
                  {index < step ? <Check size={14} aria-label="Completed" /> : index + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>
          <h2 id="setup-heading" tabIndex={-1} ref={headingRef}>{signedIn ? "Add your Sarvam API key" : "Sign in to get started"}</h2>
          {signedIn ? (
            <>
              <p>Sarvam uses your key to transcribe recordings and generate medication drafts and patient-language audio.</p>
              <SarvamKeyForm submitLabel="Continue to consultation" onSubmit={onContinue} />
            </>
          ) : (
            <>
              <p>Use your ChatGPT account to process your own consultation and access your private archive.</p>
              <a className="button primary wide" href={signInHref} target="_top">
                <LogIn size={17} aria-hidden="true" /> Sign in with ChatGPT
              </a>
            </>
          )}
          <div className="setup-demo-option">
            <p>{signedIn ? "Explore the workflow with a fictional consultation while you get your key." : "Guest access is limited to a demo with fictional data."}</p>
            <button className="button secondary wide" type="button" onClick={onDemo}>
              <Play size={16} aria-hidden="true" /> {signedIn ? "Try the fictional demo" : "Try demo without signing in"}
            </button>
          </div>
          {signedIn && <button className="text-button setup-archive" type="button" onClick={onArchive}>Open evaluation archive <ArrowRight size={15} aria-hidden="true" /></button>}
        </section>
      </main>
      <LabFooter />
    </div>
  );
}
