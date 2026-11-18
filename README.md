# Vaidya Setu Review Lab

**[Open the live demo](https://vaidya-setu-review-lab.akshata-urs.chatgpt.site/)**

A portfolio MVP that turns a completed teleconsultation into a draft prescription for the doctor to review. It also supports an optional voice explanation in the patient’s language and an archive for evaluating the original extraction. **Made by Akshata Anil Urs · Powered by Sarvam**.

Public visitors can try a prepared fictional example without signing in or entering an API key. Actual uploads, model requests and saved cases require ChatGPT sign-in and the visitor's own Sarvam key. Archives are scoped to their signed-in owner. Public fictional examples run only in browser memory and disappear on refresh.

## Use the website

1. Open **How it works** from the setup screen for the current guide, or select **Try demo without signing in** for a fictional consultation.
2. To use your own material, select **Sign in with ChatGPT**, paste your Sarvam key and select **Continue to consultation**.
3. Enter an optional case label using an alias. Upload a consented, deidentified PCM WAV recording, up to 10 minutes and 30 MB, or use **or go to the transcript page** to upload a .txt file or paste the conversation. Confirm permission and select **Generate medication draft**.
4. Check the draft against the source. Replay available timestamps to verify uncertain medicine names. Edit the table in English and complete the fields marked with an asterisk. **Amount per dose** is the quantity taken at one time, **How often** is the frequency and **Timing relative to meals** covers instructions such as after food.
5. Select **Save corrections**, then **Approve & prepare prescription**. If details are missing, the approval message lists what to complete. Use **Print or save PDF** for a prescription the clinician can complete and sign.
6. If needed, open **Voice instructions for the patient** and select Kannada, Hindi or English. Prepare the script, check the back-translation, approve the script and generate the audio. Listen and record the check before downloading the WAV. Reopen a saved script for the same approved plan and language, or select **Load latest saved version** if the plan has changed.
7. Use **Evaluation archive** to reopen a case. **Source & evaluation** compares the original extraction with a separately checked reference. **Saved history** preserves review and processing events.

## Recorded walkthrough

**[Watch the website demo (2:13)](https://github.com/user-attachments/assets/473f65de-0be7-4cb3-be6e-9af1cf3f11d6)** · **[Read the narration and current navigation steps](docs/VIDEO_TRANSCRIPT.md)**

Recorded on **10 November 2026** using a fictional consultation. The video shows the earlier **0.3.3-web** screens. Use the steps above for current button names.

## Project documents

- [PRD: read on GitHub](docs/PRD.md) · [PDF](docs/Vaidya_Setu_MVP_PRD.pdf) · [editable Word document](docs/Vaidya_Setu_MVP_PRD.docx)
- [India teleconsultation research and primary sources](docs/MARKET_RESEARCH.md)
- [Manual acceptance log: completed and pending checks](docs/WEB_MANUAL_CHECKS.csv)
- [Earlier release notes for 0.3.2](docs/RELEASE_NOTES_0.3.2.md)
- [Automated software check log](evidence/WEB_TEST_LOG.txt) · [Workers runtime check](evidence/BATCH_WORKER_SMOKE_LOG.txt)

## Models and recovery

- **Saaras v4** transcribes recordings. Short recordings use the speech-to-text endpoint and longer recordings use resumable batch jobs. The app can use timed phrases when the full transcript is empty. A saved recording can be retried or used with a reviewer-supplied transcript.
- **Sarvam 105B** drafts up to 12 medication records with source evidence and review notes.
- **Mayura v1** translates the conversational voice script and back-translates it for review. **Bulbul v4 Flash** reads the approved script aloud.

## What the MVP does

- Keeps the original draft and reviewer corrections separately and links to recording timestamps when available. Medicine name references help reviewers check uncertain names against the source.
- Saves reviewed versions, approval acknowledgements and correction events. A change to approved medication instructions requires fresh approval. Preparing a script in another language starts a new voice review.
- Suggests oral use for plain tablet/capsule/syrup forms and skin use for plain cream/ointment forms, with explicit confirmation. Specialised forms remain unknown. Suggestions never count as spoken evidence.
- Annotates ten fields against a source-checked reference. Distinguishes correct, incorrect or missed, correctly blank, unsupported and unreviewed fields. Prepared examples do not contribute to archive quality counters.
- Supports Kannada, Hindi or English output with script editing, back translation, bilingual review, WAV preview and a listening acknowledgement before download.
- Keeps private source recordings, case revisions and generated audio, with case JSON export and deletion.
- Keeps the workspace profile above the bottom edge on desktop and visible in the mobile header. Sidebar navigation can scroll on short screens.

## Evidence and boundaries

Version **0.3.4-web**, dated **17 November 2026**. The hosted web edition and the earlier Python/Streamlit app have separate test records.

- **63 automated checks passed** with fictional fixtures and mocked Sarvam responses. TypeScript, the production build and the batch recovery smoke test passed.
- Browser checks covered the public guide and the short desktop and mobile workspace layouts with a fictional account.
- Live end-to-end Sarvam processing, two-account isolation, bilingual audio quality and clinical performance require separate evaluation.

The product assists human review of stated instructions. It does not independently prescribe, verify clinician qualifications, check dose safety or interactions, issue a signed prescription, provide live interpretation, or automatically send WhatsApp messages. Downloadable WAV is not native WhatsApp voice-note delivery. The app does not claim clinical accuracy or patient benefit.

## Privacy and access

The backend stores cases and review events in D1 and source/audio files in private R2. API operations check the authenticated owner; version checks prevent stale-tab overwrites. The latest 200 cases and latest 100 events per case are shown; JSON export uses that same event-page limit. Records remain until case deletion; there is no automatic retention schedule. Deleting website data does not delete Sarvam processing records.

Keys remain in page memory and are cleared by refresh; they are not saved to the archive or browser storage. The optional key test makes a small billable chat request. Obtain recording permission covering external processing and archiving. Keep identifiable records, credentials and private case exports out of GitHub. No production clinical-data certification or India-only data residency guarantee is claimed.

## Source and development

This repository includes the application updates from hosted source commit `f00828d273be363eef312db449b3f5e34c786cda`, along with its project documents and demo video. The app uses TypeScript, React, Vinext, a Worker backend, D1 and private R2. Application code is in `app`, `components` and `lib`. Migrations are in `drizzle`.

For local development, use Node 22.13+ and the lockfile's pnpm version. Install with `pnpm install --frozen-lockfile`, then use `pnpm run dev` or `pnpm run build`. To run the private workflow in another environment, provision ChatGPT identity, D1 and R2 bindings for that deployment.

Run the software checks after installing dependencies:

```sh
node --experimental-transform-types --test tests/*.test.mjs
node tests/batch-worker-smoke.mjs
node node_modules/typescript/bin/tsc --noEmit
```

## GitHub and the live website

The GitHub repository contains source and documentation. Its Live demo link opens the separately hosted product. GitHub Pages is static hosting and cannot run this backend. Committing here does not automatically redeploy the existing website.
