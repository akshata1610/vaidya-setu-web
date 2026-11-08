import { emptyMedicine, validateMedicines, invalidate, approvalProblems, evaluate, type LabCase } from "./domain.ts";

// This browser-only preview never reads a private case or makes a provider call.
export function makePublicDemo(variant:number,id:string,at:string):LabCase {
 const options=[{drug_name:"Fictional Alpha",form:"tablet",strength:"10 mg",dose:"1 tablet",frequency:"once daily",duration:"3 days"},{drug_name:"Fictional Beta",form:"syrup",strength:null,dose:"5 mL",frequency:"twice daily",duration:"5 days"},{drug_name:"Fictional Gamma",form:"cream",strength:"1%",dose:"a thin layer",frequency:"once daily",duration:"7 days"}];
 const selected=options[Math.abs(variant)%options.length];
 const med={...emptyMedicine("m1"),...selected,action:"prescribe"};
 const transcript=`Doctor: Use ${med.drug_name} ${med.strength??""} ${med.form}. Amount per use is ${med.dose}, ${med.frequency}, for ${med.duration}. Patient: Thank you.`;
 med.evidence_quote=transcript.split(" Patient:")[0];
 return {id,title:"Public fictional preview",kind:"fictional",status:"draft",revision:0,created:at,updated:at,language:"kn-IN",transcript,original:[med],reviewed:structuredClone([med]),reference:{},referenceVerified:false,referenceReviewer:"",routes:{},notes:["Prepared fictional data. No AI request, recording upload or archive write. Changes remain in this tab and disappear on refresh."],reviewer:"",reviewAcknowledged:false,draftSource:"prepared",localOnly:true,consent:{at,version:"fictional-public-preview"}};
}
export function publicDemoAction(input:LabCase,action:string,payload:Record<string,any>,at:string):LabCase {
 if(!input.localOnly||input.kind!=="fictional")throw new Error("This preview only accepts local fictional cases.");
 const c=structuredClone(input);
 if(action==="review"){
  c.reviewed=validateMedicines(payload.reviewed,true);c.routes=structuredClone(payload.routes??{});c.language=payload.language;c.reviewer=String(payload.reviewer??"");c.reviewAcknowledged=payload.reviewAcknowledged===true;c.referenceVerified=false;invalidate(c);
 }else if(action==="reference"){
  if(payload.referenceVerified&&!String(payload.referenceReviewer??"").trim())throw new Error("Enter who checked the fictional reference.");
  c.reference=structuredClone(payload.reference??{});c.referenceVerified=payload.referenceVerified===true;c.referenceReviewer=String(payload.referenceReviewer??"");
  if(c.approval&&approvalProblems(c).length)invalidate(c);
 }else if(action==="approve"){
  const problems=approvalProblems(c);if(problems.length)throw new Error(problems.join(" "));
  c.approval={at,hash:"local-fictional-simulation",reviewer:c.reviewer};c.status="approved";
 }else if(action==="transcript"){
  c.transcriptReview=String(payload.transcript??"");invalidate(c);
 }else throw new Error("Sign in to use Sarvam, save cases or generate patient audio. The public preview makes no API calls.");
 c.revision++;c.updated=at;return c;
}
