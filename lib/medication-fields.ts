import type { Field, Medicine } from "./domain.ts";

const kannadaCounts: Record<string, number> = {
  "ಒಂದು": 1, "ಎರಡು": 2, "ಮೂರು": 3, "ನಾಲ್ಕು": 4, "ಐದು": 5,
  "ಆರು": 6, "ಏಳು": 7, "ಎಂಟು": 8, "ಒಂಬತ್ತು": 9, "ಹತ್ತು": 10,
  "ಹದಿನಾಲ್ಕು": 14, "ಹದಿನೈದು": 15, "ಇಪ್ಪತ್ತು": 20, "ಮೂವತ್ತು": 30,
};
const dailyCount = "(\\d+|" + Object.keys(kannadaCounts).join("|") + ")";
const daily = "(?:(?:ಒಂದು )?ದಿನಕ್ಕೆ|ಪ್ರತಿದಿನ|ಪ್ರತಿ ದಿನ)";
const dailySchedules = [
  new RegExp("^" + daily + " " + dailyCount + " (?:ಬಾರಿ|ಸಲ)$", "u"),
  new RegExp("^" + dailyCount + " (?:ಬಾರಿ|ಸಲ) " + daily + "$", "u"),
];
const durationUnits = [
  [/^ದಿನ(?:ಗಳು|ಗಳ ಕಾಲ|ಗಳವರೆಗೆ|ಗಳ ತನಕ|ದವರೆಗೆ|ಕ್ಕೆ)?$/u, "day"],
  [/^ವಾರ(?:ಗಳು|ಗಳ ಕಾಲ|ಗಳವರೆಗೆ|ಗಳ ತನಕ|ದವರೆಗೆ|ಕ್ಕೆ)?$/u, "week"],
  [/^ತಿಂಗಳು(?:ಗಳ ಕಾಲ|ಗಳವರೆಗೆ|ಗಳ ತನಕ)?$/u, "month"],
] as const;
const mealPhrases = [
  ["before_food", "before (?:food|(?:a )?meals?|eating)|before_food|(?:ಊಟದ|ಊಟಕ್ಕೆ|ಆಹಾರದ) ಮೊದಲು"],
  ["after_food", "after (?:food|(?:a )?meals?|eating)|after_food|(?:ಊಟದ|ಆಹಾರದ|ಊಟದಾದ) ನಂತರ|ಊಟ (?:ಆದ|ಮಾಡಿದ) (?:ಮೇಲೆ|ನಂತರ)"],
  ["with_food", "with (?:food|(?:a )?meals?)|with_food|(?:ಊಟದ|ಆಹಾರದ) (?:ಜೊತೆ|ಜೊತೆಗೆ)"],
  ["empty_stomach", "(?:on (?:an )?)?empty stomach|empty_stomach|ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ"],
] as const;

export function englishDigits(text: string) {
  return text.replace(/[०-९೦-೯]/g, digit => {
    const code = digit.charCodeAt(0);
    return String(code - (code >= 0xce6 ? 0xce6 : 0x966));
  });
}

function phrase(text: string | null) {
  return englishDigits(text ?? "").trim().toLowerCase().replace(/[.!।]+$/u, "").replace(/\s+/g, " ");
}

function count(text: string) {
  return kannadaCounts[text] ?? Number(text);
}

function englishFrequency(text: string) {
  if (/^(?:ದಿನಕ್ಕೊಮ್ಮೆ|(?:ಪ್ರತಿದಿನ|ಪ್ರತಿ ದಿನ|ದಿನಕ್ಕೆ) ಒಮ್ಮೆ)$/u.test(text)) return "once daily";
  for (const pattern of dailySchedules) {
    const match = pattern.exec(text);
    if (!match) continue;
    const number = count(match[1]);
    if (number === 1) return "once daily";
    if (number === 2) return "twice daily";
    if (Number.isSafeInteger(number) && number > 2) return number + " times daily";
  }
  return null;
}

function englishDuration(text: string) {
  const match = /^(\S+) (.+)$/u.exec(text);
  if (!match) return null;
  const number = count(match[1]);
  if (!Number.isSafeInteger(number) || number <= 0) return null;
  const unit = durationUnits.find(([pattern]) => pattern.test(match[2]))?.[1];
  return unit ? number + " " + unit + (number === 1 ? "" : "s") : null;
}

function splitMealTiming(value: string | null) {
  const text = phrase(value);
  for (const [meal, words] of mealPhrases) {
    const afterSchedule = new RegExp("(?:^|[ ,]+)(?:" + words + ")$", "u").exec(text);
    if (afterSchedule) return { meal, schedule: text.slice(0, afterSchedule.index).trim() };
    const beforeSchedule = new RegExp("^(?:" + words + ")[ ,]+", "u").exec(text);
    if (beforeSchedule) return { meal, schedule: text.slice(beforeSchedule[0].length) };
  }
  return null;
}

export function isMealOnly(value: string) {
  return splitMealTiming(value)?.schedule === "";
}

function containsOtherScript(value: string | null) {
  return Array.from(value ?? "").some(character =>
    /\p{Letter}/u.test(character) && !/\p{Script=Latin}/u.test(character) && character !== "μ" && character !== "µ");
}

export function untranslatedMedicationFields(medicine: Medicine): Field[] {
  const { id, evidence_quote, speaker, review_reason, ...fields } = medicine;
  return (Object.keys(fields) as Field[]).filter(field => containsOtherScript(fields[field]));
}

function reviewNote(medicine: Medicine, text: string) {
  medicine.review_reason = [medicine.review_reason, text].filter(Boolean).join(" ").slice(0, 600);
}

export function standardizeMedicationFields(medicine: Medicine): Medicine {
  const result = { ...medicine };
  const { id, evidence_quote, speaker, review_reason, ...fields } = result;
  for (const field of Object.keys(fields) as Field[]) {
    const value = fields[field];
    if (value) result[field] = englishDigits(value);
  }

  const timing = splitMealTiming(result.frequency);
  if (timing) {
    const otherTiming = splitMealTiming(timing.schedule);
    if ((result.meal_timing && result.meal_timing !== timing.meal) || (otherTiming && otherTiming.meal !== timing.meal)) {
      result.meal_timing = null;
      reviewNote(result, "Confirm the conflicting meal instructions against the source.");
    } else {
      result.meal_timing = timing.meal;
    }
    const schedule = otherTiming?.schedule ?? timing.schedule;
    const explicitSchedule = /\b(?:once|twice|thrice|daily|weekly|nightly|monthly|every|as needed|times? (?:a|per|each))\b/u;
    result.frequency = englishFrequency(schedule) ?? (explicitSchedule.test(schedule) || containsOtherScript(schedule) ? schedule : null);
    if (!result.frequency) reviewNote(result, "Confirm how often to take this medicine from the source.");
  }
  result.frequency = englishFrequency(phrase(result.frequency)) ?? result.frequency;
  result.duration = englishDuration(phrase(result.duration)) ?? result.duration;
  if (containsOtherScript(result.review_reason)) {
    result.review_reason = "Check the source quote and confirm the flagged details in English.";
  }
  return result;
}

export function prepareEnglishReview(medicine: Medicine): Medicine {
  const english = standardizeMedicationFields(medicine);
  const unresolved = untranslatedMedicationFields(english);
  if (unresolved.length) {
    for (const field of unresolved) english[field] = null;
    reviewNote(english, "Confirm the missing English details against the source quote.");
  }
  return english;
}
