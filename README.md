# Vaidya Setu Review Lab

**[Open the live demo](https://vaidya-setu-review-lab.akshata-urs.chatgpt.site/)**

A portfolio MVP for reviewing medication instructions from a completed doctor–patient conversation, evaluating the original extraction, and preparing reviewed patient-language audio. Product owner: **Akshata Anil Urs**. Built with AI-assisted coding using Sarvam APIs.

Public visitors can try a prepared fictional example without signing in or entering an API key. Actual uploads, model requests and saved cases require ChatGPT sign-in and the visitor's own Sarvam key. Archives are scoped to their signed-in owner. Public fictional examples run only in browser memory and disappear on refresh.

## Project documents

- [PRD: read on GitHub](docs/PRD.md) · [PDF](docs/Vaidya_Setu_MVP_PRD.pdf) · 
- [India teleconsultation research and primary sources](docs/MARKET_RESEARCH.md)
- [Manual acceptance log: completed and pending checks](docs/WEB_MANUAL_CHECKS.csv)
- [Automated software check log](evidence/WEB_TEST_LOG.txt)

## What the MVP does

- Accepts completed PCM WAV recordings up to 10 minutes / 30 MB, or pasted conversations. Pasted text bypasses transcription. Short recordings use REST STT; longer recordings use batch jobs that can be checked again from the archive.
- Extracts up to 12 medication records with source evidence. Original values remain separate from reviewer corrections.
- Saves reviewed versions, approval acknowledgements and correction events. Editing approved facts invalidates dependent scripts and audio.
- Suggests oral use for plain tablet/capsule/syrup forms and skin use for plain cream/ointment forms, with explicit confirmation. Specialised forms remain unknown. Suggestions never count as spoken evidence.
- Annotates ten fields against a source-checked reference. Distinguishes correct, incorrect or missed, correctly blank, unsupported and unreviewed fields. Prepared examples do not contribute to archive quality counters.
- Supports Kannada, Hindi or English output with script editing, back translation, bilingual review, WAV preview and a listening acknowledgement before download.
- Keeps private source recordings, case revisions and generated audio, with case JSON export and deletion.

## Evidence and boundaries

Version **0.3.1-web**, dated **8 November 2026**. The hosted web edition is separate from the earlier Python/Streamlit app. Its 53 earlier checks are not included in this website's results.

- **32 automated checks passed**, using fictional fixtures and mocked provider responses. TypeScript checking and the production build passed.
- **7 public/anonymous browser checks passed**. The manual log separately marks ten checks not run.
- No real Sarvam key, complete signed-in live-API workflow, two-account isolation test, clinical benchmark or bilingual audio assessment was completed during authoring.

The product assists human review of stated instructions. It does not independently prescribe, verify clinician qualifications, check dose safety or interactions, issue a signed prescription, provide live interpretation, or automatically send WhatsApp messages. Downloadable WAV is not native WhatsApp voice-note delivery. The app does not claim clinical accuracy or patient benefit.

## Privacy and access

The backend stores cases and review events in D1 and source/audio files in private R2. API operations check the authenticated owner; version checks prevent stale-tab overwrites. The latest 200 cases and latest 100 events per case are shown; JSON export uses that same event-page limit. Records remain until case deletion; there is no automatic retention schedule. Deleting website data does not delete Sarvam processing records.

Keys remain in page memory and are cleared by refresh; they are not saved to the archive or browser storage. The optional key test makes a small billable chat request. Obtain recording permission covering external processing and archiving. Keep identifiable records, credentials and private case exports out of GitHub. No production clinical-data certification or India-only data residency guarantee is claimed.

## Source and development

This export matches hosted source commit `09250ce327962abc1e0a2c6b631a91b094145c51`, with this README and the project documents added for GitHub. Unused starter examples and UI components are omitted. The app uses TypeScript, React, the Vinext starter, a Worker backend, D1 and private R2. Application code is in `app`, `components/lab.tsx` and `lib`; migrations are in `drizzle`.

For developers: use Node 22.13+ and the lockfile's pnpm version. Install with `pnpm install --frozen-lockfile`, then use `pnpm run dev` or `pnpm run build`. Full private functionality also requires the hosting environment's ChatGPT identity, D1 and R2 bindings; copying files alone does not provision those services. `.openai/hosting.json` contains non-secret project/binding metadata, not deployment credentials. A fresh provider/account needs its own provisioning and authentication configuration.

Run the software checks after installing dependencies:

```sh
node --experimental-transform-types --test tests/domain.test.mjs tests/public-demo.test.mjs
node node_modules/typescript/bin/tsc --noEmit
```

## GitHub and the live website

The GitHub repository contains source and documentation. Its Live demo link opens the separately hosted product. GitHub Pages is static hosting and cannot run this backend. Committing here does not automatically redeploy the existing website. This package has not been uploaded to your GitHub account automatically.
