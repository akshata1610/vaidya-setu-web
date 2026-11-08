import test from 'node:test';
import assert from 'node:assert/strict';
import {makePublicDemo,publicDemoAction} from '../lib/public-demo.ts';
test('public examples are fictional, local and vary by scenario',()=>{
 const a=makePublicDemo(0,'public-demo-a','2026-11-08T00:00:00Z');
 const b=makePublicDemo(1,'public-demo-b','2026-11-08T00:00:00Z');
 assert.equal(a.localOnly,true);assert.equal(a.kind,'fictional');assert.equal(a.draftSource,'prepared');
 assert.notEqual(a.original[0].form,b.original[0].form);assert.equal(a.sourceKey,undefined);assert.deepEqual(a.reference,{});
});
test('local review never rewrites the original prepared draft',()=>{
 const a=makePublicDemo(0,'public-demo-a','2026-11-08T00:00:00Z');
 const reviewed=structuredClone(a.reviewed);reviewed[0].dose='2 tablets';
 const b=publicDemoAction(a,'review',{reviewed,language:a.language,routes:{},reviewer:'Demo reviewer',reviewAcknowledged:true},'2026-11-08T01:00:00Z');
 assert.equal(b.original[0].dose,'1 tablet');assert.equal(b.reviewed[0].dose,'2 tablets');assert.equal(a.revision,0);assert.equal(b.revision,1);
});
test('public preview rejects provider, archive and deletion actions',()=>{
 const a=makePublicDemo(0,'public-demo-a','2026-11-08T00:00:00Z');
 for(const action of ['extract','audio','translate','delete','test_key'])assert.throws(()=>publicDemoAction(a,action,{},''),/Sign in/);
});
test('local demo actions reject a private archived case',()=>{
 const a=makePublicDemo(0,'public-demo-a','2026-11-08T00:00:00Z');delete a.localOnly;
 assert.throws(()=>publicDemoAction(a,'review',{},''),/only accepts local fictional/);
});
