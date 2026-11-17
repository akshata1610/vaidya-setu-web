"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, ArrowUpRight, Archive, AudioLines, CheckCircle2, ChevronRight, CircleHelp, ClipboardCheck, Download, FileText, FlaskConical, KeyRound, LoaderCircle, LockKeyhole, Mic, Plus, RotateCcw, Search, Settings2, ShieldCheck, Trash2, Upload, X, BookOpen, ArrowRight, Save, Volume2 } from "lucide-react";
import { FIELDS, LABELS, ACTIONS, ACTION_LABELS, MEALS, MEAL_LABELS, VERSION, VOICE_LANGUAGES, CaseRevisionConflict, isVoiceLanguage, routeSuggestion, emptyMedicine, evaluate, normal, approvalProblems, requiredMedicationFields, missingMedicationFields, englishLines, type LabCase, type Field, type Reference, type VoiceLanguage } from "@/lib/domain";
import { research, discovery, RESEARCH_DATE } from "@/lib/research";
import { makePublicDemo, publicDemoAction } from "@/lib/public-demo";
import { LabBrand, LabFooter, LabSetup, SarvamKeyForm } from "./lab-setup";
import { LabGuide } from "./lab-guide";
import { MedicineEvidence, MedicineNameReferences, TimedTranscript } from "./recording-evidence";
import { ReviewedPrescription } from "./reviewed-prescription";
import { readSarvamSegments, TRANSCRIPT_LIMIT } from "@/lib/audio-evidence";
import { SARVAM_MODELS } from "@/lib/sarvam-models";
import { prepareEnglishReview } from "@/lib/medication-fields";
import { recoverVoiceConflict } from "@/lib/voice-conflict";
type Summary={id:string;title:string;kind:string;status:string;updated:string;summary:any};
type Event={id:string;revision:number;type:string;data:any;created:string};
const pretty=(s:string)=>s.replaceAll("_"," ");
function fieldValue(field: Field, value: string | null | undefined) {
 if (!value) return null;
 if (field === "action") return ACTION_LABELS[value] ?? value;
 if (field === "meal_timing") return MEAL_LABELS[value] ?? value;
 return value;
}
const fieldHint: Partial<Record<Field, string>> = {
 strength: "e.g. 500 mg per tablet",
 dose: "e.g. 1 tablet or 5 mL",
 frequency: "e.g. twice daily or every 8 hours",
 duration: "e.g. 5 days",
};
const date=(s:string)=>new Date(s).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
const labelStatus:Record<string,string>={correct:"Correct",incorrect:"Incorrect",missed:"Missed",unsupported:"Unsupported addition",correctly_blank:"Correctly blank",unreviewed:"Not reviewed",unclear:"Unclear in source"};
const workspacePages = [
 ["work", Mic, "Consultation"],
 ["archive", Archive, "Evaluation archive"],
 ["research", BookOpen, "Market research"],
 ["guide", CircleHelp, "How it works"],
] as const;
type WorkspacePage = (typeof workspacePages)[number][0];
type LabReply = { case?: LabCase; deleted?: boolean; error?: string; retryable?: boolean };
const providerActions = new Set(["translate", "check_script", "audio"]);
const voiceActions = new Set([...providerActions, "ack_script", "listened"]);
type CaseTab = "review" | "prescription" | "evaluate" | "audio" | "history";

async function readSavedCase(id: string) {
 const response = await fetch("/api/lab?id=" + encodeURIComponent(id), { cache: "no-store" });
 const data = await response.json() as LabReply & { history?: Event[] };
 if (!response.ok || !data.case) throw new Error(data.error ?? "Could not load the saved case.");
 return { record: data.case, history: data.history ?? [] };
}

export default function Lab({identity,signInHref}:{identity:{name:string;signedIn:boolean};signInHref:string}){
 const [page,setPage]=useState<"setup"|WorkspacePage>("setup");
 const [key,setKey]=useState("");
 const [settings,setSettings]=useState(false);
 const [current,setCurrent]=useState<LabCase|null>(null);const [saved,setSaved]=useState<LabCase|null>(null);const [cases,setCases]=useState<Summary[]>([]);const [history,setHistory]=useState<Event[]>([]);
 const [mode,setMode]=useState<"audio"|"text">("audio");const [file,setFile]=useState<File|null>(null);const [title,setTitle]=useState("");const [text,setText]=useState("");const [kind,setKind]=useState("roleplay_audio");const [consent,setConsent]=useState(false);
 const [voiceChoice, setVoiceChoice] = useState<{ id: string; language: VoiceLanguage | "" } | null>(null);
 const [approvalAttempt, setApprovalAttempt] = useState<string | null>(null);
 const [approvalError, setApprovalError] = useState("");
 const [conflictedCase, setConflictedCase] = useState<string | null>(null);
 const [englishEdits, setEnglishEdits] = useState(false);
 const [busy,setBusy]=useState("");const [error,setError]=useState("");const [notice,setNotice]=useState("");const [query,setQuery]=useState("");const [filter,setFilter]=useState("all");const [tab,setTab]=useState<CaseTab>("review");const [refAck,setRefAck]=useState(false);const [scriptAck,setScriptAck]=useState(false);const [listenAck,setListenAck]=useState(false);const [bilingual,setBilingual]=useState("");const [transcriptEdit,setTranscriptEdit]=useState("");
 const variant=useRef(0);const fileInput=useRef<HTMLInputElement>(null);
 const caseActionPending = useRef(false);
 const headingRef = useRef<HTMLHeadingElement>(null);
 const settingsRef = useRef<HTMLDialogElement>(null);
 const sourceDetails = useRef<HTMLDetailsElement>(null);
 const sourcePlayer = useRef<HTMLAudioElement>(null);
 const timedTranscriptDetails = useRef<HTMLDetailsElement>(null);
 const transcriptRead = useRef(0);
 const [transcriptLoading, setTranscriptLoading] = useState(false);
 const [transcriptFileError, setTranscriptFileError] = useState("");
 const sourceTimings = current?.audioSegments;
 const rawTranscript = current?.sttRaw;
 const recordingDuration = current?.audioInfo?.seconds;
 const segments = useMemo(() => sourceTimings ?? readSarvamSegments(rawTranscript, recordingDuration), [sourceTimings, rawTranscript, recordingDuration]);
 const demoActive = page === "work" && !!current?.localOnly;
 const view = demoActive ? "demo" : page === "work" && !current ? mode : page;
 const caseId = current?.id;
 const voiceLanguage = voiceChoice && voiceChoice.id === caseId
  ? voiceChoice.language
  : current?.lines?.length ? current.language ?? "" : "";
 const hasTranscript = !!(current?.transcriptReview || current?.transcript);
 const previousView = useRef({ view, caseId });
 useEffect(() => {
  if (previousView.current.view === view && previousView.current.caseId === caseId) return;
  previousView.current = { view, caseId };
  headingRef.current?.focus();
 }, [view, caseId]);
 useEffect(() => {
  if (settings && !settingsRef.current?.open) settingsRef.current?.showModal();
 }, [settings]);
 const dirty=current&&saved&&JSON.stringify({reviewed:current.reviewed,routes:current.routes,reviewer:current.reviewer,reviewAcknowledged:current.reviewAcknowledged})!==JSON.stringify({reviewed:saved.reviewed,routes:saved.routes,reviewer:saved.reviewer,reviewAcknowledged:saved.reviewAcknowledged});
 const canPrepareVoice = !!saved?.approval && !dirty;
 const showVoiceScript = canPrepareVoice && !!voiceLanguage && current?.language === voiceLanguage;
 const checkApproval = !!current && approvalAttempt === current.id;
 const approvalChecks = current && checkApproval ? approvalProblems(current) : [];
 function accept(c: LabCase) {
  const reviewed = c.reviewed.map(prepareEnglishReview);
  const updated = JSON.stringify(reviewed) !== JSON.stringify(c.reviewed);
  setCurrent(updated ? { ...c, reviewed, reviewAcknowledged: false } : c);
  setSaved(structuredClone(c));
  setEnglishEdits(updated);
  setTranscriptEdit(c.transcriptReview ?? c.transcript);
  setRefAck(c.referenceVerified);
  setScriptAck(false);
  setListenAck(false);
 }
 async function request(body: unknown, sarvamKey?: string): Promise<LabReply> {
  if (!identity.signedIn) throw new Error("Sign in to use Sarvam and your private archive.");
  const response = await fetch("/api/lab", {
   method: "POST",
   headers: { "Content-Type": "application/json", ...(sarvamKey ? { "x-sarvam-key": sarvamKey } : {}) },
   body: JSON.stringify(body),
  });
  const data = await response.json() as LabReply;
  if (response.status === 409) throw new CaseRevisionConflict(data.retryable === true);
  if (!response.ok) {
   if (data.case) accept(data.case);
   throw new Error(data.error ?? "Request failed.");
  }
  return data;
 }
 async function loadList(){if(!identity.signedIn)return;try{const r=await fetch("/api/lab",{cache:"no-store"});const d:any=await r.json();if(r.ok)setCases(d.cases);else if(identity.signedIn)setError(d.error);}catch{setError("Could not load the archive. Refresh to try again.");}}
 function navigate(next: WorkspacePage) {
  setPage(next === "work" && !current && !key ? "setup" : next);
  setError("");
  setNotice("");
  if (next === "archive") void loadList();
 }
 function startConsultation(candidate: string) {
  setKey(candidate);
  setError("");
  setNotice("");
  setPage("work");
  void loadList();
 }
 function closeSettings() {
  settingsRef.current?.close();
  setSettings(false);
 }
 function selectIntake(next: "audio" | "text") {
  setMode(next);
  setConsent(false);
  setError("");
 }
 async function uploadTranscript(transcript: File | undefined) {
  if (!transcript) return;
  const read = ++transcriptRead.current;
  setTranscriptFileError("");
  setTranscriptLoading(true);
  setConsent(false);
  try {
   if (transcript.size > 200_000) throw new Error("Use a plain-text transcript of up to 50,000 characters.");
   const content = (await transcript.text()).trim();
   if (!content || content.length > TRANSCRIPT_LIMIT || /[\u0000\uFFFD]/.test(content)) {
    throw new Error("Use a readable UTF-8 .txt file with 1–50,000 characters.");
   }
   if (read === transcriptRead.current) setText(content);
  } catch (cause) {
   if (read === transcriptRead.current) setTranscriptFileError((cause as Error).message);
  } finally {
   if (read === transcriptRead.current) setTranscriptLoading(false);
  }
 }
 function listenAt(seconds: number) {
  const player = sourcePlayer.current;
  if (!player || !sourceDetails.current) return;
  sourceDetails.current.open = true;
  player.currentTime = Math.max(0, seconds - 1);
  player.scrollIntoView({ block: "center" });
  player.focus({ preventScroll: true });
  void player.play().catch(() => {});
 }
 function browseSource() {
  const source = sourceDetails.current;
  if (!source) return;
  source.open = true;
  const timed = timedTranscriptDetails.current;
  if (timed) timed.open = true;
  const target = timed?.querySelector("input") ?? sourcePlayer.current;
  target?.scrollIntoView({ block: "center" });
  target?.focus({ preventScroll: true });
 }
 function showPrescription() {
  setTab("prescription");
  headingRef.current?.focus();
 }
 async function openCase(id: string, nextTab: CaseTab = "review") {
  setBusy("Opening saved case");
  setError("");
  setNotice("");
  try {
   const latest = await readSavedCase(id);
   accept(latest.record);
   setHistory(latest.history);
   setPage("work");
   const newPlan = !latest.record.approval || latest.record.approval.hash !== saved?.approval?.hash;
   setTab(nextTab === "audio" && newPlan ? "review" : nextTab);
   setConflictedCase(null);
   setApprovalError("");
  } catch (cause) {
   setError((cause as Error).message);
  } finally {
   setBusy("");
  }
 }
 async function action(name: string, extra: Record<string, unknown> = {}, base = current) {
  if (!base || caseActionPending.current) return;
  caseActionPending.current = true;
  setBusy(pretty(name));
  setError("");
  setNotice("");
  setConflictedCase(null);
  try {
   if (base.localOnly) {
    const example = publicDemoAction(base, name, extra, new Date().toISOString());
    accept(example);
    setHistory(events => [{
     id: crypto.randomUUID(),
     revision: example.revision,
     type: "demo_" + name,
     created: example.updated,
     data: { reviewed: example.reviewed, routes: example.routes, evaluation: name === "reference" ? evaluate(example) : undefined },
    }, ...events]);
    setNotice("Your fictional demo changes are saved in this tab until you leave the demo or refresh.");
    if (name === "approve") showPrescription();
    return example;
   }
   const submit = (revision: number) => request({ ...extra, action: name, id: base.id, revision }, providerActions.has(name) ? key : undefined);
   let data: LabReply;
   try {
    data = await submit(base.revision);
   } catch (cause) {
    if (!(cause instanceof CaseRevisionConflict) || !voiceActions.has(name) || saved?.id !== base.id) throw cause;
    const latest = await readSavedCase(base.id);
    const resolution = recoverVoiceConflict(saved, latest.record, name, extra.language, cause.retryable);
    if (resolution === "review_latest") throw cause;
    if (resolution === "use_saved_script") {
     data = { case: latest.record };
     setNotice("Opened the saved voice script for the selected language.");
    } else {
     data = await submit(latest.record.revision);
    }
    setHistory(latest.history);
   }
   if (data.case) accept(data.case);
   if (name === "approve" && data.case?.approval) {
    setNotice("Review approved. Check the prescription before printing.");
    showPrescription();
   }
   await loadList();
   if (name === "reference") setNotice("Reference and original-draft evaluation saved to your archive.");
   return data.case;
  } catch (cause) {
   if (cause instanceof CaseRevisionConflict) setConflictedCase(base.id);
   else if (name === "approve") setApprovalError((cause as Error).message);
   else setError((cause as Error).message);
  } finally {
   caseActionPending.current = false;
   setBusy("");
  }
 }
 function approvePrescription() {
  if (!current) return;
  setApprovalAttempt(current.id);
  setApprovalError("");
  setError("");
  if (dirty || approvalProblems(current).length) return;
  void action("approve");
 }
 async function process(c: LabCase) {
  async function runStep(action: string, input: LabCase) {
   const data = await request({ action, id: input.id, revision: input.revision }, key);
   if (!data.case) throw new Error("The server did not return a consultation.");
   accept(data.case);
   return data.case;
  }

  setError("");
  setNotice("");
  try {
   let next = c;
   if (!next.transcriptReview && !next.transcript && next.sourceKey) {
    setBusy(next.jobId ? "Resuming saved recording" : "Transcribing recording");
    next = await runStep("transcribe", next);
    let count = 0;
    while (next.status === "transcribing" && count < 100) {
     setBusy("Waiting for batch transcription · " + (++count));
     await new Promise(resolve => setTimeout(resolve, 3500));
     next = await runStep("poll", next);
    }
    if (next.status === "transcribing") {
     setNotice("The job is still running. Open this case from the archive and resume checking.");
     return;
    }
   }
   setBusy("Extracting medication facts");
   await runStep("extract", next);
   setNotice("Original draft saved. Check the source and each medicine before approving the plan.");
   await loadList();
  } catch (cause) {
   setError((cause as Error).message);
   await loadList();
  } finally {
   setBusy("");
  }
 }
 async function create() {
  if (!identity.signedIn) { setError("Sign in to save a consultation."); return; }
  if (!key) { setPage("setup"); return; }
  if (mode === "audio" && !file) { setError("Select a PCM WAV recording."); return; }
  if (mode === "text" && !text.trim()) { setError("Paste the consultation transcript first."); return; }
  if (!consent) { setError("Confirm permission for processing and archiving first."); return; }
  setBusy("Saving consultation");
  setError("");
  try {
   const input = new FormData();
   input.set("id", crypto.randomUUID());
   input.set("title", title || "Consultation · " + new Date().toLocaleDateString("en-IN"));
   input.set("consent", "yes");
   input.set("kind", kind);
   if (mode === "audio" && file) input.set("file", file);
   else input.set("transcript", text);
   const response = await fetch("/api/lab", { method: "POST", body: input });
   const data = await response.json() as LabReply;
   if (!response.ok || !data.case) throw new Error(data.error ?? "Could not save the consultation.");
   accept(data.case);
   await loadList();
   await process(data.case);
  } catch (cause) {
   setError((cause as Error).message);
   setBusy("");
  }
 }
 function previewDemo() {
  accept(makePublicDemo(variant.current++, "public-demo-" + crypto.randomUUID(), new Date().toISOString()));
  setHistory([]);
  setError("");
  setNotice("");
  setTab("review");
  setPage("work");
 }
 async function saveDemo() {
  setBusy("Preparing fictional example");
  setError("");
  setNotice("");
  try {
   const data = await request({ action: "demo", id: crypto.randomUUID(), variant: variant.current++ });
   if (!data.case) throw new Error("The server did not return a fictional example.");
   accept(data.case);
   setHistory([]);
   setTab("review");
   setPage("work");
   await loadList();
  } catch (cause) {
   setError((cause as Error).message);
  } finally {
   setBusy("");
  }
 }
 function fresh() {
  transcriptRead.current++;
  setTranscriptLoading(false);
  setTranscriptFileError("");
  setCurrent(null);
  setSaved(null);
  setVoiceChoice(null);
  setApprovalAttempt(null);
  setApprovalError("");
  setConflictedCase(null);
  setEnglishEdits(false);
  setHistory([]);
  setFile(null);
  setText("");
  setTitle("");
  setMode("audio");
  setConsent(false);
  setError("");
  setNotice("");
  setPage(key ? "work" : "setup");
  setTab("review");
  if (fileInput.current) fileInput.current.value = "";
 }
 function editMed(id:string,f:Field,value:string){if(!current)return;setCurrent(c=>{if(!c)return c;const n=structuredClone(c);n.reviewed=n.reviewed.map(m=>m.id===id?{...m,[f]:value||null}:m);if(f==="form"||f==="route")delete n.routes[id];return n;});}
 function annotate(id:string,f:Field,state:string,value:string|null=null){setCurrent(c=>{if(!c)return c;const n=structuredClone(c);n.reference[id]??={presence:"unreviewed",fields:{}};n.reference[id].fields[f]={state:state as any,value};return n;});setRefAck(false);}
 async function removeCase(){if(!current||!confirm("Delete this case, its recordings and review history from this website? This does not delete Sarvam's processing records."))return;setBusy("Deleting case");setError("");try{const d=await request({action:"delete",id:current.id,revision:current.revision});if(d.deleted){await loadList();fresh();}}catch(e){setError((e as Error).message);}finally{setBusy("");}}
 const evaluated=cases.filter(c=>c.kind!=="fictional"&&c.summary.referenceVerified);const correct=evaluated.reduce((n,c)=>n+c.summary.correct,0);const incorrect=evaluated.reduce((n,c)=>n+c.summary.incorrect+c.summary.unsupported,0);const blank=evaluated.reduce((n,c)=>n+c.summary.correctlyBlank,0);
 const filtered=cases.filter(c=>(filter==="all"||filter==="real"&&c.kind!=="fictional"||filter==="demo"&&c.kind==="fictional")&&(c.title+" "+c.id).toLowerCase().includes(query.toLowerCase()));
 if (page === "setup") {
  return <LabSetup
   signedIn={identity.signedIn}
   signInHref={signInHref}
   headingRef={headingRef}
   onContinue={startConsultation}
   onDemo={previewDemo}
   onArchive={() => navigate("archive")}
   onGuide={() => navigate("guide")}
  />;
 }
 if (page === "guide" && !identity.signedIn) {
  return <div className="setup-shell">
   <header className="setup-header">
    <LabBrand />
    <button className="text-button" type="button" onClick={() => setPage("setup")}><ArrowLeft size={15} aria-hidden="true" /> Back to setup</button>
   </header>
   <main className="setup-guide"><LabGuide headingRef={headingRef} /></main>
   <LabFooter />
  </div>;
 }
 return <div className={demoActive ? "app-shell demo-shell" : "app-shell"}>
  {!demoActive && <aside className="sidebar">
   <LabBrand />
   <div className="sidebar-scroll">
    <span className="nav-caption">WORKSPACE</span>
    <nav aria-label="Workspace">
     {workspacePages.map(([id, Icon, name]) => (
      <button key={id} className={page === id ? "nav-item active" : "nav-item"} aria-current={page === id ? "page" : undefined} onClick={() => navigate(id)}>
       <Icon size={18} aria-hidden="true" /><span>{name}</span>
       {id === "archive" && <span className="nav-count">{cases.length}</span>}
      </button>
     ))}
    </nav>
    <div className="sidebar-bottom">
     <div className="private-note"><ShieldCheck size={19}/><div>Private archive<small>Only your signed-in account can open its saved cases.</small></div></div>
     <button className="nav-item" disabled={!!busy} onClick={() => setSettings(true)}><KeyRound size={17}/>API settings<span className={key ? "dot green" : "dot"}/></button>
    </div>
   </div>
   <div className="profile sidebar-profile" title={identity.name}>
    <span className="avatar" aria-hidden="true">{identity.name.charAt(0).toUpperCase()}</span>
    <div>{identity.name}<small>{VERSION} · portfolio MVP</small></div>
   </div>
  </aside>}
  <main className="main">
   {demoActive ? (
    <header className="demo-header">
     <LabBrand />
     <button className="button secondary" onClick={fresh}><ArrowLeft size={15} aria-hidden="true" /> Back to setup</button>
    </header>
   ) : (
    <header className="topbar">
     <span>Workspace <ChevronRight size={13} aria-hidden="true" /><b>{workspacePages.find(([id]) => id === page)?.[2]}</b></span>
     <div>
      <span className="privacy-chip"><LockKeyhole size={12} aria-hidden="true" /> Private archive</span>
      <button className="icon-button" title="API settings" aria-label="API settings" disabled={!!busy} onClick={() => setSettings(true)}><Settings2 size={18}/></button>
     </div>
    </header>
   )}
   <div className="content">
    {error&&<div className="banner error" role="alert"><span>{error}</span><button aria-label="Dismiss error" onClick={()=>setError("")}><X size={16}/></button></div>}
    {page === "work" && conflictedCase && conflictedCase === caseId && (
     <div className="banner error case-conflict" role="alert">
      <span>A newer version of this case is available. Load the latest saved version to continue.</span>
      <button className="button secondary" disabled={!!busy} onClick={() => void openCase(conflictedCase, tab)}>
       <RotateCcw size={15} aria-hidden="true" /> Load latest saved version
      </button>
     </div>
    )}
    {notice&&<div className="banner success" role="status"><span>{notice}</span><button aria-label="Dismiss notice" onClick={()=>setNotice("")}><X size={16}/></button></div>}
    {busy&&<div className="working" role="status"><LoaderCircle size={15} className="spin"/>{busy}…</div>}
    {page==="work"&&<>
     {demoActive ? (
      <div className="page-heading demo-heading">
       <div>
        <span className="badge amber">Fictional demo</span>
        <h1 tabIndex={-1} ref={headingRef}>Try a fictional consultation</h1>
        <p>Start with the source conversation. Compare what the doctor said with the medication draft below, then try saving a correction. Your changes stay in this tab.</p>
       </div>
       {!identity.signedIn && <a className="button primary" href={signInHref} target="_top">Sign in with ChatGPT <ArrowRight size={16} aria-hidden="true" /></a>}
      </div>
     ) : (
      <div className="page-heading consultation-heading">
       <div>
        <h1 tabIndex={-1} ref={headingRef}>{current ? current.title : mode === "text" ? "Add the consultation transcript" : "From conversation to clarity."}</h1>
        <p>{current
         ? "Check what the doctor said against the medication draft and correct it before approving the plan."
         : mode === "text"
          ? "Upload a plain-text file or paste the completed conversation. Sarvam 105B will draft the medication instructions the doctor discussed."
          : "Upload a completed teleconsultation recording or go to the transcript page. Vaidya Setu drafts the medication instructions from the conversation, saving doctors the work of typing the prescription from scratch."}</p>
       </div>
       {current && <button className="button secondary" disabled={!!busy} onClick={fresh}><RotateCcw size={15} /> Clear / new session</button>}
      </div>
     )}
     {!current?<>
      <div className="steps" aria-label="Consultation workflow">
       <span className="step active" aria-current="step"><b>1</b> Add conversation</span><i aria-hidden="true"/>
       <span className="step"><b>2</b> Review draft</span><i aria-hidden="true"/>
       <span className="step"><b>3</b> Prescription & optional voice guide</span>
      </div>
      <div className="workspace-grid consultation-grid"><section className="panel input-panel">
       <div className="panel-heading">
        <div className="heading-icon">{mode === "audio" ? <AudioLines size={20} aria-hidden="true" /> : <FileText size={20} aria-hidden="true" />}</div>
        <div><h2>{mode === "audio" ? "Upload a consultation recording" : "Upload or paste the transcript"}</h2></div>
       </div>
       {mode === "text" && (
        <button className="text-button intake-switch" disabled={transcriptLoading || !!busy} onClick={() => selectIntake("audio")}><ArrowLeft size={15} aria-hidden="true" /> Back to recording upload</button>
       )}
       <label className="field-label">Case label (optional) <span>Use an alias to keep the case deidentified.</span><input value={title} maxLength={90} placeholder="Example: Kannada role-play 01" onChange={event => setTitle(event.target.value)} /></label>
       {mode === "audio" ? <>
        <label className="dropzone" onDragOver={event => event.preventDefault()} onDrop={event => {
         event.preventDefault();
         if (!busy && event.dataTransfer.files[0]) setFile(event.dataTransfer.files[0]);
        }}>
         <span className="upload-icon"><Upload size={23} aria-hidden="true" /></span>
         <strong>{file ? file.name : "Drop your consultation recording here"}</strong>
         <span>{file ? `${(file.size/1048576).toFixed(1)} MB · ready to upload` : "or click to browse files"}</span>
         <small>PCM WAV · up to 10 minutes · 30 MB</small>
         <input ref={fileInput} type="file" accept=".wav,audio/wav" disabled={!!busy} onChange={event => setFile(event.target.files?.[0] ?? null)} />
        </label>
        <button className="text-button transcript-alternative" disabled={!!busy} onClick={() => selectIntake("text")}>
         or go to the transcript page <ArrowRight size={15} aria-hidden="true" />
        </button>
        <label className="field-label">Recording type<select value={kind} onChange={event => setKind(event.target.value)}><option value="roleplay_audio">Fictional role-play by human speakers</option><option value="human_audio">Consented, deidentified consultation</option></select></label>
       </> : <>
        <label className="field-label">Upload a .txt transcript<input type="file" accept=".txt,text/plain" disabled={!!busy} onChange={event => void uploadTranscript(event.target.files?.[0])} /></label>
        {transcriptLoading && <p className="microcopy" role="status">Reading transcript…</p>}
        {transcriptFileError && <p className="warning-text" role="alert">{transcriptFileError}</p>}
        <label className="field-label">Conversation <span>Paste the transcript here or check the text from your file.</span><textarea rows={8} value={text} maxLength={TRANSCRIPT_LIMIT} disabled={transcriptLoading || !!busy} placeholder="Doctor: …&#10;Patient: …" onChange={event => setText(event.target.value)} /></label>
       </>}
       <label className="check-row consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I have permission from all participants to upload, process with Sarvam and retain this deidentified input for evaluation.</span></label>
       <button className="button primary wide" disabled={!!busy||!key||(mode==="text"&&transcriptLoading)} onClick={()=>void create()}><FlaskConical size={16}/>Generate medication draft <ArrowRight size={15}/></button><p className="microcopy"><LockKeyhole size={11}/> Your source, draft and corrections go into your private archive.</p>
      </section>
      <aside className="right-rail consultation-rail">
       <section className="panel quiet consultation-guide">
        <h2><ClipboardCheck size={19} aria-hidden="true" /> What happens next</h2>
        <ol className="consultation-next">
         <li><strong>Add the conversation.</strong><p>Upload your recorded WAV here or continue to the transcript page to upload a .txt file or paste the conversation.</p></li>
         <li><strong>Let Sarvam prepare a draft.</strong><p>{SARVAM_MODELS.transcription.label} transcribes recordings. {SARVAM_MODELS.extraction.label} drafts the medication instructions from the transcript.</p></li>
         <li><strong>Review and correct the draft.</strong><p>Compare the draft with what the doctor discussed with the patient. Use a medicine’s timestamp when available to check the recording, then edit, save and approve.</p></li>
         <li><strong>Generate the prescription.</strong><p>Approval prepares a printable prescription for the clinician to complete and sign.</p></li>
         <li><strong>Prepare voice instructions if needed.</strong><p>{SARVAM_MODELS.translation.label} translates the reviewed instructions when needed. {SARVAM_MODELS.speech.label} reads the script aloud.</p></li>
        </ol>
       </section>
       <section className="panel quiet">
        <h3>Practice with a fictional case</h3>
        <p>Try the review steps on a prepared example saved to your archive.</p>
        <button className="button secondary wide" disabled={!!busy} onClick={() => void saveDemo()}>Open fictional example <ArrowUpRight size={15} aria-hidden="true" /></button>
       </section>
      </aside></div>
     </>:<>
      {!demoActive && <div className="case-meta"><span className={current.kind==="fictional"?"badge amber":"badge pale"}>{pretty(current.kind)}</span><span className="badge neutral">{pretty(current.status)}</span><span>{date(current.created)} · revision {current.revision}</span>{current.draftSource==="prepared"&&<b className="demo-label">Prepared example</b>}</div>}
      {current.error&&!error&&!busy&&<div className="banner error" role="alert"><span>{current.error} Your source remains saved.</span></div>}
      <div className="case-tabs">{([["review","Medication review"],["prescription","Prescription"],["audio","Voice instructions for the patient"],["evaluate","Source & evaluation"],["history",demoActive?"Demo history":"Saved history"]] as const).map(([id,label])=><button className={tab===id?"selected":""} aria-pressed={tab===id} key={id} onClick={()=>{setTab(id);if(id==="history"&&!current.localOnly)void fetch("/api/lab?id="+current.id).then(r=>r.json()).then((d:any)=>setHistory(d.history??[]));}}>{label}</button>)}</div>
      {tab==="review"&&<>
       <section className="panel source-panel">
        <details key={current.id} ref={sourceDetails} open={demoActive || !current.reviewed.length}>
         <summary>
          <FileText size={17} aria-hidden="true" /> Source conversation
          <span>{current.sourceKey ? `${current.audioInfo?.seconds}s WAV · ${current.detectedLanguage ?? "language pending"}` : demoActive ? "Fictional transcript" : "Written transcript"}</span>
         </summary>
         {current.sourceKey && <audio ref={sourcePlayer} controls preload="metadata" aria-label="Source consultation recording" src={"/api/lab?id=" + current.id + "&asset=source"} />}
         {current.transcript && <pre className="transcript">{current.transcript}</pre>}
         {!hasTranscript && <p className="microcopy">Your recording is saved. Transcribe it with Sarvam or paste the conversation below.</p>}
         {segments.length > 0 && <TimedTranscript segments={segments} onListen={listenAt} detailsRef={timedTranscriptDetails} />}
         {current.transcriptReview && <><h4>Reviewed transcript</h4><pre className="transcript">{current.transcriptReview}</pre></>}
         {!demoActive && current.draftSource !== "sarvam" && (
          <>
           <details className="nested" open={!hasTranscript && !!current.error}>
            <summary>{hasTranscript ? "Correct the transcript before extraction" : "Paste a transcript for this recording"}</summary>
            <label className="field-label">
             Consultation transcript
             <textarea rows={6} value={transcriptEdit} maxLength={TRANSCRIPT_LIMIT} onChange={event => setTranscriptEdit(event.target.value)} />
            </label>
            <button disabled={!!busy || !transcriptEdit.trim()} className="button secondary" onClick={() => void action("transcript", { transcript: transcriptEdit })}>Save transcript</button>
           </details>
           {key ? (
            <button className="button primary" disabled={!!busy} onClick={() => void process(current)}>{hasTranscript ? "Generate draft from transcript" : current.error ? "Retry transcription" : "Resume transcription"}</button>
           ) : (
            <button className="button secondary" onClick={() => setSettings(true)}><KeyRound size={15} /> Add Sarvam API key</button>
           )}
          </>
         )}
        </details>
       </section>
       {!current.reviewed.length&&<section className="panel quiet"><h3>{current.draftSource==="sarvam"?"No medicine records extracted":"Medication table not ready"}</h3><p>{!hasTranscript?"To generate a medication draft, transcribe the saved recording or supply the conversation as text.":current.draftSource==="sarvam"?"Review the transcript against the source to check whether medicine instructions were stated.":"The transcript is available. Use Generate draft from transcript to prepare the medication draft."}</p></section>}
       {!demoActive&&current.notes.length>0&&<div className="review-notes">{current.notes.map((n,i)=><p key={i}>{n}</p>)}</div>}
       <div className="section-row">
        <div>
         <h2>Medication review</h2>
         <p>Use English for the table. <strong>*</strong> marks fields required for the selected instruction. Fill optional details when the source gives them.</p>
        </div>
        <button className="button secondary" disabled={!!busy || current.reviewed.length >= 12} onClick={() => setCurrent({
         ...current, reviewed: [...current.reviewed, emptyMedicine("added-" + crypto.randomUUID())],
        })}><Plus size={14} /> Add missed medicine</button>
       </div>
       {englishEdits && <p className="review-field-notice" role="status">Review and save the English field updates for this case.</p>}
       {!demoActive && current.reviewed.length > 0 && <MedicineNameReferences />}
       {current.reviewed.map((medicine, index) => {
        const route = routeSuggestion(medicine);
        const original = current.original.find(row => row.id === medicine.id);
        const required = requiredMedicationFields(medicine);
        const missing = checkApproval ? missingMedicationFields(current, medicine) : [];
        const routeConfirmed = current.routes[medicine.id]?.confirmed ?? false;
        return (
         <section className="panel medicine-card" key={medicine.id}>
          <div className="medicine-heading">
           <span className="medicine-number">{String(index + 1).padStart(2, "0")}</span>
           <div><h3>{medicine.drug_name || "Medicine needs identification"}</h3><span>{original ? "Original draft preserved" : "Added by reviewer · missing from original draft"}</span></div>
          </div>
          <div className="fields-grid">
           {FIELDS.map(field => {
            const mandatory = required.includes(field);
            const changed = normal(original?.[field]) !== normal(medicine[field]);
            const input = {
             "aria-label": LABELS[field],
             "aria-required": mandatory && !(field === "route" && routeConfirmed) || undefined,
             "aria-invalid": missing.includes(field) || undefined,
             onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => editMed(medicine.id, field, event.target.value),
            };
            return (
             <label key={field} className={changed ? "field-label corrected" : "field-label"}>
              <span className="medicine-field-title">{LABELS[field]}{mandatory && <span className="required-mark" aria-hidden="true"> *</span>}</span>
              {field === "action" ? (
               <select {...input} title={fieldValue(field, medicine[field]) ?? ACTION_LABELS.unclear} value={medicine[field] ?? "unclear"}>
                {ACTIONS.map(value => <option key={value} value={value}>{ACTION_LABELS[value]}</option>)}
               </select>
              ) : field === "meal_timing" ? (
               <select {...input} value={medicine[field] ?? ""}>
                <option value="">Not stated</option>
                {MEALS.map(value => <option key={value} value={value}>{MEAL_LABELS[value]}</option>)}
               </select>
              ) : (
               <input {...input} title={fieldHint[field]} value={medicine[field] ?? ""} placeholder={fieldHint[field] ?? "Not stated"} maxLength={600} />
              )}
             </label>
            );
           })}
          </div>
          <p className="microcopy">Amount per dose is what the patient takes at one time, such as 1 tablet or 5 mL. Strength is the amount of medicine in each unit, such as 500 mg per tablet.</p>
          <div className="route-box">
           <div><span className="badge pale">{route.source === "stated" ? "EXTRACTED ROUTE" : route.value ? "ROUTE SUGGESTION" : "ROUTE UNKNOWN"}</span><strong>{route.value ?? "Confirm with a qualified reviewer"}</strong><small>{route.reason}</small></div>
           {!medicine.route && route.value && <label className="check-row">
            <input type="checkbox" checked={routeConfirmed} onChange={event => setCurrent({
             ...current,
             routes: { ...current.routes, [medicine.id]: { value: route.value!, confirmed: event.target.checked, basis: "form_suggestion" } },
            })} />
            <span>I confirm this route</span>
           </label>}
          </div>
          {medicine.review_reason && <p className="warning-text"><strong>Check this detail.</strong> {medicine.review_reason}</p>}
          <MedicineEvidence quote={original?.evidence_quote} hasRecording={!!current.sourceKey} segments={segments} onListen={listenAt} onBrowse={browseSource} />
         </section>
        );
       })}
       <section className="panel approval-panel">
        <h3>Review this exact version</h3>
        <p>Saving changes to the plan or review requires fresh approval before printing or preparing voice instructions.</p>
        <label className="field-label narrow">
         <span className="medicine-field-title">{current.kind === "fictional" ? "Demo reviewer" : "Reviewer’s name"}<span className="required-mark" aria-hidden="true"> *</span></span>
         <input aria-required="true" aria-invalid={checkApproval && !current.reviewer.trim() || undefined} value={current.reviewer} onChange={event => setCurrent({ ...current, reviewer: event.target.value })} placeholder="Your name" maxLength={120} />
        </label>
        <label className="check-row">
         <input type="checkbox" checked={current.reviewAcknowledged} aria-required="true" onChange={event => setCurrent({ ...current, reviewAcknowledged: event.target.checked })} />
         <span>{current.kind === "fictional" ? "I checked these fictional medication details against the sample conversation." : "I checked the final instructions against the source and resolved uncertainties with the clinician."}</span>
        </label>
        <div className="button-row">
         <button className="button secondary" disabled={!!busy} onClick={() => {
          setApprovalError("");
          void action("review", { reviewed: current.reviewed, routes: current.routes, reviewer: current.reviewer, reviewAcknowledged: current.reviewAcknowledged });
         }}><Save size={15} /> Save corrections{dirty ? " *" : ""}</button>
         <button className="button primary" disabled={!!busy} onClick={approvePrescription}>
          <ShieldCheck size={15} /> {saved?.approval && !dirty ? "Approve saved version again" : "Approve & prepare prescription"}
         </button>
         {saved?.approval && !dirty && <button className="text-button" onClick={showPrescription}>View prescription <ArrowRight size={14} /></button>}
        </div>
        {checkApproval && (approvalChecks.length > 0 || !!dirty || approvalError) && (
         <div className="approval-error" role="alert">
          {approvalChecks.length > 0 && <>
           <strong>Please fill in the required fields and resolve these checks.</strong>
           <ul>{approvalChecks.map((problem, index) => <li key={index}>{problem}</li>)}</ul>
          </>}
          {dirty && <p>Save corrections before approving.</p>}
          {approvalError && <p>{approvalError}</p>}
         </div>
        )}
        <small className="microcopy">{current.localOnly ? "Save edits before approval. Preview changes remain in this tab only." : "Save edits before approval. Saving creates an entry in the archive."}</small>
       </section>
      </>}
      {tab === "prescription" && (saved?.approval && !dirty ? (
       <ReviewedPrescription record={saved} onAudio={() => { setTab("audio"); headingRef.current?.focus(); }} />
      ) : (
       <section className="panel intro-panel">
        <FileText size={22} aria-hidden="true" />
        <div>
         <h2>Approve the medication draft first</h2>
         <p>Check the doctor’s instructions, save any corrections and approve the saved version to prepare the prescription.</p>
         <button className="button secondary prescription-return" onClick={() => setTab("review")}>Back to medication review <ArrowRight size={15} /></button>
        </div>
       </section>
      ))}
      {tab==="evaluate"&&<>
       <section className="panel intro-panel"><FlaskConical size={23}/><div><h2>What did the doctor actually say?</h2><p>The reference is your source-checked answer. “Not mentioned” means the source omits a fact; “missed” means the source states it and the AI leaves it blank. Route suggestions are excluded from the original extraction score.</p></div></section>
       {current.reviewed.map((m,i)=><section className="panel" key={m.id}><div className="section-row"><h3>{i+1}. {m.drug_name||"Unnamed medicine"}</h3><label className="field-label">Is this a final-plan medicine?<select value={current.reference[m.id]?.presence??"unreviewed"} onChange={e=>{const r=structuredClone(current.reference);r[m.id]??={presence:"unreviewed",fields:{}};r[m.id].presence=e.target.value as any;setCurrent({...current,reference:r});setRefAck(false);}}><option value="unreviewed">Not reviewed</option><option value="in_plan">Yes, in the final stated plan</option><option value="not_in_plan">No, history / discussed / extra</option></select></label></div><div className="table-scroll"><table><thead><tr><th>Field</th><th>Original AI value</th><th>Source annotation</th><th>Reference value</th></tr></thead><tbody>{FIELDS.map(f=>{const a=current.reference[m.id]?.fields[f];return <tr key={f}><td>{LABELS[f]}</td><td>{fieldValue(f,current.original.find(x=>x.id===m.id)?.[f])??<span className="muted">Blank</span>}</td><td><select aria-label={m.id+" "+f+" source annotation"} value={a?.state??"unreviewed"} onChange={e=>annotate(m.id,f,e.target.value,e.target.value==="stated"?a?.value??"":null)}><option value="unreviewed">Not reviewed</option><option value="stated">Explicitly stated</option><option value="not_mentioned">Not mentioned</option><option value="unclear">Unclear in source</option></select></td><td>{f==="action"?<select aria-label={m.id+" "+f+" reference value"} disabled={a?.state!=="stated"} value={a?.value??""} onChange={e=>annotate(m.id,f,"stated",e.target.value)}><option value="">Choose doctor’s instruction</option>{a?.value&&!ACTIONS.includes(a.value)&&<option value={a.value}>{a.value}</option>}{ACTIONS.map(v=><option key={v} value={v}>{ACTION_LABELS[v]}</option>)}</select>:<input aria-label={m.id+" "+f+" reference value"} disabled={a?.state!=="stated"} value={a?.value??""} placeholder={a?.state==="not_mentioned"?"Absent from source":"Source-verified value"} maxLength={600} onChange={e=>annotate(m.id,f,"stated",e.target.value)}/>}</td></tr>;})}</tbody></table></div></section>)}
       <section className="panel"><div className="two-fields"><label className="field-label">Reference checked by<input value={current.referenceReviewer} placeholder="Reviewer name" onChange={e=>setCurrent({...current,referenceReviewer:e.target.value})}/></label><div className="hint">Leave uncertain fields unreviewed or unclear. Partial annotations remain partial; they do not establish whole-case accuracy.</div></div><label className="check-row"><input type="checkbox" checked={refAck} onChange={e=>setRefAck(e.target.checked)}/><span>I independently checked these reference values against the recording or supplied source, rather than treating AI output as truth.</span></label><button className="button primary" disabled={!!busy||!current.reviewed.length||!!dirty} onClick={()=>void action("reference",{reference:current.reference,referenceReviewer:current.referenceReviewer,referenceVerified:refAck})}><ClipboardCheck size={15}/>Save reference & evaluate original</button>{dirty&&<p className="warning-text">Save medication corrections on the review tab first.</p>}</section>
       {saved?.referenceVerified&&<section className="panel"><h3>{current.localOnly?"Local original-draft results":"Saved original-draft results"}</h3><div className="mini-stats"><span><b>{evaluate(saved).correct}</b>Correct stated fields</span><span><b>{evaluate(saved).incorrect}</b>Incorrect / missed</span><span><b>{evaluate(saved).correctlyBlank}</b>Correctly blank</span><span><b>{evaluate(saved).unsupported}</b>Unsupported additions</span></div><p className="microcopy">{evaluate(saved).fullyAnnotated?"All retained fields annotated":"Partial reference · no complete-case accuracy claim"} · {evaluate(saved).missed} missed medicines · {evaluate(saved).extra} extra medicines. Equality uses conservative text normalisation; inspect valid paraphrases.</p><div className="table-scroll"><table><thead><tr><th>Medicine / field</th><th>Original</th><th>Reference</th><th>Current review</th><th>Outcome</th></tr></thead><tbody>{evaluate(saved).cells.map(x=><tr key={x.id+x.field}><td>{x.id} · {LABELS[x.field]}</td><td>{fieldValue(x.field,x.original)??"Blank"}</td><td>{fieldValue(x.field,x.expected)??(x.status==="correctly_blank"||x.status==="unsupported"?"Not mentioned":"—")}</td><td>{fieldValue(x.field,x.reviewed)??"Blank"}{x.changed&&<small className="changed-tag">Edited</small>}</td><td><span className={"badge "+(["correct","correctly_blank"].includes(x.status)?"pale":["unreviewed","unclear"].includes(x.status)?"neutral":"amber")}>{labelStatus[x.status]}</span></td></tr>)}</tbody></table></div></section>}
      </>}
      {tab === "audio" && demoActive && (
       <section className="panel intro-panel">
        <Volume2 size={23} aria-hidden="true" />
        <div>
         <h2>Voice instructions for the patient</h2>
         <p>Sign in and add a Sarvam key to prepare spoken instructions in the patient’s preferred language.</p>
         {canPrepareVoice && englishLines(current).map(line => <p key={line.id} className="english-line">{line.english}</p>)}
        </div>
       </section>
      )}
      {tab==="audio"&&!demoActive&&<>
       <section className="panel voice-panel">
        <div className="section-row">
         <div><h2>Voice instructions for the patient</h2><p>Prepare a spoken sentence for each medicine using the approved dose and schedule.</p></div>
         <span className={"badge " + (canPrepareVoice ? "pale" : "amber")}>{canPrepareVoice ? "Plan approved" : "Plan approval required"}</span>
        </div>
        <label className="field-label narrow">
         Patient’s preferred language
         <select value={voiceLanguage} disabled={!!busy || !canPrepareVoice} onChange={event => {
          const selected = event.target.value;
          setVoiceChoice({ id: current.id, language: isVoiceLanguage(selected) ? selected : "" });
          setScriptAck(false);
          setListenAck(false);
          setBilingual("");
         }}>
          <option value="">Choose a language</option>
          {Object.entries(VOICE_LANGUAGES).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
         </select>
        </label>
        {key ? (
         <button className="button primary" disabled={!!busy || !canPrepareVoice || !voiceLanguage} onClick={() => void action("translate", { language: voiceLanguage })}>
          <FileText size={16} /> Prepare script for the patient
         </button>
        ) : (
         <button className="button secondary" disabled={!!busy} onClick={() => setSettings(true)}><KeyRound size={15} /> Add Sarvam API key</button>
        )}
        <p className="microcopy">Review the script, then listen to the recording before downloading the voice instructions.</p>
       </section>
       {showVoiceScript && current.lines?.map((l,i)=><section className="panel" key={l.id}><h3>Instruction {i+1}</h3><p className="english-line">{l.english}</p><label className="field-label">Script for the patient<textarea rows={4} value={l.native} onChange={e=>{setCurrent({...current,scriptReviewed:false,lines:current.lines!.map(x=>x.id===l.id?{...x,native:e.target.value,back:undefined}:x)});setScriptAck(false);}}/></label>{l.back&&<div className="back-translation"><span className="eyebrow">BACK-TRANSLATION · REVIEW AID</span><p>{l.back}</p></div>}</section>)}
       {showVoiceScript&&!!current.lines?.length&&<section className="panel"><button className="button secondary" disabled={!!busy||!key} onClick={()=>void action("check_script",{lines:current.lines})}>Save script & back-translate</button>{current.scriptWarnings?.map((w,i)=><p className="warning-text" key={i}>{w}</p>)}<label className="field-label narrow">Bilingual reviewer<input value={bilingual} onChange={e=>setBilingual(e.target.value)} placeholder="Name"/></label><label className="check-row"><input type="checkbox" checked={scriptAck} onChange={e=>setScriptAck(e.target.checked)}/><span>I checked the actual script, medicine names, units, numbers and timing and resolved the warnings.</span></label><div className="button-row"><button className="button secondary" disabled={!!busy||!scriptAck||!bilingual||current.lines.some(l=>!l.back)} onClick={()=>void action("ack_script",{acknowledged:scriptAck,reviewer:bilingual})}><CheckCircle2 size={15}/>Approve script</button><button className="button primary" disabled={!!busy||!saved?.scriptReviewed||!current.scriptReviewed||!key} onClick={()=>void action("audio")}><Volume2 size={16}/>Generate voice instructions</button></div></section>}
       {showVoiceScript&&current.audioKey&&current.scriptReviewed&&<section className="panel"><h3>Listen to the voice instructions</h3><audio controls src={"/api/lab?id="+current.id+"&asset=preview&v="+current.revision}/><label className="check-row"><input type="checkbox" checked={listenAck} onChange={e=>setListenAck(e.target.checked)}/><span>I listened to the complete audio and checked pronunciation, amounts, frequency, timing and omissions against the reviewed script.</span></label><div className="button-row"><button className="button secondary" disabled={!!busy||!listenAck} onClick={()=>void action("listened",{listened:listenAck})}>Record listening review</button>{saved?.listened&&<a className="button primary" href={"/api/lab?id="+current.id+"&asset=download"}><Download size={15}/>Download voice instructions (WAV)</a>}</div></section>}
      </>}
      {tab==="history"&&<section className="panel"><div className="section-row"><div><h2>{current.localOnly?"Local demonstration history":"Saved history"}</h2><p>{current.localOnly?"Fictional changes in this tab only. No server archive was accessed.":"Original baseline, review changes and processing events. Latest 100 events shown."}</p></div>{!current.localOnly&&<a className="button secondary" href={"/api/lab?id="+current.id+"&export=1"}><Download size={15}/>Export case JSON</a>}</div><div className="timeline">{history.map(e=><details key={e.id}><summary><span className="timeline-dot"/><div><b>{pretty(e.type)}</b><small>{date(e.created)} · revision {e.revision}</small></div><ChevronRight size={15}/></summary><pre>{JSON.stringify(e.data,null,2)}</pre></details>)}</div>{!current.localOnly&&<div className="danger-zone"><p>Delete this case and its archived files from this website. Provider-side processing records are separate.</p><button className="button danger" disabled={!!busy} onClick={()=>void removeCase()}><Trash2 size={14}/>Delete case</button></div>}</section>}
     </>}
    </>}
    {page==="archive"&&<><div className="page-heading"><div><span className="eyebrow">PERSISTENT EVALUATION HISTORY</span><h1 tabIndex={-1} ref={headingRef}>Your evidence, over time.</h1><p>Original drafts, corrections and source-checked outcomes stay together.</p></div><button className="button primary" disabled={!!busy} onClick={fresh}><Plus size={15}/>New consultation</button></div><div className="stats-grid"><Stat label="Saved consultations" value={cases.length} detail="Includes labelled fictional cases"/><Stat label="Correct stated fields" value={correct} detail="Verified references; prepared demos excluded"/><Stat label="Incorrect / unsupported" value={incorrect} detail="Original AI values, before edits"/><Stat label="Correctly blank" value={blank} detail="Verified absent from source"/></div><div className="panel archive-panel"><div className="section-row"><h2>Consultation archive</h2><span className="microcopy">Latest 200 cases · {evaluated.length} with verified recording / text references</span></div><div className="archive-tools"><label className="search"><Search size={16}/><input aria-label="Search archive" placeholder="Search by case label" value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="Filter archive" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All cases</option><option value="real">Exclude prepared examples</option><option value="demo">Prepared examples only</option></select><button className="icon-button" aria-label="Refresh archive" onClick={()=>void loadList()}><RotateCcw size={16}/></button></div>{!filtered.length?<div className="empty-state"><Archive size={34}/><h3>{query?"No matching cases":"Your first case starts the history."}</h3><p>Each saved conversation, correction and verified reference will appear here.</p><button className="button secondary" onClick={fresh}>Start a consultation <ArrowRight size={14}/></button></div>:<div className="table-scroll"><table className="archive-table"><thead><tr><th>Case</th><th>Saved</th><th>Status</th><th>Evaluation</th><th/></tr></thead><tbody>{filtered.map(c=><tr key={c.id}><td><button className="case-link" onClick={()=>void openCase(c.id)}>{c.title}</button><small>{pretty(c.kind)} · {c.summary.medicines} medicines</small></td><td>{date(c.updated)}</td><td><span className="badge neutral">{pretty(c.status)}</span></td><td>{c.summary.referenceVerified?<><b>{c.summary.correct} correct · {c.summary.incorrect+c.summary.unsupported} errors</b><small>{c.summary.correctlyBlank} correctly blank · {c.summary.fullyAnnotated?"full reference":"partial reference"}</small></>:<span className="muted">Reference not verified</span>}</td><td><button className="icon-button" aria-label={"Open "+c.title} onClick={()=>void openCase(c.id)}><ArrowUpRight size={17}/></button></td></tr>)}</tbody></table></div>}</div><p className="boundary-note">Counts describe annotated fields in this archive, not clinical safety or a representative accuracy benchmark. Prepared examples are excluded from the three quality counters. Partial references and failed cases remain visible.</p></>}
    {page==="research"&&<><div className="page-heading"><div><span className="eyebrow">INDIA · TELECONSULTATION RESEARCH</span><h1 tabIndex={-1} ref={headingRef}>A large channel. A specific problem.</h1><p>Published numbers, their limits and what they mean for this MVP.</p></div><span className="badge neutral">Checked {RESEARCH_DATE}</span></div><div className="research-intro"><BookOpen size={23}/><p>Government programme counts, company disclosures and studies use different time periods and populations. They are presented separately. Product implications below are hypotheses to validate, not measured Vaidya Setu outcomes.</p></div><div className="research-grid">{research.map((r,i)=><article className="panel research-card" key={r.tag}><span className="eyebrow">{String(i+1).padStart(2,"0")} / {r.tag}</span><div className="research-stat">{r.stat}</div><p className="stat-caption">{r.label}</p><h2>{r.title}</h2><p>{r.body}</p><div className="implication"><b>Product implication</b><p>{r.implication}</p></div><a className="source-link" href={r.url} target="_blank" rel="noreferrer">{r.source}<ArrowUpRight size={14}/></a>{r.extraUrl&&<a className="source-link" href={r.extraUrl} target="_blank" rel="noreferrer">MoHFW guideline document <ArrowUpRight size={14}/></a>}</article>)}</div><section className="panel"><h2>Discovery still needed</h2><p>No primary interviews, purchase commitments or willingness-to-pay results are claimed.</p><div className="table-scroll"><table><thead><tr><th>Who to speak with</th><th>Questions to resolve</th></tr></thead><tbody>{discovery.map(([a,b])=><tr key={a}><td>{a}</td><td>{b}</td></tr>)}</tbody></table></div><p className="hint">Proposed entry point: a small, authorised provider workflow for source-reviewed Kannada/Hindi instructions. Measure field errors, reviewer effort, bilingual audio fidelity and patient teach-back before expanding. No inferred TAM or revenue forecast is presented.</p></section></>}
    {page === "guide" && <LabGuide headingRef={headingRef} />}
    <LabFooter />
   </div>
  </main>
  {settings && identity.signedIn && (
   <dialog className="settings-modal key-dialog" aria-labelledby="settings-title" ref={settingsRef} onClose={() => setSettings(false)}>
    <div className="section-row">
     <div className="heading-icon"><KeyRound size={21} aria-hidden="true" /></div>
     <button className="icon-button" aria-label="Close API settings" onClick={closeSettings}><X size={19} /></button>
    </div>
    <h2 id="settings-title">Sarvam API settings</h2>
    <p>Use a key with credits and permission for the Sarvam services you need.</p>
    <SarvamKeyForm
     initialKey={key}
     submitLabel="Save API key"
     onTest={candidate => request({ action: "test_key" }, candidate)}
     onSubmit={candidate => {
      setKey(candidate);
      setError("");
      closeSettings();
     }}
    />
    {key && <button className="text-button key-remove" onClick={() => {
     setKey("");
     closeSettings();
     if (page === "work" && !current) setPage("setup");
    }}>Remove key from this tab</button>}
   </dialog>
  )}
 </div>;
}
function Stat({label,value,detail}:{label:string;value:number;detail:string}){return <section className="stat-card"><span>{label}</span><b>{value}</b><small>{detail}</small></section>;}
