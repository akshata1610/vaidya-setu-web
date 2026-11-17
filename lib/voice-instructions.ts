import type { Medicine } from "./domain.ts";

const spokenUnits: Record<string, string> = {
  mg: "milligram", g: "gram", mcg: "microgram", "µg": "microgram", "μg": "microgram",
  ml: "millilitre", l: "litre", tab: "tablet", tabs: "tablet", cap: "capsule", caps: "capsule",
};
const timesOfDay: Record<string, string> = {
  morning: "in the morning", afternoon: "in the afternoon", evening: "in the evening",
  night: "at night", bedtime: "at bedtime", noon: "at noon", midnight: "at midnight",
};
const mealPhrases: Record<string, string> = {
  before_food: "before food", after_food: "after food", with_food: "with food", empty_stomach: "on an empty stomach",
};
const mealChecks: Record<string, RegExp> = {
  before_food: /\bbefore (?:food|eating|(?:a |your |the )?meals?)\b/i,
  after_food: /\bafter (?:food|eating|(?:a |your |the )?meals?)\b/i,
  with_food: /\bwith (?:food|(?:a |your |the )?meals?)\b|\bwhile eating\b/i,
  empty_stomach: /\bempty stomach\b/i,
};

function phrase(value: string | null) {
  return value?.trim().replace(/[.!?]+$/, "") ?? "";
}

function measure(value: string | null) {
  return phrase(value).replace(/(\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)\s*(mg|mcg|[µμ]g|g|ml|l|tabs?|caps?)\b/giu, (_, amount: string, unit: string) => {
    const word = spokenUnits[unit.toLowerCase()];
    return amount + " " + word + (Number(amount) === 1 ? "" : "s");
  });
}

function wordsInclude(value: string, part: string) {
  return part !== "" && (" " + value.toLowerCase() + " ").includes(" " + part.toLowerCase() + " ");
}

function spokenTime(value: string | null) {
  const text = phrase(value);
  const parts = text.toLowerCase().split(/\s*(?:,|\band\b)\s*/).filter(Boolean);
  if (parts.length && parts.every(part => Object.hasOwn(timesOfDay, part))) {
    const times = parts.map(part => timesOfDay[part]);
    return times.length === 1 ? times[0] : times.slice(0, -1).join(", ") + " and " + times[times.length - 1];
  }
  return /^\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/i.test(text) ? "at " + text : text;
}

export function spokenMedicationInstruction(medicine: Medicine, routeValue: string | null) {
  const route = phrase(routeValue);
  const byMouth = /^(?:oral \(by mouth\)|oral|orally|by mouth)$/i.test(route);
  const onSkin = /^(?:topical \(on skin\)|topical|on (?:the )?skin|to the skin)$/i.test(route);
  const verb = byMouth ? "Take" : onSkin ? "Apply" : "Use";
  const gerund = byMouth ? "taking" : onSkin ? "applying" : "using";
  const place = byMouth ? "by mouth" : onSkin ? "to the skin" : route;

  const name = phrase(medicine.drug_name);
  const strength = wordsInclude(name, phrase(medicine.strength)) ? "" : measure(medicine.strength);
  const form = phrase(medicine.form);
  const unitForm = /^(?:tablets|capsules|drops|puffs)$/i.test(form) ? form.slice(0, -1) : form;
  const amount = measure(medicine.dose);
  const includeForm = form && !wordsInclude(name, form) &&
    (medicine.action === "stop" || (!wordsInclude(amount, unitForm) && !wordsInclude(amount, unitForm + "s")));
  if (medicine.action === "stop") {
    const product = [name, strength].filter(Boolean).join(" ");
    return "Stop " + gerund + " " + product + (includeForm ? " in " + unitForm + " form" : "") + ".";
  }

  const product = [name, strength, includeForm ? form : ""].filter(Boolean).join(" ");
  const action = medicine.action === "continue" ? "Keep " + gerund : verb;
  const dose = amount && !/^as /i.test(amount) ? amount + " of " + product : [product, amount].filter(Boolean).join(" ");
  const frequency = phrase(medicine.frequency)
    .replace(/^thrice (?:daily|a day)$/i, "three times a day")
    .replace(/^((?:once|twice|\d+ times|[a-z]+ times)) daily$/i, "$1 a day");
  const duration = phrase(medicine.duration);
  const length = duration && !/^(?:for\s|until\s|through\s|while\s|indefinitely\b)/i.test(duration) ? "for " + duration : duration;
  const instruction = [action, dose, place, frequency].filter(Boolean).join(" ");
  return [instruction, spokenTime(medicine.time_of_day), mealPhrases[medicine.meal_timing ?? ""], length].filter(Boolean).join(", ") + ".";
}

export function matchesMealInstruction(meal: string | null | undefined, wording: string) {
  const check = mealChecks[meal ?? ""];
  return !check || check.test(wording);
}
