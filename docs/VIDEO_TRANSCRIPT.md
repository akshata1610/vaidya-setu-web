# Vaidya Setu — how to use the website

Revised 10 November 2026 · Website 0.3.3-web  
Voice: **Neerja Expressive — Indian English (Option C)**  
Length: **04:24** · 1080p · Captions included

Website: https://vaidya-setu-review-lab.akshata-urs.chatgpt.site/

The walkthrough begins with the patient problem, then follows the user's journey from setup to returning to a saved case. The on-screen lists contain actions to perform. Sample-data explanations and sample scores have been removed from those lists.

The screens use a sample consultation. No real patient recording, live API processing or patient audio generation was performed for this video; the later API-dependent steps are explained. This is stated briefly outside the action list. The MVP's approval is a simulated review acknowledgement and WhatsApp delivery is not automatic.

## Steps to follow

1. **Set up:** Sign in with ChatGPT. Open **API settings**, enter your Sarvam key, and click **Done**. The optional **Test API connection** sends a small billable chat request and checks chat access only. Refreshing clears the key.
2. **Add a source:** In **Consultation**, use a case label without patient identifiers. Choose **Upload audio** and select a PCM WAV file, up to 10 minutes and 30 MB. Select recording type and the patient's confirmed output language, confirm permission, and click **Create medication draft**. Alternatively, select **Paste transcript**, paste the conversation, and complete the same form.
3. **Review:** Open **Medication review** and expand **Source conversation**. Compare the draft with the source. Check medicine name, doctor's instruction, dosage form, strength, dose each time, route, frequency, timing and duration. Resolve unclear instructions; do not invent missing facts. Confirm route suggestions only after checking them. Use **Add missed medicine** if necessary. Enter the reviewer's name, acknowledge the review, and click **Save corrections**.
4. **Evaluate extraction:** Open **Source & evaluation**. Mark whether each medicine belongs in the final plan. Annotate each field as **Explicitly stated**, **Not mentioned**, **Unclear in source**, or **Not reviewed**. Enter reference values when stated. Enter the reference reviewer's name, confirm the source check, and click **Save reference & evaluate original**. The result compares the original draft with the checked reference; later edits do not change that original score.
5. **Approve:** Return to **Medication review**, save remaining edits, and click **Approve saved version**. Open **Patient audio**.
6. **Check the translation:** With your key available, click **Generate translated script**. Check/edit the patient-language text, then click **Save script & back-translate**. A bilingual reviewer checks the actual translation, medicine names, numbers, units and timing, enters their name and acknowledgement, and clicks **Approve script**. Back-translation helps review but does not guarantee quality.
7. **Listen and download:** Click **Generate voice preview**. Listen fully and check the audio against the reviewed script. Confirm the listening check and click **Record listening review**, then **Download reviewed WAV**.
8. **Return to your work:** Use **Saved history** for a case's review events and **Evaluation archive** to search/reopen signed-in cases. **Clear / new session** resets the current workspace without deleting archived cases. **How it works** provides the website's written guide.

## Useful field meanings

| Field or result | Meaning |
|---|---|
| Strength | Medicine content in a tablet or measure. |
| Dose each time | Quantity used on each occasion. |
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

