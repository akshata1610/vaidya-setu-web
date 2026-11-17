import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database, bucket, createCase, ownedCase, saveCase } from "@/lib/store";
import { VERSION, FIELDS, CaseRevisionConflict, validateMedicines, requireFreshRevision, routeSuggestion, approvalProblems, invalidate, invalidateVoice, isVoiceLanguage, englishLines, numericTokens, wavInfo, evaluate, emptyMedicine, type LabCase, type Reference } from "@/lib/domain";
import { Sarvam } from "@/lib/sarvam";
import { readSarvamTranscript, TRANSCRIPT_LIMIT } from "@/lib/audio-evidence";
import { readSourceAudio } from "@/lib/source-audio";
import { prepareEnglishReview } from "@/lib/medication-fields";
import { matchesMealInstruction } from "@/lib/voice-instructions";
export const dynamic="force-dynamic";
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
function message(e:unknown){return e instanceof Error?e.message:"The operation failed. No new output was approved.";}
function failure(e: unknown, retryable = false) {
 if (e instanceof CaseRevisionConflict) return json({ error: e.message, retryable }, 409);
 const s = message(e);
 return json({ error: s === "NOT_FOUND" ? "Case not found." : s }, s === "NOT_FOUND" ? 404 : 400);
}
function validId(id:string){if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw new Error("Invalid case identity.");return id;}
async function approvalHash(c: LabCase, legacy = false) {
 const plan = { medicines: c.reviewed, routes: c.routes, ...(legacy ? { language: c.language } : {}) };
 const data = new TextEncoder().encode(JSON.stringify(plan));
 return [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))].map(byte => byte.toString(16).padStart(2, "0")).join("");
}
async function hasApprovedPlan(c: LabCase) {
 return !!c.approval && c.approval.hash === await approvalHash(c, c.approval.version !== 2);
}
function verifyTranscript(result: unknown, c: LabCase) {
 const parsed = readSarvamTranscript(result, c.audioInfo?.seconds);
 if (parsed.problem === "empty") {
  delete c.jobId;
  throw new Error("Sarvam returned no usable speech text. Play the saved recording to check the audio, retry transcription, or paste the conversation below.");
 }
 if (parsed.problem === "too_long") {
  throw new Error("The transcript exceeds 50,000 characters. Paste the reviewed conversation below or use a shorter recording.");
 }
 c.transcript = parsed.transcript;
 c.detectedLanguage = parsed.language;
 if (JSON.stringify(result).length <= 250000) {
  c.sttRaw = result;
 } else {
  c.sttRaw = { transcript: c.transcript, language_code: c.detectedLanguage };
  if (JSON.stringify(parsed.segments).length <= 250000) c.audioSegments = parsed.segments;
 }
 c.status = "transcript_ready";
 delete c.error;
}
function initial(id:string,title:string,kind:LabCase["kind"]):LabCase{
 const at=new Date().toISOString();return {id,title:title.slice(0,90)||"Untitled consultation",kind,status:"uploaded",revision:0,created:at,updated:at,transcript:"",original:[],reviewed:[],reference:{},referenceVerified:false,referenceReviewer:"",routes:{},notes:[],reviewer:"",reviewAcknowledged:false,activity:[],timings:{},consent:{at,version:"upload-process-archive-v1"}};
}
export async function GET(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:"Sign in to access your private archive."},401);
 try{
  const url=new URL(request.url);const id=url.searchParams.get("id");
  if(!id){const list=await database().prepare("SELECT id,title,kind,status,revision,created,updated,summary FROM consultations WHERE owner=? ORDER BY updated DESC LIMIT 200").bind(user.userId).all();return json({cases:list.results.map((r:any)=>({...r,summary:JSON.parse(r.summary)})),limit:200});}
  const c=await ownedCase(validId(id),user.userId);const asset=url.searchParams.get("asset");
  if (asset) {
   if (!["source", "preview", "download"].includes(asset)) throw new Error("Unknown asset.");
   if (asset === "download" && !c.listened) throw new Error("Confirm listening before final audio download.");
   const key = asset === "source" ? c.sourceKey : c.audioKey;
   if (!key) throw new Error("This file is not available.");
   if (asset === "source") {
    const response = await readSourceAudio(bucket(), key, request.headers.get("Range"));
    if (!response) throw new Error("File not found.");
    return response;
   }
   const file = await bucket().get(key);
   if (!file) throw new Error("File not found.");
   const headers = {
    "Content-Type": "audio/wav",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    ...(asset === "download" ? { "Content-Disposition": `attachment; filename="reviewed-${c.id}.wav"` } : {}),
   };
   return new Response(file.body, { headers });
  }
  const history=await database().prepare("SELECT id,revision,type,data,created FROM review_events WHERE case_id=? AND owner=? ORDER BY revision DESC LIMIT 100").bind(c.id,user.userId).all();
  const out={case:c,evaluation:evaluate(c),history:history.results.map((r:any)=>({...r,data:JSON.parse(r.data)})),historyLimit:100};
  if(url.searchParams.has("export"))return new Response(JSON.stringify(out,null,2),{headers:{"Content-Type":"application/json","Content-Disposition":`attachment; filename="evaluation-${c.id}.json"`,"Cache-Control":"private, no-store"}});
  return json(out);
 }catch(e){return failure(e);}
}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:"Sign in before uploading or saving records."},401);
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return json({error:"Cross-site writes are blocked."},403);
 const owner=user.userId;let c:LabCase|undefined;let expected:number|undefined;let providerAction=false;
 try{
  if(Number(request.headers.get("content-length")??0)>32*1024*1024)throw new Error("Upload exceeds 30 MB.");
  if(request.headers.get("content-type")?.startsWith("multipart/form-data")){
   const f=await request.formData();if(f.get("consent")!=="yes")throw new Error("Permission for upload, external processing and private archiving is required.");
   const id=validId(String(f.get("id")??""));
   const existing=await database().prepare("SELECT id FROM consultations WHERE id=? AND owner=?").bind(id,owner).first();if(existing)return json({case:await ownedCase(id,owner)});
   const language=f.get("language");if(language!==null&&!isVoiceLanguage(language))throw new Error("Choose a supported voice language.");
   const file=f.get("file");const isFile=file instanceof File&&file.size>0;
   const kind=isFile?(f.get("kind")==="human_audio"?"human_audio":"roleplay_audio"):"pasted";
   c=initial(id,String(f.get("title")??"Consultation"),kind);
   if(isVoiceLanguage(language))c.language=language;
   if(isFile){c.audioInfo=wavInfo(await file.slice(0,65536).arrayBuffer(),file.size);c.sourceKey=owner+"/"+id+"/source-"+crypto.randomUUID()+".wav";await bucket().put(c.sourceKey,file.stream(),{httpMetadata:{contentType:"audio/wav"}});}
   else{c.transcript=String(f.get("transcript")??"").trim();if(!c.transcript||c.transcript.length>TRANSCRIPT_LIMIT)throw new Error("Paste a conversation of 1–50,000 characters.");c.status="transcript_ready";}
   try{await createCase(c,owner);}catch(e){if(c.sourceKey)await bucket().delete(c.sourceKey);throw e;}
   return json({case:c});
  }
  const raw=await request.text();if(raw.length>600000)throw new Error("Request exceeds the review limit.");const b=JSON.parse(raw);
  if(b.action==="test_key"){const api=new Sarvam(request.headers.get("x-sarvam-key")??"");return json(await api.test());}
  if(b.action==="demo"){
   const id=validId(String(b.id??""));const exists=await database().prepare("SELECT id FROM consultations WHERE id=? AND owner=?").bind(id,owner).first();if(exists)return json({case:await ownedCase(id,owner)});
   c=initial(id,"Fictional workflow · "+new Date().toLocaleTimeString("en-IN",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit"}),"fictional");
   const variants=[{form:"tablet",name:"DemoMed Alpha",strength:"10 mg",dose:"1 tablet",frequency:"once daily",duration:"3 days"},{form:"syrup",name:"DemoMed Beta",strength:null,dose:"5 mL",frequency:"twice daily",duration:"5 days"},{form:"cream",name:"DemoMed Gamma",strength:"1%",dose:"a thin layer",frequency:"once daily",duration:"7 days"}];
   const v=variants[Math.abs(Number(b.variant)||0)%variants.length];const med={...emptyMedicine("m1"),...v,drug_name:v.name,action:"prescribe",time_of_day:null,meal_timing:null};delete (med as any).name;
   c.transcript=`Doctor: Use ${v.name} ${v.strength??""} ${v.form}. Amount per use is ${v.dose}, ${v.frequency}, for ${v.duration}. Patient: Thank you.`;
   med.evidence_quote=c.transcript.split(" Patient:")[0];c.original=[med];c.reviewed=structuredClone(c.original);c.status="draft";c.draftSource="prepared";c.notes=["Fictional prepared workflow. No Sarvam call was made. Not model accuracy or medical advice."];
   await createCase(c,owner);return json({case:c});
  }
  c=await ownedCase(validId(String(b.id??"")),owner);requireFreshRevision(c.revision,b.revision);expected=c.revision;
  if(c.status==="deletion_pending"&&b.action!=="delete")throw new Error("Deletion is pending. Finish deleting this case.");
  if(b.action==="delete"){
   if(c.status!=="deletion_pending"){c.status="deletion_pending";await saveCase(c,owner,expected,"deletion_requested",{});expected=c.revision;}
   let cursor:string|undefined;do{const page=await bucket().list({prefix:owner+"/"+c.id+"/",cursor});if(page.objects.length)await bucket().delete(page.objects.map(x=>x.key));cursor=page.truncated?page.cursor:undefined;}while(cursor);
   await database().batch([database().prepare("DELETE FROM review_events WHERE owner=? AND case_id=?").bind(owner,c.id),database().prepare("DELETE FROM consultations WHERE owner=? AND id=? AND revision=?").bind(owner,c.id,expected)]);return json({deleted:true});
  }
  if(b.action==="review"){
   const meds=validateMedicines(b.reviewed,true);if(c.original.some(m=>!meds.some(n=>n.id===m.id)))throw new Error("Keep original medicine rows for evaluation; mark non-plan medicines as discussed.");
   const routes:LabCase["routes"]={};for(const [id,v] of Object.entries(b.routes??{}) as [string,any][]){const m=meds.find(x=>x.id===id);if(!m||typeof v.value!=="string"||v.value.length>200||typeof v.confirmed!=="boolean")throw new Error("Invalid route confirmation.");const s=routeSuggestion(m);if(v.basis==="form_suggestion"&&v.value!==s.value)throw new Error("The route suggestion changed; review it again.");routes[id]={value:v.value,confirmed:v.confirmed,basis:v.basis==="form_suggestion"?"form_suggestion":"reviewer_confirmed"};}
   const before={medicines:c.reviewed,routes:c.routes};
   const reviewer=String(b.reviewer??"").trim().slice(0,120);const reviewAcknowledged=b.reviewAcknowledged===true;
   const reviewerChanged=reviewer!==c.reviewer||reviewAcknowledged!==c.reviewAcknowledged;
   c.reviewed=meds;c.routes=routes;c.reviewer=reviewer;c.reviewAcknowledged=reviewAcknowledged;
   const planChanged=JSON.stringify(before)!==JSON.stringify({medicines:c.reviewed,routes:c.routes});
   if(planChanged||reviewerChanged)invalidate(c);
   if(planChanged)c.referenceVerified=false;
   await saveCase(c,owner,expected,"review_saved",{before,after:{medicines:c.reviewed,routes:c.routes},reviewer:c.reviewer});return json({case:c});
  }
  if(b.action==="reference"){
   const refs:Reference={};for(const [id,r] of Object.entries(b.reference??{}) as [string,any][]){if(!c.reviewed.some(m=>m.id===id)||!["unreviewed","in_plan","not_in_plan"].includes(r.presence))throw new Error("Invalid reference medicine.");refs[id]={presence:r.presence,fields:{}};for(const f of FIELDS){const a=r.fields?.[f];if(!a)continue;if(!["unreviewed","stated","not_mentioned","unclear"].includes(a.state))throw new Error("Invalid source annotation.");const value=typeof a.value==="string"?a.value.trim().slice(0,600):null;if(a.state==="stated"&&!value)throw new Error("A stated reference field needs its source value.");refs[id].fields[f]={state:a.state,value:a.state==="stated"?value:null};}}
   const reviewer=String(b.referenceReviewer??"").trim().slice(0,120);if(b.referenceVerified&&!reviewer)throw new Error("Enter who checked the reference against the source.");
   c.reference=refs;c.referenceVerified=b.referenceVerified===true;c.referenceReviewer=reviewer;
   if(c.approval&&approvalProblems(c).length)invalidate(c);
   await saveCase(c,owner,expected,"reference_saved",{reference:refs,verified:c.referenceVerified,reviewer,evaluation:evaluate(c)});return json({case:c,evaluation:evaluate(c)});
  }
  if(b.action==="transcript"){
   if(c.draftSource==="sarvam")throw new Error("This case already has an immutable AI baseline. Create a new pasted case to extract a corrected transcript.");
   const text=typeof b.transcript==="string"?b.transcript.trim():"";if(!text||text.length>TRANSCRIPT_LIMIT)throw new Error("Use a transcript of 1–50,000 characters.");c.transcriptReview=text;invalidate(c);c.status="transcript_ready";delete c.error;await saveCase(c,owner,expected,"transcript_reviewed",{original:c.transcript,reviewed:text});return json({case:c});
  }
  if(b.action==="approve"){const problems=approvalProblems(c);if(problems.length)throw new Error(problems.join(" "));c.approval={at:new Date().toISOString(),hash:await approvalHash(c),reviewer:c.reviewer,version:2};c.status="approved";await saveCase(c,owner,expected,"plan_approved",{approval:c.approval,medicines:c.reviewed,routes:c.routes});return json({case:c});}
  if(b.action==="ack_script"){
   if(!await hasApprovedPlan(c)||!c.lines?.length||c.lines.some(l=>!l.back?.trim())||b.acknowledged!==true||!String(b.reviewer??"").trim())throw new Error("Complete back-translation, bilingual review and reviewer name first.");
   c.scriptReviewed=true;c.status="script_reviewed";await saveCase(c,owner,expected,"script_approved",{reviewer:String(b.reviewer).slice(0,120),lines:c.lines,warnings:c.scriptWarnings});return json({case:c});
  }
  if(b.action==="listened"){if(!c.audioKey||!c.scriptReviewed||b.listened!==true)throw new Error("Generate and listen to the current audio first.");c.listened=true;c.status="audio_reviewed";await saveCase(c,owner,expected,"audio_listening_confirmed",{approval:c.approval,audioKey:c.audioKey});return json({case:c});}
  const api=new Sarvam(request.headers.get("x-sarvam-key")??"",c);const t=Date.now();providerAction=true;
  if(b.action==="transcribe"){
   if(c.transcriptReview||c.transcript||!c.sourceKey||!c.audioInfo)throw new Error("This case does not need a new transcription.");const file=await bucket().get(c.sourceKey);if(!file)throw new Error("Source recording not found.");const result=await api.startAudio(new Blob([await file.arrayBuffer()],{type:"audio/wav"}),c.audioInfo);
   if("result" in result)verifyTranscript(result.result,c);else{c.jobId=result.jobId;c.status="transcribing";}c.timings!.stt_start_ms??=Date.now();
  }else if(b.action==="poll"){
   if(!c.jobId||c.transcriptReview||c.transcript)throw new Error("No pending transcription job.");const result=await api.poll(c.jobId);if(result.pending)return json({case:c,pending:true});verifyTranscript(result.result,c);c.timings!.stt_ms=Date.now()-(c.timings!.stt_start_ms??t);
  }else if(b.action==="extract"){
   if(c.draftSource==="sarvam")throw new Error("The original AI draft is retained. Start a new case for another extraction.");const text=c.transcriptReview??c.transcript;const draft=await api.extract(text);invalidate(c);c.original=draft.medications;c.reviewed=draft.medications.map(prepareEnglishReview);c.reference={};c.referenceVerified=false;c.routes={};c.draftSource="sarvam";c.notes=draft.notes;c.status="draft";delete c.error;c.draftRuns=[{at:new Date().toISOString(),transcript:text,medicines:c.original}];c.timings!.extraction_ms=Date.now()-t;
  }else if(b.action==="translate"){
   const approval = c.approval;
   if(!approval||!await hasApprovedPlan(c))throw new Error("Approve the current medication version first.");
   const language = b.language ?? c.language;
   if(!isVoiceLanguage(language))throw new Error("Select the patient's preferred language for the voice instructions.");
   const lines = englishLines(c);
   if(!lines.length)throw new Error("No final-plan medicines to explain.");
   for(const line of lines)line.native=await api.translate(line.english,"en-IN",language,"classic-colloquial");
   // Preserve earlier approvals while separating the voice language from the approved medication plan.
   if(approval.version!==2)c.approval={...approval,hash:await approvalHash(c),version:2};
   invalidateVoice(c);
   c.language=language;
   c.lines=lines;
   c.status="script_draft";
  }else if(b.action==="check_script"){
   const language = c.language;
   if(!await hasApprovedPlan(c)||!c.lines||!isVoiceLanguage(language))throw new Error("Generate a script from the approved plan first.");
   const edits: { id?: unknown; native?: unknown }[] = Array.isArray(b.lines) ? b.lines : [];
   const lines = c.lines.map(line => {
    const text = edits.find(entry => entry?.id === line.id)?.native;
    if (typeof text !== "string" || !text.trim() || text.length > 1000) throw new Error("Each instruction needs 1–1,000 characters.");
    return { ...line, native: text.trim() };
   });
   const warnings: string[] = [];
   for (const line of lines) {
    line.back = await api.translate(line.native, language, "en-IN");
    const medicine = c.reviewed.find(entry => entry.id === line.id);
    const label = medicine?.drug_name ?? "this instruction";
    const numbers = numericTokens(line.english);
    if (numbers !== numericTokens(line.native) || numbers !== numericTokens(line.back)) {
     warnings.push("Check the numbers, units and amounts for " + label + ".");
    }
    if (medicine?.action !== "stop" && !matchesMealInstruction(medicine?.meal_timing, line.back)) {
     warnings.push("Check the timing relative to meals for " + label + ".");
    }
   }
   invalidateVoice(c);
   c.lines = lines;
   c.scriptWarnings = warnings;
   c.status = "script_checked";
  }else if(b.action==="audio"){
   if(!await hasApprovedPlan(c)||!c.scriptReviewed||!c.lines?.length||!isVoiceLanguage(c.language))throw new Error("Approve the current plan and complete script review first.");delete c.audioKey;c.listened=false;const bytes=await api.tts(c.lines.map(l=>l.native).join("\n"),c.language);c.audioKey=owner+"/"+c.id+"/preview-"+crypto.randomUUID()+".wav";await bucket().put(c.audioKey,bytes,{httpMetadata:{contentType:"audio/wav"}});c.status="audio_preview";
  }else{providerAction=false;throw new Error("Unknown operation.");}
  c.timings![b.action+"_request_ms"]=Date.now()-t;delete c.error;
  await saveCase(c,owner,expected,b.action,{status:c.status,original:b.action==="extract"?c.original:undefined,notes:c.notes,lines:["translate","check_script"].includes(b.action)?c.lines:undefined,audioKey:b.action==="audio"?c.audioKey:undefined,activity:c.activity?.slice(-8)});return json({case:c});
 } catch (e) {
  if (e instanceof CaseRevisionConflict) return failure(e, !providerAction);
  if (providerAction && c && expected !== undefined) {
   const error = message(e);
   c.error = error;
   c.status = "error";
   try {
    await saveCase(c, owner, expected, "processing_failed", { message: error });
    return json({ error, case: c }, 400);
   } catch (saveError) {
    if (saveError instanceof CaseRevisionConflict) return failure(saveError);
   }
  }
  return failure(e);
 }
}
