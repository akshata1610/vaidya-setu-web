# Vaidya Setu Hosted MVP Requirements

Product requirements for public demonstration and private consultation review

| Document field | Value |
| --- | --- |
| Product owner | Akshata Anil Urs |
| Updated | 17 November 2026 |
| PRD version | 3.2 |
| Web application | 0.3.4-web |
| Stage | Independent portfolio MVP built with AI assisted coding |
| Live website | [Open Vaidya Setu](https://vaidya-setu-review-lab.akshata-urs.chatgpt.site/) |

Vaidya Setu turns a completed teleconsultation recording or transcript into an editable medication draft. The doctor checks the source and approves the saved review, which prepares a printable prescription for clinician sign-off. An optional voice step turns the approved details into spoken directions in Kannada, Hindi or English. The evaluation archive retains the original draft, corrections and source-verified reference answers.

Visitors can read **How it works** and try a fictional preview from the setup screen. Preview changes stay in the browser tab. Consultation processing and archived files require ChatGPT sign-in and are scoped to the signed-in account. Clinicians remain responsible for confirming, completing and signing the written prescription before sharing it.

## 1 Problem and intended outcome

Patients and caregivers may need understandable, replayable instructions after a consultation. A language or terminology mismatch can complicate that task. A conversation to audio pipeline can introduce additional errors in drug names, strength, amount per dose, frequency, duration and timing.

The MVP aims to reduce manual prescription typing after a teleconsultation. It gives the doctor a draft to check against the conversation and gives patients an optional explanation they can replay in their chosen language. Provider effort and patient comprehension remain outcomes to measure.

## 2 Users and product decisions

| User | Task | Current support |
| --- | --- | --- |
| Recruiter or portfolio visitor | Understand the project without installation | How it works guide and public fictional preview |
| Reviewer or demo operator | Check and correct medication facts | Source playback, transcript, editable records and saved revisions |
| Bilingual reviewer | Check translated and spoken instructions | Script editing, back translation, warnings and audio preview |
| Product evaluator | Distinguish extraction errors from missing source facts | Original draft, field annotations and archived outcomes |
| Patient or caregiver | Replay instructions in a preferred language | Reviewed audio export; patient testing remains outstanding |

These are design roles, not findings from completed interviews. A typed reviewer name does not authenticate a clinician. Sign in establishes an account identity, not professional qualifications.

The product starts with completed recordings or transcripts so reviewers can inspect the source. Strength records the amount in each unit. Amount per dose records the quantity taken at one time. How often records frequency, and Timing relative to meals records directions such as after food. The approved plan supplies the voice script. Reviewers confirm suggested routes separately from the source facts used for scoring.

## 3 Market evidence

### Public teleconsultation delivery

MoHFW reported **50,00,92,730 cumulative eSanjeevani consultations** at the milestone reached on **15 September 2026**. Its 6 October release reported approximately **2.5 to 3 lakh daily consultations**, **2,41,923 registered providers** and availability in **15 languages**. These are programme counts, not unique patients or a paid market estimate. [MoHFW source](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2319427&lang=1&reg=48)

A descriptive study of C DAC programme data reports **more than 163 million consultations during January 2020 to September 2023**, with **over 93%** delivered through the assisted AB HWC model. This historical share should not be presented as the current national or private market mix. [Programme study](https://pmc.ncbi.nlm.nih.gov/articles/PMC12558045/)

**Product implication to validate:** discovery should include the health worker or clinician in an assisted consultation, alongside patients using direct access services. Large utilisation does not establish demand for this particular product.

### Digital access and private platforms

MoSPI's January to March 2025 survey of **34,950 households** reported smartphone possession in **85.5% of households** and internet access within the premises in **86.3%**. Household access does not establish individual ownership, upload skills, WhatsApp use or preference for audio. [MoSPI source](https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=2132330&lang=2&reg=48)

Apollo's Health of the Nation 2026 report attributes **7.99 million digital consultations in calendar 2025** to Apollo 24/7. This is a company reported platform measure, not a national market total. Practo reports **INR 234 crore FY25 revenue** across its business; this cannot be treated as standalone teleconsultation revenue. [Apollo report](https://www.apollohospitals.com/sites/default/files/2026-04/hon-report-apollo--web-2026.pdf) [Practo disclosure](https://blog.practo.com/fy25-recap-a-year-of-profitability-progress-and-purpose/)

**Product implication to validate:** test the workflow with potential provider users and patients. Measure actual review effort, comprehension and cost. No TAM, price, market share, revenue forecast or partnership is assumed. The project package includes a fuller market research appendix with dates, source links and discovery questions.

## 4 Scope and current requirements

| ID | Requirement and implemented behaviour | Boundary |
| --- | --- | --- |
| F01 | Public How it works guide and varied fictional previews | Preview changes remain in the browser tab and disappear on refresh |
| F02 | ChatGPT sign in for uploads, model requests and archives | Each operation must authorize the account; no owner invitation is needed once the site is public |
| F03 | Optional case alias, then WAV upload, .txt upload or pasted transcript | PCM WAV up to 10 minutes and 30 MB. Text skips speech recognition. |
| F04 | Saaras v4 transcribes short recordings through REST and longer recordings through batch jobs | Use timed phrases when the full transcript is blank. Resume interrupted jobs or supply a transcript from the saved case. |
| F05 | Sarvam 105B drafts up to 12 medication records with source evidence | Seek to linked timestamps when available. The reviewer confirms uncertain names and may check medicine reference links. |
| F06 | English review table with action-specific required fields, saved corrections and clinician review | Show missing fields on approval. Changes to the medication plan require fresh approval. |
| F07 | Explicit route plus separate form based suggestions | Suggested routes require confirmation and never become spoken evidence |
| F08 | Source annotations and original draft evaluation | A missing or unverified reference is not a pass |
| F09 | Optional Kannada, Hindi or English spoken script, back-translation and WAV export | Mayura v1 translates when needed. Bulbul v4 Flash reads the approved script. Record the listening check before download. |
| F10 | Private archive, revision events, case JSON export and deletion | Latest 200 cases and 100 events per case are displayed; export uses the same event limit |
| F11 | Printable prescription from the approved plan | The clinician fills in patient details and signs before sharing. |
| F12 | Recovery when a voice action uses an older case revision | Reuse a saved script for the same approved plan and language. Offer the latest saved version for review when the plan changes. |
| F13 | Responsive workspace and accurate How it works guide | Keep the desktop profile in view above the bottom edge. Let navigation scroll on short screens and place the profile in the mobile header. |

The hosted edition does not implement live interpretation, automatic WhatsApp delivery, signed prescriptions, EMR integration, validated FHIR export, interaction or clinical dose checking, a background processing scheduler, FFmpeg OGG conversion or the Python folder benchmark. The earlier Python app remains a separate implementation.

## 5 User journeys and acceptance criteria

### Public visitor

A visitor opens the live site and selects **How it works** or **Try demo without signing in**. They can edit a fictional medication table, confirm a route, approve a fictional prescription and see example spoken wording. The guest demo uses browser-local data. Real uploads, private archives and Sarvam API calls require sign-in.

### Signed in consultation review

1. The operator selects **Sign in with ChatGPT**, enters a Sarvam key and selects **Continue to consultation**. API settings offers an optional small billable chat test.
2. The operator enters an optional alias, uploads a completed WAV or goes to the transcript page for a plain-text file or pasted conversation. They confirm permission for upload, external processing and private archiving.
3. **Generate medication draft** saves the input and runs transcription when needed, then extraction. If speech recognition fails, the saved recording supports a retry or a reviewer-supplied transcript.
4. The reviewer checks the transcript and available recording timestamps, corrects the medication table in English and fills the fields marked with an asterisk for the selected action. **Save corrections** records the reviewer’s acknowledgement and the saved revision.
5. **Approve & prepare prescription** validates the saved review and lists any required gaps. Approval opens the prescription for printing or saving as a PDF. The clinician completes and signs it before sharing.
6. If audio is needed, the reviewer selects Kannada, Hindi or English in **Voice instructions for the patient**. Each medicine’s script combines approved dose, frequency, time, meal instructions and duration when supplied. The reviewer edits, back-translates and approves the script before generating the WAV.
7. The reviewer listens, records the listening check and downloads the WAV. **Evaluation archive** and **Saved history** let the reviewer reopen the case and inspect its earlier revisions.

Changes to medication facts or route decisions clear approval and dependent voice outputs. Selecting another language and preparing a new script starts a fresh voice review while preserving the approved prescription. Editing the script requires a new script review. When a later save conflicts with the voice action, the site can reopen a matching saved script or let the reviewer load the latest case. A verified source reference that contradicts the plan also blocks or revokes approval.

## 6 Route suggestions and provenance

| Source information | Behaviour | Recorded meaning |
| --- | --- | --- |
| Extracted explicit route | Preserve it for source review | Extracted value, not automatically verified |
| Plain tablet, capsule or syrup with no route | Suggest oral by mouth and require confirmation | Form suggestion, separate from the original blank route |
| Plain cream or ointment with no route | Suggest topical on skin and require confirmation | Form suggestion; application site needs review |
| Specialised form, drops, injection or unsupported form | Leave generic suggestion unknown | Qualified clarification is required |

Tablets and creams can have specialised routes. The app excludes forms such as sublingual or vaginal products from generic mapping. It does not consult a validated drug formulation database. A confirmed suggestion may inform the reviewed explanation, but it cannot count as a correctly extracted doctor statement. [MedlinePlus examples](https://www.medlineplus.gov/druginfo/meds/a608033.html) [FDA route definitions](https://www.fda.gov/drugs/data-standards-manual-monographs/route-administration)

## 7 Evaluation archive and data model

The archive retains the input, transcript, original draft, current reviewed table, route decisions, reference annotations, reviewer acknowledgements, processing metadata and generated audio. Review events record saved revisions and relevant snapshots; ordinary edits do not overwrite the original baseline. Deleting a case removes its website records and files.

References attach to medicine record IDs. Original rows are retained for comparison. Reviewers add a row for a missed medicine and mark final plan membership to identify extra or historical medicines. Corrections and reference verification are separate actions.

Each of the ten evaluated fields is annotated as explicitly stated, not mentioned, unclear or unreviewed. The fields are medicine name, action, form, strength, amount per dose, route, frequency, time of day, food timing and duration.

| Outcome | Definition |
| --- | --- |
| Correct stated field | Original value matches a verified stated reference after conservative text normalization |
| Incorrect | Original value differs from the stated reference |
| Missed field | Reference states a value but the original is blank |
| Correctly blank | Reference confirms not mentioned and the original is blank |
| Unsupported addition | Reference confirms not mentioned but the original supplies a value |
| Unclear or unreviewed | Excluded from evaluated field counts |
| Edited | Current reviewed value differs from original; an edit alone does not establish correctness |

Scoring uses the original draft. Accepting a route suggestion does not rewrite it. Partial references stay partial. Correctly blank fields are displayed separately from correct stated fields; they must not conceal critical instruction errors. Conservative text equality may reject valid paraphrases. The app does not automatically equate every 12 hours with twice daily.

Prepared examples are excluded from archive quality counters. Human role plays, consented recordings and pasted sources remain labelled. Their results must not be presented as an independently sampled clinical benchmark. Speech recognition, extraction, translation and pronunciation require separate assessments.

## 8 Success metrics and evidence

| Metric | Current evidence or definition | Status |
| --- | --- | --- |
| Software checks | 63 checks using fictional fixtures and mocked provider responses | Verified development run for 0.3.4-web |
| Type and production build checks | TypeScript and deployable build complete successfully | Development verification |
| Public access | Visitors can open the guide and fictional demo from setup. Private API reads require identity. | Guest browsing tested. Two-account isolation remains pending. |
| Archive outcomes | Counts of correct, incorrect or missed, correctly blank and unsupported fields against verified references | Implemented; no real recording performance claim |
| Complete case accuracy | Fully correct, fully annotated cases divided by fully annotated cases, accounting for missed and extra medicines | Benchmark reporting remains future work |
| Review burden | Number of edits and reviewer time before approval | Baseline and study pending |
| Patient comprehension | Correct source grounded teach back responses after listening | Patient study pending |
| Audio fidelity | Correctly spoken critical instructions compared with approved facts | Bilingual assessment pending |
| Latency and cost | Actual stage timings and provider usage, including retries and review | Per run metadata exists; no aggregate latency or rupee claim |

Workers runtime checks cover batch transcription recovery and stale voice revision handling with fictional provider responses. The hosted build and the earlier Python app have separate test results. Clinical accuracy, safety and patient benefit require their own evaluation.

## 9 Manual acceptance checks

Record browser, date, application version, actual result and evidence. Expected behaviour is not a recorded pass. Two account isolation, live API processing and audio quality need their own verification.

| Check | Expected result |
| --- | --- |
| Open signed out | Setup, How it works and the fictional demo are available without sign-in |
| Open two public examples | Prepared scenarios vary; no key or login is required |
| Edit public example and refresh | Original remains separate; local changes disappear; no archive write |
| Request archive signed out | API rejects access; no consultation data appears |
| Sign in with another account | Its own archive appears; it cannot read the owner's cases or files |
| Enter and test key | Enter the key after ChatGPT sign-in. The optional connection test reports the chat service result. |
| Upload supported 90 second WAV | Batch STT stage and extraction outcome are distinguishable |
| Switch from recording to transcript | Optional case label precedes the upload. A .txt file populates the conversation field. |
| Short desktop and narrow mobile viewport | Desktop profile remains visible above the bottom gap while navigation scrolls. Mobile profile appears in the header. |
| Clear active session | File, text and current case clear; archived cases remain |
| Save correction then reopen | Original value, correction and saved event remain available |
| Annotate absent versus missed fact | Correctly blank, missed and unsupported outcomes stay distinct |
| Confirm route suggestion | It is usable after review but stays excluded from extracted spoken facts |
| Complete required review fields | Incomplete fields block approval and are listed in the approval message. |
| Approve a complete medication review | Printable prescription opens. Language selection is available in the optional voice step. |
| Change approved facts or prepare another language | A medication change requires fresh plan approval. A new language requires a new script review. |
| Edit script and regenerate | Back translation and bilingual review are required again |
| Listen and export | Reviewed WAV and case JSON agree; no WhatsApp sending claim |
| Prepare voice from a stale view | A matching saved script can reopen. A changed plan requires review of the latest saved version. |
| Delete own test case | Website case data and archived files are removed; provider records are separate |

A separate manual log in the package records release observations and keeps unexecuted tests marked not run. No real recording or patient outcome result is fabricated.

## 10 Access privacy and GitHub publication

| Surface | Access and storage rule |
| --- | --- |
| Public website | How it works guide and fictional preview |
| Uploaded sources and archives | Sign in required; server queries include the authenticated owner ID |
| Recordings and generated audio | Private file storage, served through an owner checked API |
| API key | Kept in page memory and sent for model requests; not saved in the archive or browser storage |
| Retention | Website records remain until case deletion; no automatic retention schedule |
| Public GitHub repository | Source, PRD, fictional examples and sanitized software evidence; no live records or keys |

GitHub repository visibility and website access are independent. The README and repository Website field link to the existing hosted app. Uploading the source does not deploy a second working application. GitHub Pages is static hosting; this app also needs a server, authentication, database and private file storage. GitHub edits do not automatically update the current hosted deployment. [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

Recording permission must cover external AI processing and archiving, rather than assuming consultation consent covers those purposes. No production privacy certification, India only residency guarantee, authenticated clinician authorization or legal compliance claim is made.

## 11 Priorities and next validation

Next, validate a signed in role play from WAV to reviewed audio, two account isolation, qualified reference annotations and bilingual output. Define a held out benchmark before reporting real recording accuracy.

Later work includes clinician sign off, operational controls, patient comprehension studies, WhatsApp delivery and streaming transcription. Live interpretation needs separate evaluation; incomplete transcripts must not trigger automatic final instructions.

## 12 Evidence register

The project contains source code, 63 software checks, test logs, this PRD, market sources and the website walkthrough. Public files exclude patient records and credentials.
