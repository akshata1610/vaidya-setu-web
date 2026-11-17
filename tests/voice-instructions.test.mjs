import assert from "node:assert/strict";
import test from "node:test";
import { emptyMedicine, englishLines } from "../lib/domain.ts";
import { Sarvam } from "../lib/sarvam.ts";
import { matchesMealInstruction } from "../lib/voice-instructions.ts";
import { recoverVoiceConflict } from "../lib/voice-conflict.ts";

const medicine = fields => ({ ...emptyMedicine("m1"), drug_name: "XYZ", action: "prescribe", ...fields });
const spoken = record => englishLines({ reviewed: [record], routes: {} })[0].english;
const example = medicine({
  strength: "650 mg", form: "tablet", dose: "1 tablet", route: "oral",
  frequency: "twice daily", time_of_day: "morning and night", meal_timing: "after_food", duration: "10 days",
});
const exampleSentence = "Take 1 tablet of XYZ 650 milligrams by mouth twice a day, in the morning and at night, after food, for 10 days.";

test("approved oral directions become one complete spoken instruction", () => {
  assert.equal(spoken(example), exampleSentence);
  assert.equal(spoken({ ...example, form: "tablets", dose: "1 tab", duration: "for 10 days" }), exampleSentence);
});

test("intervals and the approved route and duration carry into the spoken script", () => {
  const record = medicine({
    action: "continue", form: "oral solution", dose: "5 mL", frequency: "every 8 hours",
    route: "oral (by mouth)", duration: "until your next review",
  });
  assert.equal(spoken(record), "Keep taking 5 millilitres of XYZ oral solution by mouth every 8 hours, until your next review.");
  assert.equal(spoken(medicine({ route: "topical (on skin)", dose: "a thin layer", form: "cream", strength: "1%", frequency: "once daily", duration: "3 days" })),
    "Apply a thin layer of XYZ 1% cream to the skin once a day, for 3 days.");
});

test("the stop instruction identifies the medicine and strength and discussed medicines stay out", () => {
  const stop = { ...example, action: "stop" };
  assert.equal(spoken(stop), "Stop taking XYZ 650 milligrams in tablet form.");
  assert.deepEqual(englishLines({ reviewed: [medicine({ action: "discussed" })], routes: {} }), []);
});

test("meal review accepts equivalent spoken wording and flags changed or missing instructions", () => {
  assert.equal(matchesMealInstruction("after_food", "Take it after your meal."), true);
  assert.equal(matchesMealInstruction("before_food", "Take it before eating."), true);
  assert.equal(matchesMealInstruction("before_food", "Take it after food."), false);
  assert.equal(matchesMealInstruction("with_food", "Take it in the morning."), false);
});

test("the spoken script can use conversational Kannada or Hindi with a formal back-translation", async () => {
  const requests = [];
  const provider = new Sarvam("fixture", undefined, async (_url, options) => {
    const body = JSON.parse(options.body);
    requests.push(body);
    return Response.json({ translated_text: body.target_language_code === "en-IN" ? exampleSentence : "Fictional translated script" });
  });
  assert.equal(await provider.translate(exampleSentence, "en-IN", "en-IN", "classic-colloquial"), exampleSentence);
  for (const language of ["kn-IN", "hi-IN"]) {
    const translated = await provider.translate(exampleSentence, "en-IN", language, "classic-colloquial");
    await provider.translate(translated, language, "en-IN");
  }
  assert.deepEqual(requests.map(({ target_language_code, mode }) => [target_language_code, mode]), [
    ["kn-IN", "classic-colloquial"], ["en-IN", "formal"], ["hi-IN", "classic-colloquial"], ["en-IN", "formal"],
  ]);
  assert.equal(requests[0].input, exampleSentence);
  assert.equal(requests[0].numerals_format, "international");
});

const approved = {
  id: "fictional-case", revision: 3, status: "approved", reviewed: [example], routes: {},
  approval: { at: "2026-11-16T00:00:00Z", reviewer: "Fixture reviewer", hash: "fixture", version: 2 },
};
const drafted = {
  ...approved, revision: 4, status: "script_draft", language: "kn-IN",
  lines: [{ id: example.id, english: exampleSentence, native: "Fictional Kannada translation" }],
};

test("an already-saved script resolves a stale voice handoff without another provider request", () => {
  assert.equal(recoverVoiceConflict(approved, drafted, "translate", "kn-IN", true), "use_saved_script");
  assert.equal(recoverVoiceConflict(approved, drafted, "translate", "kn-IN", false), "use_saved_script");
  assert.equal(recoverVoiceConflict(approved, drafted, "translate", "hi-IN", true), "review_latest");
});

test("voice can retry an unrelated save only when the provider step never started", () => {
  const newer = { ...drafted, revision: 5, referenceReviewer: "Fixture reference reviewer" };
  assert.equal(recoverVoiceConflict(drafted, newer, "check_script", undefined, true), "retry");
  assert.equal(recoverVoiceConflict(drafted, newer, "check_script", undefined, false), "review_latest");
});

test("a competing prescription or script change requires explicit review of the saved version", () => {
  const corrected = { ...drafted, revision: 5, reviewed: [{ ...example, dose: "2 tablets" }] };
  assert.equal(recoverVoiceConflict(approved, corrected, "translate", "kn-IN", true), "review_latest");
  assert.equal(recoverVoiceConflict(approved, { ...drafted, approval: undefined }, "translate", "kn-IN", true), "review_latest");
  const edited = { ...drafted, revision: 5, lines: [{ ...drafted.lines[0], native: "Newer reviewed script" }] };
  assert.equal(recoverVoiceConflict(drafted, edited, "check_script", undefined, true), "review_latest");
});
