import type { LabCase } from "./domain.ts";

function voiceState(record: LabCase) {
 return JSON.stringify({
  language: record.language,
  lines: record.lines,
  scriptReviewed: !!record.scriptReviewed,
  audioKey: record.audioKey,
  listened: !!record.listened,
 });
}

export function recoverVoiceConflict(
 base: LabCase,
 latest: LabCase,
 action: string,
 requestedLanguage: unknown,
 retryable: boolean,
) {
 if (base.id !== latest.id || !base.approval || !latest.approval || latest.status === "deletion_pending" ||
     JSON.stringify(base.reviewed) !== JSON.stringify(latest.reviewed) ||
     JSON.stringify(base.routes) !== JSON.stringify(latest.routes)) {
  return "review_latest";
 }
 if (action === "translate" && latest.language === requestedLanguage && latest.lines?.length) {
  return "use_saved_script";
 }
 if (retryable && voiceState(base) === voiceState(latest)) return "retry";
 return "review_latest";
}
