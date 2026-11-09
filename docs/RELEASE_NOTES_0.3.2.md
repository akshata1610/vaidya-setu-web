# Vaidya Setu version 0.3.2

Released 8 November 2026. Hosted source commit: `17d38e5df0e1b7342e430d0cf7e4586a6ffaa3bc`.

## Problem and resulting behaviour

A 94.76-second uploaded recording stopped before transcription with an unsupported redirect-mode error. Long audio uses Sarvam's batch workflow. Its signed file transfers used `redirect: "error"`, which Cloudflare Workers rejects before sending a request. The chat key test uses a different request path, so it could pass while recording processing failed.

Upload and transcript download now use `redirect: "manual"` and explicitly reject redirect responses. This preserves host validation without automatically following another destination. Failed cases retain their source. Resume checks the archived job: Accepted retries upload/start, Pending/Running/Completed/PartiallyCompleted reuses the existing job, and Failed can create one replacement. The start timestamp is retained. The interface shows the saved failure and explains why the medication table is not ready.

## Verification and limits

- 43 software checks passed with fictional fixtures and mocked provider responses, including a 94.76-second workflow through upload, start, download and medication extraction.
- A separate Miniflare smoke check reproduces the old error using the real Workers Request constructor, then completes saved-job recovery and extraction using fixtures. It contacts no live Sarvam service.
- TypeScript checking and production build passed. Production deployment succeeded; version 0.3.2-web was visible in the live browser.
- The public fictional example was also used to demonstrate a correctly extracted dose and a correctly blank unstated route. Partial-reference labels remained visible. This is prepared data, not a clinical benchmark.
- No live Sarvam key, complete signed-in recovery of the user's recording, two-account isolation acceptance test, clinical benchmark or bilingual audio assessment was performed by the author.

## Product scope

The website assists human review of stated medication instructions. It does not prescribe independently, authenticate a clinician, check clinical dose safety, provide live interpretation, or automatically deliver WhatsApp messages. Route suggestions require confirmation and are excluded from spoken-fact extraction scoring. Source, original draft, corrected values and verified references remain separate.

## Distribution

The current hosted website is already updated. GitHub must be updated separately; uploading this package does not automatically deploy another site or change the current one. This export includes the matching application code and updated project documents. Patient records and credentials are excluded.
