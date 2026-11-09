# Vaidya Setu Hosted MVP Requirements

Product requirements for public demonstration and private consultation review

| Document field | Value |
| --- | --- |
| Product owner | Akshata Anil Urs |
| Updated | 8 November 2026 |
| PRD version | 3.1 |
| Web application | 0.3.2 web |
| Stage | Independent portfolio MVP built with AI assisted coding |
| Live website | [Open Vaidya Setu](https://vaidya-setu-review-lab.akshata-urs.chatgpt.site/) |

Vaidya Setu turns a completed consultation recording or pasted conversation into an editable medication draft. A reviewer checks the source, saves corrections and approves one exact version. The app then supports Kannada, Hindi or English script review and a WAV voice preview. An evaluation archive retains the original draft separately from corrections and source verified reference answers.

The hosted MVP offers a public fictional preview. Uploads, Sarvam calls, saved cases and recordings require ChatGPT sign in and are scoped to the signed in account. The public preview makes no model request or archive write. This product assists review of stated instructions; it does not independently prescribe, issue a signed prescription or establish clinical safety.

## 1 Problem and intended outcome

Patients and caregivers may need understandable, replayable instructions after a consultation. A language or terminology mismatch can complicate that task. A conversation to audio pipeline can introduce additional errors in drug names, strength, amount per dose, frequency, duration and timing.

The MVP makes these transformations inspectable. Its intended outcome is a source checked medication explanation with a traceable review history. Whether this improves patient comprehension or reduces provider effort remains a research question.

## 2 Users and product decisions

| User | Task | Current support |
| --- | --- | --- |
| Recruiter or portfolio visitor | Understand the project without installation | Public fictional preview, research and explanation pages |
| Reviewer or demo operator | Check and correct medication facts | Source playback, transcript, editable records and saved revisions |
| Bilingual reviewer | Check translated and spoken instructions | Script editing, back translation, warnings and audio preview |
| Product evaluator | Distinguish extraction errors from missing source facts | Original draft, field annotations and archived outcomes |
| Patient or caregiver | Replay instructions in a preferred language | Reviewed audio export; patient testing remains outstanding |

These are design roles, not findings from completed interviews. A typed reviewer name does not authenticate a clinician. Sign in establishes an account identity, not professional qualifications.

The product starts with completed recordings so inputs and outputs can be inspected. It separates strength from dose, and time of day from food timing. It builds patient instructions from the approved table. Inferred route suggestions remain separate from spoken facts and extraction scores.

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
| F01 | Public browsing and varied fictional previews | Preview changes remain in the browser tab and disappear on refresh |
| F02 | ChatGPT sign in for uploads, model requests and archives | Each operation must authorize the account; no owner invitation is needed once the site is public |
| F03 | Completed PCM WAV up to 10 minutes and 30 MB, or pasted text | Pasted text is labelled as bypassing STT |
| F04 | Short file REST STT and longer file batch STT | Open page polling; interrupted upload or start can resume from the saved source |
| F05 | Up to 12 medication records with evidence and review notes | Unknown facts stay blank; model accuracy is unestablished |
| F06 | Saved corrections and version bound simulated approval | Changed facts or language invalidate dependent outputs |
| F07 | Explicit route plus separate form based suggestions | Suggested routes require confirmation and never become spoken evidence |
| F08 | Source annotations and original draft evaluation | A missing or unverified reference is not a pass |
| F09 | Reviewed Kannada, Hindi or English script and WAV preview | Actual bilingual quality and pronunciation require assessment |
| F10 | Private archive, revision events, case JSON export and deletion | Latest 200 cases and 100 events per case are displayed; export uses the same event limit |

The hosted edition does not implement live interpretation, automatic WhatsApp delivery, signed prescriptions, EMR integration, validated FHIR export, interaction or clinical dose checking, a background processing scheduler, FFmpeg OGG conversion or the Python folder benchmark. The earlier Python app remains a separate implementation.

## 5 User journeys and acceptance criteria

### Public visitor

A visitor opens the Live demo link from GitHub, views the research and opens a prepared fictional example without signing in. They can edit its table, confirm a route suggestion and simulate review or field evaluation. The interface labels the data as prepared and the history as local. No anonymous upload, private archive access or billable API operation is allowed.

### Signed in consultation review

1. The operator enters a Sarvam key and may test it with a small billable chat request. Entry alone is not verification of a working key or access to every service.
2. The operator uses an alias, chooses the confirmed output language and acknowledges permission for upload, external processing and private archiving.
3. The input is saved. STT and extraction outcomes, including failures, remain visible. The original transcript and accepted original extraction are retained.
4. The reviewer checks the recording, evidence and medication fields. Saving creates a revision event. Clear or new session resets the active UI without deleting archived cases.
5. Required gaps, unclear actions and unresolved route confirmation block approval. A verified reference that contradicts the current plan also blocks or revokes approval.
6. Translation uses approved medication facts. The reviewer saves script edits, runs back translation and records bilingual review before generating speech.
7. The reviewer listens, records that check and downloads WAV. Export does not claim that a WhatsApp message was sent.

Changing medicine facts, route decisions or language clears plan approval and dependent script or audio. Changing a translated script requires its review again. An extraction retry is bounded; explicitly truncated responses are not accepted as medication drafts.

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
| Software checks | 43 passing checks using fictional fixtures and mocked provider responses | Verified development run for 0.3.2 web |
| Type and production build checks | TypeScript and deployable build complete successfully | Development verification |
| Public access | Anonymous visitor can open the page and local demo; private API reads reject missing identity | Anonymous checks passed; account tests pending |
| Archive outcomes | Counts of correct, incorrect or missed, correctly blank and unsupported fields against verified references | Implemented; no real recording performance claim |
| Complete case accuracy | Fully correct, fully annotated cases divided by fully annotated cases, accounting for missed and extra medicines | Benchmark reporting remains future work |
| Review burden | Number of edits and reviewer time before approval | Baseline and study pending |
| Patient comprehension | Correct source grounded teach back responses after listening | Patient study pending |
| Audio fidelity | Correctly spoken critical instructions compared with approved facts | Bilingual assessment pending |
| Latency and cost | Actual stage timings and provider usage, including retries and review | Per run metadata exists; no aggregate latency or rupee claim |

An additional Workers runtime check reproduces the former redirect error and completes recovery with fixtures. The Python app's 53 checks remain separate. These checks do not establish clinical accuracy, safety or benefit.

## 9 Manual acceptance checks

Record browser, date, application version, actual result and evidence. Expected behaviour is not a recorded pass. Two account isolation, live API processing and audio quality need their own verification.

| Check | Expected result |
| --- | --- |
| Open signed out | Public page and research load without owner permission |
| Open two public examples | Prepared scenarios vary; no key or login is required |
| Edit public example and refresh | Original remains separate; local changes disappear; no archive write |
| Request archive signed out | API rejects access; no consultation data appears |
| Sign in with another account | Its own archive appears; it cannot read the owner's cases or files |
| Enter and test key | Entry is unverified; an explicit test reports the actual service result |
| Upload supported 90 second WAV | Batch STT stage and extraction outcome are distinguishable |
| Clear active session | File, text and current case clear; archived cases remain |
| Save correction then reopen | Original value, correction and saved event remain available |
| Annotate absent versus missed fact | Correctly blank, missed and unsupported outcomes stay distinct |
| Confirm route suggestion | It is usable after review but stays excluded from extracted spoken facts |
| Change approved facts or language | Prior dependent approvals and outputs are invalidated |
| Edit script and regenerate | Back translation and bilingual review are required again |
| Listen and export | Reviewed WAV and case JSON agree; no WhatsApp sending claim |
| Use a stale second tab | A newer saved revision cannot be silently overwritten |
| Delete own test case | Website case data and archived files are removed; provider records are separate |

A separate manual log in the package records release observations and keeps unexecuted tests marked not run. No real recording or patient outcome result is fabricated.

## 10 Access privacy and GitHub publication

| Surface | Access and storage rule |
| --- | --- |
| Public website | Fictional preview, research and explanatory material |
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

The package contains source code, 43 software checks, test logs, this PRD, market sources and upload instructions. Public files exclude patient records and credentials.
