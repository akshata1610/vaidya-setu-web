import type { Ref } from "react";
import { ArrowUpRight } from "lucide-react";
import { SARVAM_MODELS } from "@/lib/sarvam-models";

export function LabGuide({ headingRef }: { headingRef: Ref<HTMLHeadingElement> }) {
 return (
  <>
   <div className="page-heading">
    <div>
     <h1 tabIndex={-1} ref={headingRef}>How it works</h1>
     <p>Go from a completed teleconsultation to a reviewed prescription and optional voice instructions.</p>
    </div>
   </div>
   <ol className="guide-grid guide-steps" role="list">
    <li className="panel guide-card">
     <h2>Sign in and connect Sarvam</h2>
     <p>Select <strong>Sign in with ChatGPT</strong>, enter your Sarvam API key and select <strong>Continue to consultation</strong>. The key stays in this tab until you refresh or close it.</p>
     <p>Select <strong>Try demo without signing in</strong> to explore a fictional case.</p>
    </li>
    <li className="panel guide-card">
     <h2>Add the conversation</h2>
     <p>Start with an optional case label using an alias. Upload a completed PCM WAV recording, up to 10 minutes and 30 MB, or select <strong>or go to the transcript page</strong> to upload a .txt file or paste the conversation.</p>
     <p>Confirm permission for deidentified material and select <strong>Generate medication draft</strong>. {SARVAM_MODELS.transcription.label} transcribes recordings and {SARVAM_MODELS.extraction.label} drafts the instructions. If transcription fails, retry from the saved recording or enter the transcript.</p>
    </li>
    <li className="panel guide-card">
     <h2>Check the medication draft</h2>
     <p>Compare the draft with the conversation. Use an available timestamp to replay the source near an uncertain medicine. Medicine name references can help you check spelling. Confirm the name and directions with the source.</p>
     <p>Enter corrections in English. <strong>Amount per dose</strong> is the quantity taken at one time. Use <strong>How often</strong> for frequency and <strong>Timing relative to meals</strong> for instructions such as after food. Complete the fields marked <strong>*</strong> for the selected action.</p>
    </li>
    <li className="panel guide-card">
     <h2>Prepare the prescription</h2>
     <p>Confirm any suggested route, enter the reviewer’s name, check the review acknowledgement and select <strong>Save corrections</strong>. Select <strong>Approve &amp; prepare prescription</strong>. If a required detail is missing, the approval message lists what to complete.</p>
     <p>Select <strong>Print or save PDF</strong> for a prescription the clinician can complete and sign.</p>
    </li>
    <li className="panel guide-card">
     <h2>Prepare voice instructions if needed</h2>
     <p>From the prescription, select <strong>Prepare voice instructions for the patient</strong>. Choose Kannada, Hindi or English and select <strong>Prepare script for the patient</strong>. Each medicine’s approved instructions are put into everyday sentences. {SARVAM_MODELS.translation.label} translates the script when needed.</p>
     <p>Select <strong>Save script &amp; back-translate</strong> and check the translation against the approved directions. Record the bilingual review, select <strong>Approve script</strong> and then <strong>Generate voice instructions</strong>. {SARVAM_MODELS.speech.label} reads the script aloud. Listen and record the listening review before downloading the WAV.</p>
    </li>
    <li className="panel guide-card">
     <h2>Return to a saved case</h2>
     <p>Open <strong>Evaluation archive</strong> to find earlier consultations. The voice step can reopen a saved script for the same approved plan and language. If the plan changes, select <strong>Load latest saved version</strong> and review it.</p>
     <p>Use <strong>Source &amp; evaluation</strong> for a separate source check of the original draft. <strong>Saved history</strong> shows the case’s review and processing events.</p>
    </li>
   </ol>
   <section className="panel guide-route">
    <h2>Confirm the route from the conversation</h2>
    <p>Follow the route the doctor stated. A plain tablet, capsule or syrup can suggest oral use. A plain cream or ointment can suggest use on the skin. Check suggestions with the clinician, especially for specialised forms, drops and injections.</p>
    <div className="button-row">
     <a className="source-link" href="https://www.medlineplus.gov/druginfo/meds/a608033.html" target="_blank" rel="noreferrer">An example of a specialised tablet <ArrowUpRight size={14} aria-hidden="true" /></a>
     <a className="source-link" href="https://www.fda.gov/drugs/data-standards-manual-monographs/route-administration" target="_blank" rel="noreferrer">Route definitions <ArrowUpRight size={14} aria-hidden="true" /></a>
    </div>
   </section>
  </>
 );
}
