import { ArrowRight, FileText, Printer } from "lucide-react";
import { effectiveRoute, type LabCase } from "@/lib/domain";

const actions: Record<string, string> = {
  prescribe: "Take as prescribed",
  continue: "Continue",
  stop: "Stop",
};
const meals: Record<string, string> = {
  before_food: "Before food",
  after_food: "After food",
  with_food: "With food",
  empty_stomach: "On an empty stomach",
};
const timestamp = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  dateStyle: "medium",
  timeStyle: "short",
});

export function ReviewedPrescription({ record, onAudio }: { record: LabCase; onAudio: () => void }) {
  const plan = record.reviewed.filter(medicine => medicine.action && actions[medicine.action]);
  if (!record.approval || !plan.length) {
    return (
      <section className="panel intro-panel">
        <FileText size={22} aria-hidden="true" />
        <div><h2>No prescription to print</h2><p>The reviewed version has no medicines to start, continue or stop.</p></div>
      </section>
    );
  }

  const sample = record.kind === "fictional";
  return (
    <>
      <div className="prescription-actions">
        <button className="button primary" onClick={() => window.print()}><Printer size={16} /> Print or save PDF</button>
        <button className="button secondary" onClick={onAudio}>Prepare voice instructions for the patient <ArrowRight size={15} /></button>
      </div>
      <article className="panel prescription-sheet" aria-labelledby="prescription-title">
        <header className="prescription-heading">
          <span>Vaidya Setu · Review Lab</span>
          <h2 id="prescription-title">{sample ? "Fictional prescription sample" : "Reviewed prescription"}</h2>
          <p>{sample ? "Prepared for demonstration only." : "For the registered clinician to complete and sign before sharing."}</p>
        </header>
        <dl className="prescription-meta">
          <div><dt>Case label</dt><dd>{record.title}</dd></div>
          <div><dt>Review recorded</dt><dd>{timestamp.format(new Date(record.approval.at))} IST</dd></div>
          <div><dt>Reviewed by</dt><dd>{record.approval.reviewer}</dd></div>
          {!sample && <div><dt>Patient name</dt><dd className="write-in" aria-label="Fill in before signing" /></div>}
        </dl>
        <div className="table-scroll prescription-table">
          <table>
            <thead><tr><th scope="col">Medicine</th><th scope="col">Directions</th><th scope="col">Schedule</th></tr></thead>
            <tbody>
              {plan.map(medicine => {
                const stopped = medicine.action === "stop";
                const route = effectiveRoute(record, medicine);
                return (
                  <tr key={medicine.id}>
                    <td>
                      <strong>{medicine.drug_name}</strong>
                      <span>{[medicine.strength, medicine.form].filter(Boolean).join(" · ")}</span>
                    </td>
                    <td>
                      <strong>{actions[medicine.action!]}</strong>
                      {!stopped && <><span>{medicine.dose}</span><span>{route}</span></>}
                    </td>
                    <td>
                      {!stopped && <><span>{medicine.frequency}</span><span>{medicine.time_of_day}</span><span>{meals[medicine.meal_timing ?? ""]}</span></>}
                      {medicine.duration && !stopped && <span>{medicine.duration}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!sample && (
          <div className="prescription-signoff">
            <span className="write-in">Clinician signature</span>
            <span className="write-in">Registration number</span>
          </div>
        )}
      </article>
    </>
  );
}
