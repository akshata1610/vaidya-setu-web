// Exercises the real Workers Request constructor. Provider replies are fixtures;
// this does not contact Sarvam or establish transcription/clinical accuracy.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const wrangler = require.resolve('wrangler');
const { build } = require(require.resolve('esbuild', { paths: [wrangler] }));
const { Miniflare } = require(require.resolve('miniflare', { paths: [wrangler] }));
const sarvam = fileURLToPath(new URL('../lib/sarvam.ts', import.meta.url));
const domain = fileURLToPath(new URL('../lib/domain.ts', import.meta.url));

const bundled = await build({
  stdin: { contents: `
import { Sarvam } from ${JSON.stringify(sarvam)};
import { emptyMedicine } from ${JSON.stringify(domain)};
export default { async fetch() {
 let reproduced=false;
 try { new Request('https://example.blob.core.windows.net/test', {redirect:'error'}); }
 catch(e) { reproduced=/redirect/.test(e.message); }
 const c={jobId:'saved-job',activity:[]};
 const transfers=[];
 const transcript='Doctor: Use fictional Demo A, one tablet once daily for three days.';
 const {id,...medicine}={...emptyMedicine('m1'),drug_name:'Demo A',action:'prescribe',dose:'1 tablet',frequency:'once daily',duration:'3 days'};
 let started=false;
 const api=new Sarvam('fictional-key',c,async(url,options)=>{
  const request=new Request(url,options);
  const path=new URL(url).pathname;
  const json=value=>Response.json(value);
  if(path==='/test/consultation.wav'){transfers.push(request.redirect);return new Response(null,{status:201});}
  if(path==='/test/0.json'){transfers.push(request.redirect);return json({transcript,language_code:'en-IN'});}
  if(path.endsWith('/status'))return json(started?{job_state:'Completed',failed_files_count:0,job_details:[{outputs:[{file_name:'0.json'}]}]}:{job_state:'Accepted'});
  if(path.endsWith('/upload-files'))return json({upload_urls:{'consultation.wav':{file_url:'https://example.blob.core.windows.net/test/consultation.wav'}}});
  if(path.endsWith('/start')){started=true;return json({});}
  if(path.endsWith('/download-files'))return json({download_urls:{'0.json':{file_url:'https://example.blob.core.windows.net/test/0.json'}}});
  if(path.endsWith('/chat/completions'))return json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({medications:[medicine],review_notes:[]})}}]});
  throw new Error('Unexpected fixture request');
 });
 await api.startAudio(new Blob(['fictional audio bytes'],{type:'audio/wav'}),{seconds:94.76});
 const result=await api.poll(c.jobId);
 const draft=await api.extract(result.result.transcript);
 return Response.json({legacyErrorReproduced:reproduced,transfers,job:c.jobId,medicine:draft.medications[0].drug_name});
}};
`, resolveDir: process.cwd(), sourcefile: 'batch-worker-fixture.ts', loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022', logLevel: 'silent',
});
const runtime = new Miniflare({ modules: true, script: bundled.outputFiles[0].text, compatibilityDate: '2026-05-15' });
try {
  const response = await runtime.dispatchFetch('https://worker-fixture.test/');
  assert.equal(response.status, 200, await response.clone().text());
  const result = await response.json();
  assert.deepEqual(result, { legacyErrorReproduced: true, transfers: ['manual', 'manual'], job: 'saved-job', medicine: 'Demo A' });
  console.log('PASS: actual Workers runtime reproduces the old redirect error and completes saved-job recovery, upload, download and medication extraction with fixture responses.');
} finally {
  await runtime.dispose();
}
