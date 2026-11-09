import test from 'node:test';
import assert from 'node:assert/strict';
import { Sarvam } from '../lib/sarvam.ts';
import { emptyMedicine } from '../lib/domain.ts';

const source = new Blob(['fictional test bytes'], { type: 'audio/wav' });
const upload = 'https://example.blob.core.windows.net/test/consultation.wav?sig=fixture';
const download = 'https://example.blob.core.windows.net/test/0.json?sig=fixture';
const saved = (extra = {}) => ({ jobId: 'saved-job', activity: [], ...extra });
const json = value => Response.json(value);

function completed() {
  return { job_state: 'Completed', failed_files_count: 0, job_details: [{ outputs: [{ file_name: '0.json' }] }] };
}

test('a 95-second recording uploads, starts, downloads and yields a medication draft', async () => {
  const calls = [];
  const c = { activity: [] };
  const transcript = 'Doctor: Use fictional Demo A, one tablet once daily for three days.';
  const { id, ...medicine } = { ...emptyMedicine('m1'), drug_name: 'Demo A', form: 'tablet', action: 'prescribe', dose: '1 tablet', frequency: 'once daily', duration: '3 days', evidence_quote: transcript };
  const api = new Sarvam('fixture-key', c, async (url, options) => {
    calls.push([url, options]);
    const path = new URL(url).pathname;
    if (url === upload) {
      assert.equal(options.redirect, 'manual');
      assert.equal(options.method, 'PUT');
      assert.equal(options.headers['x-ms-blob-type'], 'BlockBlob');
      assert.equal(options.headers['api-subscription-key'], undefined);
      assert.equal(options.body, source);
      return new Response(null, { status: 201 });
    }
    if (url === download) {
      assert.equal(options.redirect, 'manual');
      assert.equal(options.headers, undefined);
      return json({ transcript, language_code: 'en-IN' });
    }
    if (path.endsWith('/upload-files')) return json({ upload_urls: { 'consultation.wav': { file_url: upload } } });
    if (path.endsWith('/download-files')) {
      assert.deepEqual(JSON.parse(options.body), { job_id: 'new-job', files: ['0.json'] });
      return json({ download_urls: { '0.json': { file_url: download } } });
    }
    if (path.endsWith('/status')) return json(completed());
    if (path.endsWith('/start')) return json({ job_state: 'Pending' });
    if (path === '/speech-to-text/job/v1') return json({ job_id: 'new-job' });
    if (path.endsWith('/chat/completions')) return json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ medications: [medicine], review_notes: [] }) } }] });
    throw new Error('Unexpected fixture request');
  });
  assert.deepEqual(await api.startAudio(source, { seconds: 94.76 }), { jobId: 'new-job' });
  assert.equal(c.jobId, 'new-job');
  const text = await api.poll(c.jobId);
  const draft = await api.extract(text.result.transcript);
  assert.equal(draft.medications[0].drug_name, 'Demo A');
  assert.equal(draft.medications[0].dose, '1 tablet');
  assert.equal(calls.length, 8);
});

test('an archived Accepted job retries upload and start without creating a duplicate job', async () => {
  const calls = [];
  const api = new Sarvam('fixture-key', saved(), async (url, options) => {
    calls.push(url);
    if (url.endsWith('/status')) return json({ job_state: 'Accepted' });
    if (url.endsWith('/upload-files')) {
      assert.equal(JSON.parse(options.body).job_id, 'saved-job');
      return json({ upload_urls: { 'consultation.wav': { file_url: upload } } });
    }
    if (url === upload) return new Response(null, { status: 201 });
    if (url.endsWith('/saved-job/start')) return json({ job_state: 'Pending' });
    throw new Error('Must reuse the archived job');
  });
  assert.deepEqual(await api.startAudio(source, { seconds: 95 }), { jobId: 'saved-job' });
  assert.equal(calls.length, 4);
});

for (const state of ['Pending', 'Running', 'Completed', 'PartiallyCompleted']) {
  test(`resuming ${state} checks the saved job without uploading or starting it again`, async () => {
    let count = 0;
    const api = new Sarvam('fixture-key', saved(), async url => {
      count++;
      assert.match(url, /saved-job\/status$/);
      return json({ job_state: state });
    });
    assert.deepEqual(await api.startAudio(source, { seconds: 95 }), { jobId: 'saved-job' });
    assert.equal(count, 1);
  });
}

test('retrying a terminal failed job creates and starts one replacement job', async () => {
  const c = saved();
  let creates = 0;
  const api = new Sarvam('fixture-key', c, async url => {
    if (url.endsWith('/status')) return json({ job_state: 'Failed' });
    if (url.endsWith('/job/v1')) { creates++; return json({ job_id: 'replacement-job' }); }
    if (url.endsWith('/upload-files')) return json({ upload_urls: { 'consultation.wav': { file_url: upload } } });
    if (url === upload) return new Response(null, { status: 201 });
    if (url.endsWith('/replacement-job/start')) return json({});
    throw new Error('Unexpected fixture request');
  });
  await api.startAudio(source, { seconds: 95 });
  assert.equal(c.jobId, 'replacement-job');
  assert.equal(creates, 1);
});

test('a signed upload redirect is rejected without following it or starting a job', async () => {
  const c = { activity: [] };
  const api = new Sarvam('fixture-secret-key', c, async (url, options) => {
    if (url.endsWith('/job/v1')) return json({ job_id: 'retryable-job' });
    if (url.endsWith('/upload-files')) return json({ upload_urls: { 'consultation.wav': { file_url: upload } } });
    assert.equal(url, upload);
    assert.equal(options.redirect, 'manual');
    return new Response(null, { status: 307, headers: { Location: 'https://untrusted.example/collect' } });
  });
  await assert.rejects(() => api.startAudio(source, { seconds: 95 }), e => /recording upload returned a redirect/.test(e.message) && !/fixture-secret-key|sig=/.test(e.message));
  assert.equal(c.jobId, 'retryable-job');
});

test('a transcript download redirect is rejected instead of parsed as a transcript', async () => {
  const api = new Sarvam('fixture-key', undefined, async (url, options) => {
    if (url.endsWith('/status')) return json(completed());
    if (url.endsWith('/download-files')) return json({ download_urls: { '0.json': { file_url: download } } });
    assert.equal(url, download);
    assert.equal(options.redirect, 'manual');
    return new Response(null, { status: 302, headers: { Location: 'https://untrusted.example/result' } });
  });
  await assert.rejects(() => api.poll('saved-job'), /transcript download returned a redirect/);
});

test('an upload HTTP failure retains the job and reports its stage without signed URL or key', async () => {
  const c = { activity: [] };
  const api = new Sarvam('fixture-secret-key', c, async url => {
    if (url.endsWith('/job/v1')) return json({ job_id: 'retryable-job' });
    if (url.endsWith('/upload-files')) return json({ upload_urls: { 'consultation.wav': { file_url: upload } } });
    return new Response('Do not expose this response', { status: 503 });
  });
  await assert.rejects(() => api.startAudio(source, { seconds: 95 }), e => /recording upload: HTTP 503/.test(e.message) && !/fixture-secret-key|sig=|Do not expose/.test(e.message));
  assert.equal(c.jobId, 'retryable-job');
});

test('a short recording keeps the direct STT path', async () => {
  const api = new Sarvam('fixture-key', undefined, async (url, options) => {
    assert.equal(url, 'https://api.sarvam.ai/speech-to-text');
    assert.ok(options.body instanceof FormData);
    return json({ transcript: 'Fictional short recording', language_code: 'en-IN' });
  });
  assert.equal((await api.startAudio(source, { seconds: 20 })).result.transcript, 'Fictional short recording');
});
