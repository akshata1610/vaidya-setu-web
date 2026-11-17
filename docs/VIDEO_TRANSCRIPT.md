# Vaidya Setu — how to use the website

Revised 10 November 2026 · Website 0.3.3-web  
Voice: **Neerja Expressive — Indian English (Option C)**  
Length: **04:24** · 1080p · Captions included

Website: https://vaidya-setu-review-lab.akshata-urs.chatgpt.site/

The walkthrough begins with the patient problem, then follows the user's journey from setup to returning to a saved case. The on-screen lists contain actions to perform. Sample-data explanations and sample scores have been removed from those lists.

The screens use a sample consultation. No real patient recording, live API processing or patient audio generation was performed for this video; the later API-dependent steps are explained. This is stated briefly outside the action list. The MVP's approval is a simulated review acknowledgement and WhatsApp delivery is not automatic.

## Steps for the current website

These steps reflect **0.3.4-web**. The chapters and narration below describe the screens shown in the 10 November recording.

1. Use **How it works** on the setup page to see the guide. Select **Sign in with ChatGPT**, enter your Sarvam API key and select **Continue to consultation**. Guests can try the fictional demo.
2. Add an optional case alias. Upload a completed PCM WAV, up to 10 minutes and 30 MB, or go to the transcript page to upload a .txt file or paste the conversation. Confirm permission and select **Generate medication draft**.
3. Compare the draft with **Source conversation**. Replay timestamps when available, correct the fields in English and fill the fields marked with an asterisk. Confirm any suggested route, enter the reviewer’s name and acknowledgement, and select **Save corrections**.
4. Select **Approve & prepare prescription**, then **Print or save PDF** if a written copy is needed for clinician sign-off.
5. For optional audio, select **Prepare voice instructions for the patient**, choose Kannada, Hindi or English and select **Prepare script for the patient**. Review the conversational wording and select **Save script & back-translate**. A bilingual reviewer checks the actual script and selects **Approve script**.
6. Select **Generate voice instructions**. Listen against the reviewed script and select **Record listening review**, then **Download voice instructions (WAV)**.
7. Return to **Evaluation archive** to reopen cases. Use **Source & evaluation** to compare the original extraction against a separate source check. **Saved history** shows the revision events.

## Useful field meanings

| Field or result | Meaning |
|---|---|
| Strength | Medicine content in a tablet or measure. |
| Amount per dose | Quantity used on each occasion. |
| How often | Dosing frequency, such as twice a day. |
| Timing relative to meals | Whether to take it before, with or after food. |
| Doctor's instruction | Take as prescribed; Continue existing medicine; Stop this medicine; Mentioned only — not prescribed; or Not stated / unclear — confirm. |
| Route | How the medicine is used. A form-based suggestion is separate from a route stated in the conversation. |
| Correctly blank | The source did not mention that detail and the original draft left it blank. |
| Missed | The source stated the fact, but the original draft omitted it. |

## Chapters and exact narration

### 00:00 — Clearer instructions after a consultation

After a consultation, medicine instructions can be hard to remember. Vaidya Setu turns recorded conversations into a medication draft for review, followed by an audio explanation in the patient's language. Let's walk through the website.

### 00:19 — Sign in and connect your Sarvam key

First, sign in with ChatGPT. Open A P I settings, enter your Sarvam key, and click Done. The optional connection test checks chat access only. Enter your key again if you refresh the page.

### 00:37 — Upload a recording and create the draft

In Consultation, enter a case label, choose Upload audio, and select your recording. Use a P C M wave file, up to ten minutes and thirty megabytes. Choose the recording type and patient language, confirm permission, then click Create medication draft.

### 01:00 — Use a transcript instead of a recording

Already have the conversation as text? Choose Paste transcript, paste it into the Conversation box, and complete the same form. This skips speech recognition.

### 01:14 — Check each medicine against the source

Open Medication review and expand Source conversation. Read the transcript and listen to the recording. Check the medicine name, strength, Dose each time, frequency, duration, and timing. Strength describes medicine content; dose each time is the quantity used.

### 01:38 — Record what the doctor instructed

Use Doctor's instruction to record what the doctor asked: take as prescribed, continue, stop, or mentioned only. If unclear, select Not stated or unclear, and resolve it before approval.

### 01:56 — Confirm the route and save corrections

Route means how the medicine is used. Check suggestions before confirming them. Leave unstated details blank instead of guessing. Add any missed medicine. Enter the reviewer's name, complete the review acknowledgement, and click Save corrections.

### 02:17 — Create a reference from the conversation

To evaluate extraction, open Source and evaluation. Check whether each medicine belongs in the final plan. Mark each field as Explicitly stated, Not mentioned, Unclear in source, or Not reviewed. Enter stated reference values. Name the reviewer, confirm the source check, and click Save reference and evaluate original.

### 02:46 — Separate missing information from missed facts

Results compare the original draft with your checked reference. Correctly blank means the doctor did not mention that detail. Missed means the doctor did, but the draft left it blank. Later corrections do not change the original draft's score.

### 03:07 — Approve the saved medication version

Return to Medication review. Save any remaining edits and click Approve saved version. Then open Patient audio. Approval here is a simulated review acknowledgement.

### 03:23 — Review and approve the translated script

Click Generate translated script. Check the patient-language text, make corrections, and click Save script and back-translate. A bilingual reviewer checks the actual translation, medicine names, numbers, and timing before selecting Approve script.

### 03:43 — Listen to the voice before exporting

Next, click Generate voice preview. Listen to the complete audio and check pronunciation and medication details. Confirm the listening check, click Record listening review, then Download reviewed wave. WhatsApp delivery is not automatic.

### 04:04 — Find saved cases and review history

Use Saved history to see a case's review events, and Evaluation archive to reopen signed-in cases. Clear or new session resets the workspace without deleting archived cases. For written instructions, open How it works.

