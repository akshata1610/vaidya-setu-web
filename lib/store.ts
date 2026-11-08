import { env } from "cloudflare:workers";
import { VERSION, evaluate, type LabCase } from "./domain";
export function database(){if(!env.DB)throw new Error("Archive database is not configured.");return env.DB;}
export function bucket(){if(!env.BUCKET)throw new Error("Private file storage is not configured.");return env.BUCKET;}
export function summary(c:LabCase){const e=evaluate(c);return {...e,cells:undefined,medicines:c.reviewed.length,draftSource:c.draftSource,referenceVerified:c.referenceVerified,changed:c.reviewed.reduce((n,m)=>n+Object.keys(m).filter(f=>f!=="id"&&JSON.stringify((m as any)[f])!==JSON.stringify((c.original.find(x=>x.id===m.id) as any)?.[f])).length,0)};}
export async function ownedCase(id:string,owner:string){const row=await database().prepare("SELECT body FROM consultations WHERE id = ? AND owner = ?").bind(id,owner).first<{body:string}>();if(!row)throw new Error("NOT_FOUND");return JSON.parse(row.body) as LabCase;}
export async function createCase(c:LabCase,owner:string){const eid=crypto.randomUUID();const d=database();await d.batch([
 d.prepare("INSERT INTO consultations(id,owner,title,kind,status,body,summary,revision,token,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(c.id,owner,c.title,c.kind,c.status,JSON.stringify(c),JSON.stringify(summary(c)),c.revision,eid,c.created,c.updated),
 d.prepare("INSERT INTO review_events(id,case_id,owner,revision,type,data,created) VALUES(?,?,?,?,?,?,?)").bind(eid,c.id,owner,c.revision,"case_created",JSON.stringify({kind:c.kind,consent:c.consent,version:VERSION}),c.created)
 ]);}
export async function saveCase(c:LabCase,owner:string,expected:number,type:string,data:unknown){
 const eid=crypto.randomUUID();c.revision=expected+1;c.updated=new Date().toISOString();
 if(c.activity)c.activity=c.activity.slice(-80);
 const d=database();const result=await d.batch([
 d.prepare("UPDATE consultations SET title=?, status=?, body=?, summary=?, revision=?, token=?, updated=? WHERE id=? AND owner=? AND revision=?").bind(c.title,c.status,JSON.stringify(c),JSON.stringify(summary(c)),c.revision,eid,c.updated,c.id,owner,expected),
 d.prepare("INSERT INTO review_events(id,case_id,owner,revision,type,data,created) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM consultations WHERE id=? AND owner=? AND token=?)").bind(eid,c.id,owner,c.revision,type,JSON.stringify(data),c.updated,c.id,owner,eid)
 ]);
 if(result[0].meta.changes!==1)throw new Error("CONFLICT: This case changed in another tab. Reopen it before saving.");
 return c;
}
