import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database, bucket, createCase, ownedCase, saveCase } from "@/lib/store";
import { VERSION, FIELDS, validateMedicines, requireFreshRevision, routeSuggestion, approvalProblems, invalidate, englishLines, numericTokens, wavInfo, evaluate, emptyMedicine, type LabCase, type Reference } from "@/lib/domain";
import { Sarvam } from "@/lib/sarvam";
export const dynamic="force-dynamic";
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
function message(e:unknown){return e instanceof Error?e.message:"The operation failed. No new output was approved.";}
function failure(e:unknown){const s=message(e);return json({error:s==="NOT_FOUND"?"Case not found.":s},s==="NOT_FOUND"?404:s.startsWith("CONFLICT:")?409:400);}
function validId(id:string){if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw new Error("Invalid case identity.");return id;}
async function hash(c:LabCase){const data=new TextEncoder().encode(JSON.stringify({medicines:c.reviewed,routes:c.routes,language:c.language}));return [...new Uint8Array(await crypto.subtle.digest("SHA-256",data))].map(x=>x.toString(16).padStart(2,"0")).join("");}
function verifyTranscript(result:any,c:LabCase){if(typeof result?.transcript!=="string"||!result.transcript.trim()||result.transcript.length>50000)throw new Error("STT returned an empty or oversized transcript.");c.transcript=result.transcript;c.detectedLanguage=typeof result.language_code==="string"?result.language_code:undefined;c.sttRaw=JSON.stringify(result).length<=250000?result:{transcript:result.transcript,language_code:result.language_code};c.status="transcript_ready";delete c.error;}
function initial(id:string,title:string,kind:LabCase["kind"],language:LabCase["language"]):LabCase{
 const at=new Date().toISOString();return {id,title:title.slice(0,90)||"Untitled consultation",kind,status:"uploaded",revision:0,created:at,updated:at,language,transcript:"",original:[],reviewed:[],reference:{},referenceVerified:false,referenceReviewer:"",routes:{},notes:[],reviewer:"",reviewAcknowledged:false,activity:[],timings:{},consent:{at,version:"upload-process-archive-v1"}};
}
export async function GET(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:"Sign in to access your private archive."},401);
 try{
  const url=new URL(request.url);const id=url.searchParams.get("id");
  if(!id){const list=await database().prepare("SELECT id,title,kind,status,revision,created,updated,summary FROM consultations WHERE owner=? ORDER BY updated DESC LIMIT 200").bind(user.userId).all();return json({cases:list.results.map((r:any)=>({...r,summary:JSON.parse(r.summary)})),limit:200});}
  const c=await ownedCase(validId(id),user.userId);const asset=url.searchParams.get("asset");
  if(asset){if(!["source","preview","download"].includes(asset))throw new Error("Unknown asset.");if(asset==="download"&&!c.listened)throw new Error("Confirm listening before final audio download.");const key=asset==="source"?c.sourceKey:c.audioKey;if(!key)throw new Error("This file is not available.");const file=await bucket().get(key);if(!file)throw new Error("File not found.");return new Response(file.body,{headers:{"Content-Type":"audio/wav","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",...(asset==="download"?{"Content-Disposition":`attachment; filename="reviewed-${c.id}.wav"`}:{})}});}
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
   const language=String(f.get("language"));if(!["kn-IN","hi-IN","en-IN"].includes(language))throw new Error("Choose a supported output language.");
   const file=f.get("file");const isFile=file instanceof File&&file.size>0;
   const kind=isFile?(f.get("kind")==="human_audio"?"human_audio":"roleplay_audio"):"pasted";
   c=initial(id,String(f.get("title")??"Consultation"),kind,language as LabCase["language"]);
   if(isFile){c.audioInfo=wavInfo(await file.slice(0,65536).arrayBuffer(),file.size);c.sourceKey=owner+"/"+id+"/source-"+crypto.randomUUID()+".wav";await bucket().put(c.sourceKey,file.stream(),{httpMetadata:{contentType:"audio/wav"}});}
   else{c.transcript=String(f.get("transcript")??"").trim();if(!c.transcript||c.transcript.length>50000)throw new Error("Paste a conversation of 1–50,000 characters.");c.status="transcript_ready";}
   try{await createCase(c,owner);}catch(e){if(c.sourceKey)await bucket().delete(c.sourceKey);throw e;}
   return json({case:c});
  }
  const raw=await request.text();if(raw.length>600000)throw new Error("Request exceeds the review limit.");const b=JSON.parse(raw);
  if(b.action==="test_key"){const api=new Sarvam(request.headers.get("x-sarvam-key")??"");return json(await api.test());}
  if(b.action==="demo"){
   const id=validId(String(b.id??""));const exists=await database().prepare("SELECT id FROM consultations WHERE id=? AND owner=?").bind(id,owner).first();if(exists)return json({case:await ownedCase(id,owner)});
   c=initial(id,"Fictional workflow · "+new Date().toLocaleTimeString("en-IN",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit"}),"fictional","kn-IN");
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
   if(!["kn-IN","hi-IN","en-IN"].includes(b.language))throw new Error("Choose a supported language.");
   const before={medicines:c.reviewed,routes:c.routes,language:c.language};
   c.reviewed=meds;c.routes=routes;c.language=b.language;c.reviewer=String(b.reviewer??"").trim().slice(0,120);c.reviewAcknowledged=b.reviewAcknowledged===true;
   if(JSON.stringify(before)!==JSON.stringify({medicines:c.reviewed,routes:c.routes,language:c.language})){invalidate(c);c.referenceVerified=false;}
   await saveCase(c,owner,expected,"review_saved",{before,after:{medicines:c.reviewed,routes:c.routes,language:c.language},reviewer:c.reviewer});return json({case:c});
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
   const text=String(b.transcript??"").trim();if(!text||text.length>50000)throw new Error("Use a transcript of 1–50,000 characters.");c.transcriptReview=text;invalidate(c);c.status="transcript_ready";await saveCase(c,owner,expected,"transcript_reviewed",{original:c.transcript,reviewed:text});return json({case:c});
  }
  if(b.action==="approve"){const problems=approvalProblems(c);if(problems.length)throw new Error(problems.join(" "));c.approval={at:new Date().toISOString(),hash:await hash(c),reviewer:c.reviewer};c.status="approved";await saveCase(c,owner,expected,"plan_approved",{approval:c.approval,medicines:c.reviewed,routes:c.routes,language:c.language});return json({case:c});}
  if(b.action==="ack_script"){
   if(!c.approval||c.approval.hash!==await hash(c)||!c.lines?.length||c.lines.some(l=>!l.back?.trim())||b.acknowledged!==true||!String(b.reviewer??"").trim())throw new Error("Complete back-translation, bilingual review and reviewer name first.");
   c.scriptReviewed=true;c.status="script_reviewed";await saveCase(c,owner,expected,"script_approved",{reviewer:String(b.reviewer).slice(0,120),lines:c.lines,warnings:c.scriptWarnings});return json({case:c});
  }
  if(b.action==="listened"){if(!c.audioKey||!c.scriptReviewed||b.listened!==true)throw new Error("Generate and listen to the current audio first.");c.listened=true;c.status="audio_reviewed";await saveCase(c,owner,expected,"audio_listening_confirmed",{approval:c.approval,audioKey:c.audioKey});return json({case:c});}
  const api=new Sarvam(request.headers.get("x-sarvam-key")??"",c);const t=Date.now();providerAction=true;
  if(b.action==="transcribe"){
   if(c.transcript||!c.sourceKey||!c.audioInfo)throw new Error("This case does not need a new transcription.");const file=await bucket().get(c.sourceKey);if(!file)throw new Error("Source recording not found.");const result=await api.startAudio(new Blob([await file.arrayBuffer()],{type:"audio/wav"}),c.audioInfo);
   if(result.result)verifyTranscript(result.result,c);else{c.jobId=result.jobId;c.status="transcribing";}c.timings!.stt_start_ms??=Date.now();
  }else if(b.action==="poll"){
   if(!c.jobId||c.transcript)throw new Error("No pending transcription job.");const result=await api.poll(c.jobId);if(result.pending)return json({case:c,pending:true});verifyTranscript(result.result,c);c.timings!.stt_ms=Date.now()-(c.timings!.stt_start_ms??t);
  }else if(b.action==="extract"){
   if(c.draftSource==="sarvam")throw new Error("The original AI draft is retained. Start a new case for another extraction.");const text=c.transcriptReview??c.transcript;const draft=await api.extract(text);invalidate(c);c.original=draft.medications;c.reviewed=structuredClone(c.original);c.reference={};c.referenceVerified=false;c.routes={};c.draftSource="sarvam";c.notes=draft.notes;c.status="draft";delete c.error;c.draftRuns=[{at:new Date().toISOString(),transcript:text,medicines:c.original}];c.timings!.extraction_ms=Date.now()-t;
  }else if(b.action==="translate"){
   if(!c.approval||c.approval.hash!==await hash(c))throw new Error("Approve the current medication version first.");delete c.audioKey;c.listened=false;c.scriptReviewed=false;delete c.lines;const lines=englishLines(c);if(!lines.length)throw new Error("No final-plan medicines to explain.");for(const l of lines)l.native=await api.translate(l.english,"en-IN",c.language);c.lines=lines;c.status="script_draft";
  }else if(b.action==="check_script"){
   if(!c.approval||c.approval.hash!==await hash(c)||!c.lines)throw new Error("Generate a script from the approved plan first.");delete c.audioKey;c.listened=false;c.scriptReviewed=false;
   for(const l of c.lines){const text=b.lines?.find((x:any)=>x.id===l.id)?.native;if(typeof text!=="string"||!text.trim()||text.length>1000)throw new Error("Each translated instruction needs 1–1,000 characters.");l.native=text.trim();delete l.back;}
   c.scriptWarnings=[];for(const l of c.lines){l.back=await api.translate(l.native,c.language,"en-IN");if(numericTokens(l.english)!==numericTokens(l.native)||numericTokens(l.english)!==numericTokens(l.back))c.scriptWarnings.push("Numbers differ for "+l.id+"; inspect words, units and amounts.");const e=l.english.toLowerCase(),back=l.back.toLowerCase();if((e.includes("before food")&&!back.includes("before"))||(e.includes("after food")&&!back.includes("after")))c.scriptWarnings.push("Food timing needs review for "+l.id+".");}c.status="script_checked";
  }else if(b.action==="audio"){
   if(!c.approval||c.approval.hash!==await hash(c)||!c.scriptReviewed||!c.lines?.length)throw new Error("Approve the current plan and complete script review first.");delete c.audioKey;c.listened=false;const bytes=await api.tts(c.lines.map(l=>l.native).join("\n"),c.language);c.audioKey=owner+"/"+c.id+"/preview-"+crypto.randomUUID()+".wav";await bucket().put(c.audioKey,bytes,{httpMetadata:{contentType:"audio/wav"}});c.status="audio_preview";
  }else{providerAction=false;throw new Error("Unknown operation.");}
  c.timings![b.action+"_request_ms"]=Date.now()-t;delete c.error;
  await saveCase(c,owner,expected,b.action,{status:c.status,original:b.action==="extract"?c.original:undefined,notes:c.notes,lines:["translate","check_script"].includes(b.action)?c.lines:undefined,audioKey:b.action==="audio"?c.audioKey:undefined,activity:c.activity?.slice(-8)});return json({case:c});
 }catch(e){
  const s=message(e);if(providerAction&&c&&expected!==undefined&&!s.startsWith("CONFLICT:")){c.error=s;c.status="error";try{await saveCase(c,owner,expected,"processing_failed",{message:s});}catch{/* Keep the original failure visible without overwriting a concurrent update. */}return json({error:s,case:c},400);}return failure(e);
 }
}
