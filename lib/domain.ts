export const VERSION = "0.3.2-web";
export const FIELDS = ["drug_name","action","form","strength","dose","route","frequency","time_of_day","meal_timing","duration"] as const;
export type Field = typeof FIELDS[number];
export const LABELS: Record<Field,string> = {drug_name:"Medicine",action:"Action",form:"Dosage form",strength:"Strength",dose:"Amount per dose",route:"Route",frequency:"Frequency",time_of_day:"Time of day",meal_timing:"Food timing",duration:"Duration"};
export const ACTIONS = ["prescribe","continue","stop","discussed","unclear"];
export const MEALS = ["before_food","after_food","with_food","empty_stomach","no_food_instruction","not_applicable"];
export type Medicine = Record<Field,string|null> & {id:string; evidence_quote:string|null; speaker:string|null; review_reason:string|null};
export type Annotation = {state:"unreviewed"|"stated"|"not_mentioned"|"unclear"; value:string|null};
export type Reference = Record<string,{presence:"unreviewed"|"in_plan"|"not_in_plan"; fields:Partial<Record<Field,Annotation>>}>;
export type RouteDecision = {value:string; confirmed:boolean; basis:"form_suggestion"|"reviewer_confirmed"};
export type LabCase = {
 id:string;title:string;kind:"human_audio"|"roleplay_audio"|"pasted"|"fictional";status:string;revision:number;created:string;updated:string;
 language:"kn-IN"|"hi-IN"|"en-IN"; transcript:string; transcriptReview?:string; detectedLanguage?:string;
 original:Medicine[]; reviewed:Medicine[]; reference:Reference; referenceVerified:boolean; referenceReviewer:string;
 draftSource?:"prepared"|"sarvam";
 localOnly?:boolean;
 routes:Record<string,RouteDecision>; notes:string[]; reviewer:string; reviewAcknowledged:boolean;
 sourceKey?:string; audioInfo?:{seconds:number;rate:number;channels:number}; jobId?:string; sttRaw?:unknown;
 draftRuns?:{at:string;transcript:string;medicines:Medicine[]}[];
 approval?:{at:string;hash:string;reviewer:string}; lines?:{id:string;english:string;native:string;back?:string}[];
 scriptReviewed?:boolean; scriptWarnings?:string[]; audioKey?:string; listened?:boolean;
 error?:string; timings?:Record<string,number>; consent:{at:string;version:string};
 activity?:{service:string;status:string;at:string;milliseconds:number;finish?:string;tokens?:number}[];
};
export type EvalCell = {id:string;field:Field;original:string|null;expected:string|null;reviewed:string|null;status:string;changed:boolean};
export function normal(value:unknown) { return String(value??"").normalize("NFKC").trim().toLowerCase().replace(/\s+/g," "); }
export function emptyMedicine(id:string):Medicine {return Object.fromEntries([...FIELDS,"evidence_quote","speaker","review_reason"].map(k=>[k,k==="action"?"unclear":null]).concat([["id",id]])) as Medicine;}
export function validateMedicines(input:unknown,withIds=false):Medicine[] {
 if(!Array.isArray(input)||input.length>12) throw new Error("Use at most 12 medicine records.");
 const seen=new Set<string>();
 return input.map((raw,i)=>{
  if(!raw||typeof raw!=="object")throw new Error("Invalid medicine record.");
  if(Object.keys(raw).length!==FIELDS.length+3+(withIds?1:0))throw new Error("Unexpected medicine fields.");
  const m=emptyMedicine(withIds?String(raw.id??""):"m"+(i+1));
  if(!/^[a-zA-Z0-9-]{1,80}$/.test(m.id)||seen.has(m.id))throw new Error("Medicine identities must be unique and valid.");seen.add(m.id);
  for(const f of [...FIELDS,"evidence_quote","speaker","review_reason"] as const){
   if(!(f in raw)) throw new Error("Incomplete medicine structure: "+f);
   if(raw[f]!==null&&typeof raw[f]!=="string")throw new Error("Medicine values must be text or blank.");
   if(String(raw[f]??"").length>600)throw new Error("A medicine field is too long.");
   m[f]=raw[f]?.trim()||null;
  }
  if(!ACTIONS.includes(m.action??""))throw new Error("Choose a valid medication action.");
  if(m.meal_timing&&!MEALS.includes(m.meal_timing))throw new Error("Choose a valid food timing.");
  return m;
 });
}
export function routeSuggestion(m:Medicine) {
 if(m.route)return {value:m.route,source:"stated" as const,reason:"Present in the extracted route; check the source recording."};
 const form=normal(m.form);
 if(/sublingual|buccal|vaginal|rectal|ophthalmic|ocular|otic|ear|nasal|inhal|inject|transdermal|dispersible|effervescent|chewable/.test(form))
  return {value:null,source:"unknown" as const,reason:"Specialised formulation: confirm the exact route with a qualified reviewer."};
 if(/^(tablet|tablets|tab|capsule|capsules|cap|syrup|oral solution|oral suspension)$/.test(form))
  return {value:"oral (by mouth)",source:"suggested" as const,reason:"Suggested from dosage form, not spoken evidence. Confirm before use; tablets can have other routes."};
 if(/^(cream|ointment|gel|lotion|topical cream|topical ointment)$/.test(form))
  return {value:"topical (on skin)",source:"suggested" as const,reason:"Suggested from dosage form, not spoken evidence. Confirm the site; some creams are vaginal or for other sites."};
 return {value:null,source:"unknown" as const,reason:"No conservative route suggestion. Confirm from the source or an authorised reviewer."};
}
export function effectiveRoute(c:LabCase,m:Medicine){return m.route|| (c.routes[m.id]?.confirmed?c.routes[m.id].value:null);}
export function invalidate(c:LabCase){delete c.approval;delete c.lines;delete c.scriptWarnings;delete c.audioKey;c.scriptReviewed=false;c.listened=false;c.status=c.original.length?"draft":c.status;}
export function approvalProblems(c:LabCase){
 const p:string[]=[];
 if(!c.reviewed.length)p.push("No medicine records to approve.");
 for(const [i,m] of c.reviewed.entries()){
  const label=`Medicine ${i+1}`;
  if(!m.drug_name)p.push(label+": medicine name is missing.");
  if(m.action==="unclear")p.push(label+": clarify the action.");
  if(c.referenceVerified){
   const ref=c.reference[m.id];
   if(ref?.presence==="not_in_plan"&&["prescribe","continue","stop"].includes(m.action??""))p.push(label+": the verified reference excludes this medicine from the final plan.");
   if(ref?.presence!=="not_in_plan")for(const f of FIELDS){const a=ref?.fields[f];
    if(a?.state==="stated"&&normal(m[f])!==normal(a.value))p.push(label+": "+LABELS[f]+" disagrees with the verified reference.");
    if(a?.state==="not_mentioned"&&m[f])p.push(label+": "+LABELS[f]+" is not supported by the verified source. Keep inferred route decisions separate.");
   }
  }
  if(["prescribe","continue"].includes(m.action??"")){
   for(const f of ["dose","frequency","duration"] as Field[])if(!m[f])p.push(label+": confirm "+LABELS[f].toLowerCase()+".");
   if(!effectiveRoute(c,m))p.push(label+": route needs confirmation; suggestions are not automatically accepted.");
  }
 }
 if(!c.reviewer.trim()||!c.reviewAcknowledged)p.push("Record the reviewer's name and source-review acknowledgement.");
 return p;
}
export function evaluate(c:LabCase){
 const cells:EvalCell[]=[];let missed=0,extra=0,medicinesChecked=0;
 if(!c.referenceVerified)return {cells,checked:0,correct:0,incorrect:0,correctlyBlank:0,unsupported:0,missed,extra,medicinesChecked,fullyAnnotated:false};
 for(const med of c.reviewed){
  const ref=c.reference[med.id];const original=c.original.find(m=>m.id===med.id);
  if(ref?.presence==="not_in_plan"){if(original&&["prescribe","continue","stop"].includes(original.action??""))extra++;continue;}
  if(ref?.presence==="in_plan"){medicinesChecked++;if(!original)missed++;}
  for(const f of FIELDS){
   const a=ref?.fields[f];let status="unreviewed";let expected:string|null=null;
   if(a?.state==="unclear")status="unclear";
   if(a?.state==="stated"&&a.value?.trim()){
    expected=a.value.trim();status=!original?.[f]?"missed":normal(original[f])===normal(expected)?"correct":"incorrect";
   }else if(a?.state==="not_mentioned")status=original?.[f]?"unsupported":"correctly_blank";
   cells.push({id:med.id,field:f,original:original?.[f]??null,expected,reviewed:med[f],status,changed:normal(original?.[f])!==normal(med[f])});
  }
 }
 const checked=cells.filter(x=>!["unreviewed","unclear"].includes(x.status)).length;
 const count=(s:string)=>cells.filter(x=>x.status===s).length;
 const allPresence=c.reviewed.every(m=>c.reference[m.id]?.presence&&c.reference[m.id].presence!=="unreviewed");
 return {cells,checked,correct:count("correct"),incorrect:count("incorrect")+count("missed"),correctlyBlank:count("correctly_blank"),unsupported:count("unsupported"),missed,extra,medicinesChecked,
 fullyAnnotated:allPresence&&cells.every(x=>!["unreviewed","unclear"].includes(x.status))&&checked>0};
}
export function englishLines(c:LabCase){
 const meal:Record<string,string>={before_food:"Before food.",after_food:"After food.",with_food:"With food.",empty_stomach:"On an empty stomach.",no_food_instruction:"No food instruction was specified.",not_applicable:""};
 return c.reviewed.filter(m=>["prescribe","continue","stop"].includes(m.action??"")).map(m=>({id:m.id,english:m.action==="stop"?`Stop ${m.drug_name}.`:[m.action==="continue"?"Continue":"Take",m.drug_name,m.form,m.strength,m.dose?`Amount per dose: ${m.dose}.`:null,`Route: ${effectiveRoute(c,m)}.`,m.frequency?`Frequency: ${m.frequency}.`:null,m.time_of_day?`Time: ${m.time_of_day}.`:null,m.duration?`Duration: ${m.duration}.`:null,m.meal_timing?meal[m.meal_timing]:null].filter(Boolean).join(" "),native:""}));
}
export function requireFreshRevision(actual:number,expected:unknown){if(actual!==expected)throw new Error("CONFLICT: This case changed in another tab. Reopen it before saving.");}
export function requireOwned(owner:string,user:string){if(owner!==user)throw new Error("NOT_FOUND");}
export function isTrustedFileURL(value:string){try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&(/\.blob\.core\.windows\.net$/.test(u.hostname)||/\.amazonaws\.com$/.test(u.hostname)||u.hostname==="storage.googleapis.com"||/\.sarvam\.ai$/.test(u.hostname));}catch{return false;}}
export function numericTokens(s:string){return s.normalize("NFKC").replace(/[०-९]/g,c=>String(c.charCodeAt(0)-0x966)).replace(/[೦-೯]/g,c=>String(c.charCodeAt(0)-0xce6)).match(/\d+(?:\.\d+)?/g)?.sort().join("|")??"";}
export function wavInfo(buffer:ArrayBuffer,total:number){
 if(total>30*1024*1024||total<44)throw new Error("Use a PCM WAV under 30 MB.");
 const v=new DataView(buffer);const str=(o:number,n:number)=>String.fromCharCode(...new Uint8Array(buffer,o,n));
 if(str(0,4)!=="RIFF"||str(8,4)!=="WAVE")throw new Error("This is not a WAV file. Renaming MP3 does not convert it.");
 let rate=0,channels=0,bytesPerSecond=0,format=0,bits=0,size=0;
 for(let p=12;p+8<=buffer.byteLength;){const n=v.getUint32(p+4,true);const name=str(p,4);
  if(name==="fmt "&&p+24<=buffer.byteLength){format=v.getUint16(p+8,true);channels=v.getUint16(p+10,true);rate=v.getUint32(p+12,true);bytesPerSecond=v.getUint32(p+16,true);bits=v.getUint16(p+22,true);}
  if(name==="data"){size=n;if(p+8+n>total)throw new Error("WAV data is truncated.");break;}p+=8+n+(n%2);
 }
 const seconds=size/bytesPerSecond;
 if(format!==1||![1,2].includes(channels)||![8,16,24,32].includes(bits)||![8000,16000,22050,24000,44100,48000].includes(rate)||!(seconds>0&&seconds<=600))throw new Error("Use an uncompressed mono/stereo PCM WAV up to 10 minutes.");
 return {seconds:Math.round(seconds*100)/100,rate,channels};
}
