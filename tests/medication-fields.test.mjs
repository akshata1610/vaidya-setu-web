import assert from "node:assert/strict";
import test from "node:test";
import { approvalProblems, emptyMedicine, requiredMedicationFields } from "../lib/domain.ts";
import { prepareEnglishReview } from "../lib/medication-fields.ts";
import { Sarvam } from "../lib/sarvam.ts";

const medicine = (fields = {}) => ({
  ...emptyMedicine("m1"), drug_name: "Fictional A", action: "prescribe", dose: "1 tablet",
  route: "oral", frequency: "twice daily", duration: "3 days", ...fields,
});
const caseWith = row => ({ reviewed: [row], routes: {}, reviewer: "Test reviewer", reviewAcknowledged: true });

test("clear Kannada frequency and duration use English while the source quote retains the spoken words", () => {
  const source = medicine({
    frequency: "ದಿನಕ್ಕೆ ೨ ಬಾರಿ ಊಟದ ನಂತರ",
    duration: "ಐದು ದಿನಗಳವರೆಗೆ",
    evidence_quote: "ದಿನಕ್ಕೆ ೨ ಬಾರಿ ಊಟದ ನಂತರ ಐದು ದಿನಗಳವರೆಗೆ",
  });
  const draft = prepareEnglishReview(source);
  assert.equal(draft.frequency, "twice daily");
  assert.equal(draft.meal_timing, "after_food");
  assert.equal(draft.duration, "5 days");
  assert.equal(draft.evidence_quote, source.evidence_quote);
  assert.notEqual(draft.frequency, source.frequency);
  assert.deepEqual(approvalProblems(caseWith(draft)), []);
});

test("a meal instruction on its own leaves the dosing frequency open for review", () => {
  for (const frequency of ["After food", "after a meal", "ಊಟದ ನಂತರ", "after food for 5 days"]) {
    const actual = prepareEnglishReview(medicine({ frequency }));
    assert.equal(actual.frequency, null);
    assert.equal(actual.meal_timing, "after_food");
    assert.match(approvalProblems(caseWith(actual)).join(" "), /complete how often/);
  }
  assert.match(approvalProblems(caseWith(medicine({ frequency: "After meals" }))).join(" "), /enter how often/);
  assert.match(approvalProblems(caseWith(medicine({ frequency: "2" }))).join(" "), /enter how often/);
});

test("a mixed English schedule separates the meal instruction without turning an interval into a daily count", () => {
  const result = prepareEnglishReview(medicine({ frequency: "Every 8 hours, after food" }));
  assert.equal(result.frequency, "every 8 hours");
  assert.equal(result.meal_timing, "after_food");
});

test("unresolved scripted fields need review and optional fields stay optional", () => {
  const draft = prepareEnglishReview(medicine({ duration: "ಚೇತರಿಸಿಕೊಳ್ಳುವವರೆಗೆ", meal_timing: null, strength: "50 µg" }));
  assert.equal(draft.duration, null);
  assert.equal(draft.strength, "50 µg");
  assert.match(draft.review_reason, /English details/);
  assert.deepEqual(requiredMedicationFields(medicine({ action: "stop" })), ["action", "drug_name"]);
  assert.deepEqual(requiredMedicationFields(medicine({ action: "discussed" })), ["action"]);
  assert.ok(!requiredMedicationFields(medicine()).includes("meal_timing"));
  assert.ok(!requiredMedicationFields(medicine()).includes("strength"));
  assert.deepEqual(approvalProblems(caseWith(medicine({ action: "stop", dose: null, route: null, frequency: null, duration: null }))), []);
});

test("a failed English recheck keeps the usable draft and its source evidence", async () => {
  let calls = 0;
  const { id, ...row } = medicine({ frequency: "ಊಟದ ನಂತರ", evidence_quote: "ಊಟದ ನಂತರ ತೆಗೆದುಕೊಳ್ಳಿ" });
  const provider = new Sarvam("fixture", undefined, async () => {
    if (++calls === 2) return new Response("", { status: 429 });
    return Response.json({ choices: [{ finish_reason: "stop", message: {
      content: JSON.stringify({ medications: [row], review_notes: [] }),
    } }] });
  });
  const result = await provider.extract(row.evidence_quote);
  assert.equal(calls, 2);
  assert.equal(result.medications[0].frequency, row.frequency);
  assert.equal(prepareEnglishReview(result.medications[0]).meal_timing, "after_food");
});
