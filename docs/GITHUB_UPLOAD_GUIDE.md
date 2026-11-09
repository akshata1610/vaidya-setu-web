# Update Vaidya Setu on GitHub

Updated 8 November 2026 for website version **0.3.2-web** and PRD **3.1**.

The website fix is already live at [Vaidya Setu](https://vaidya-setu-review-lab.akshata-urs.chatgpt.site/). Your GitHub repository is a separate snapshot of the project. Upload the new package to bring its code and documents into line with the deployed fix. No new repository or website is needed.

## What changed and why

| File or document | Change | Effect |
| --- | --- | --- |
| lib/sarvam.ts | Worker-compatible file requests and recovery of existing batch jobs | Long recordings can get past the prior upload error; result downloads use the same correction |
| components/lab.tsx | Resume checks the saved job and displays the retained failure | A failed upload is retried instead of only polling an unstarted job |
| app/api/lab/route.ts | Keeps the original transcription start time on resume | Timing metadata remains consistent across retries |
| lib/domain.ts | Version becomes 0.3.2-web | You can identify the new release in the sidebar |
| tests and evidence | 43 software checks plus an actual Workers runtime fixture check | Records both the regression and its recovery; no clinical accuracy claim |
| README and release notes | Scope, fix, verification and limits | Recruiters can understand what is working and what remains untested |
| PRD Word, PDF and Markdown | PRD 3.1 reflects this release and evidence | Product documentation matches the updated implementation |

## Update an existing repository using your browser

1. Download **Vaidya_Setu_Web_0.3.2_GitHub_Ready.zip**. On Windows, right click it and select **Extract All**.
2. Open the extracted **vaidya-setu-web** folder. README.md and package.json should be directly inside it, alongside app, lib, docs, tests and other folders.
3. Sign in to [GitHub](https://github.com/) and open your **existing project repository**. Stay at its top level, where README.md appears. Do not open a new repository just for this fix.
4. Select **Add file → Upload files** above the file list.
5. Drag the **contents inside vaidya-setu-web** into the upload area. Upload the individual files and folders, not the ZIP or an extra enclosing project folder. Matching paths replace the older files in the new commit; the repository's earlier commits remain available.
6. Check the path list before saving. README.md must be at the top level, and lib/sarvam.ts must sit under lib. The list should not begin with an additional vaidya-setu-web/ folder. Do not manually select patient data, API keys, .env, node_modules or .git; browser uploads do not apply .gitignore to files you select.
7. Enter the commit message **Fix transcription recovery and update docs for v0.3.2**. A commit is a saved version of the repository.
8. If GitHub offers a direct commit to your own branch, you may use it. If it asks for a new branch, click **Propose changes**, create the pull request, review its files and merge it into your main branch. Protected repository rules may require this route.
9. On the repository's main page, check README for **0.3.2-web**. Open lib/domain.ts and check the same version. Confirm tests/batch-transcription.test.mjs and docs/RELEASE_NOTES_0.3.2.md are present.
10. Keep the existing **Open the live demo** link and the About section's Website URL: **https://vaidya-setu-review-lab.akshata-urs.chatgpt.site/**. These still point to the same hosted app.
11. Open the repository and its live-demo link in a private browser window. Verify the public README and fictional example are accessible. Real uploads and private archives require ChatGPT sign-in and the visitor's own Sarvam key.

The package is within the browser limit of 100 files per upload and 25 MiB per file. Official [GitHub upload instructions](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository) describe upload and commit options.

If your repository contains only the earlier Python/Streamlit app, this is the newer web implementation. Keep the Python version clearly labelled as a legacy implementation rather than describing its test results as website results. The new README identifies the web entry points. Do not delete unrelated work to upload this package.

## If you have not uploaded anything yet

Create one repository named **vaidya-setu-web**, choose **Public**, and leave generated README and ignore-file options off because the package supplies them. Then follow steps 4 onward above. Public means recruiters can view code and documents without your permission; it does not let them edit your repository. Archive access is restricted to the signed-in owner; two-account acceptance testing remains pending.

## Retry the saved recording on the website

1. Open the live website and press **Ctrl + Shift + R**. Check the sidebar says **0.3.2-web**.
2. Sign in to the same account used for the original upload. Enter your Sarvam key again in **API settings**. Refresh clears the key; it does not delete archived cases. The optional connection test makes a small billable chat request and does not verify every service.
3. Open **Evaluation archive** and choose the failed case. Click **Resume transcription** under Source conversation. The app reuses its saved recording and checks the existing job. An accepted job can retry upload/start; a pending, running or completed job is reused. A terminal failed job can be replaced.
4. Keep the page open while it checks progress. Transcription is followed by medication extraction. If it is still running, reopen the same case and resume; avoid repeatedly creating duplicate consultations.
5. Check the medication table against the recording, save corrections and confirm any suggested route. Use Source & evaluation to mark facts as stated, not mentioned, unclear or unreviewed, and save a source-checked reference.
6. Approval, translation/back translation, bilingual review, speech generation and listening review are later steps. Live Sarvam processing and your actual recording have not been rerun by the author. Downloading WAV does not send a WhatsApp message.

## Video guide

The separate narrated MP4 demonstrates these steps. GitHub and private-archive screens are clearly labelled illustrations. Public website screenshots and the fictional evaluation example were captured from version 0.3.2. No real API key or private patient recording appears, and no live transcription success is claimed.

## What to include

| Included item | What it shows |
| --- | --- |
| README and live link | The problem, product, access model and current limitations |
| app, components, lib, db and migrations | The current hosted implementation |
| PRD in Word, PDF and Markdown | Product decisions, scope, success metrics and acceptance criteria |
| Market research | Dated numerical evidence and source links |
| Tests and sanitized software log | 43 automated checks plus a Workers runtime smoke check with their evidence boundaries |
| Manual acceptance log | Completed anonymous checks and explicit not run entries |
| Setup and build files | How the application is organized and reproduced |

Keep real patient recordings, prescriptions, transcripts, exported case JSON, API keys and authentication tokens out of the repository. Public source means people can inspect and copy it; it does not give them permission to edit your repository or your live website.

## Resume wording

**Vaidya Setu | Product MVP | GitHub | Live demo**

Designed a multilingual recorded consultation review MVP using Sarvam APIs, with medication field evaluation, explicit review controls, route provenance and private correction history. Published a public fictional demo; real recording accuracy and clinical validation remain pending.

Make GitHub link to your repository and Live demo link to the existing website. This package has not been uploaded to your GitHub account automatically. The current hosted source commit is 17d38e5df0e1b7342e430d0cf7e4586a6ffaa3bc.

## Keep later updates clear

The public source is an export of the hosted web implementation, not the earlier Streamlit Python build. Upload the updated docs and web files together. Before claiming a new accuracy result, retain matching source references and original outputs, separate fictional cases and report failed or unscored cases. Deployment of later code changes remains a separate step from committing to GitHub.

Official references: [public repository visibility](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories), [GitHub Pages scope](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
