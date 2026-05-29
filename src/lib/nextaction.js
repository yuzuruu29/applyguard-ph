// nextaction.js — pure helper that turns a verdict + missing info into one
// clear, plain-language next step. No React, no DOM, no storage.

/**
 * @param {"Apply"|"Caution"|"Skip"} verdict
 * @param {string[]} [missingInfo]
 * @returns {string}
 */
export function suggestNextAction(verdict, missingInfo = []) {
  const hasGaps = Array.isArray(missingInfo) && missingInfo.length > 0;

  if (verdict === "Skip") {
    return "Skip this one. The risk signals outweigh what you'd get back. Put your time into safer posts.";
  }

  if (verdict === "Caution") {
    if (hasGaps) {
      return "Don't apply yet. Send the clarifying questions below first, then re-scan once they answer.";
    }
    return "Worth a shot, but go in with your eyes open. Confirm who the employer is and read your message before you send it.";
  }

  // Apply
  if (hasGaps) {
    return "Looks solid. Tie off the few open details below, then send your application.";
  }
  return "Go for it. Send a short, specific application using the message below while it's fresh.";
}
