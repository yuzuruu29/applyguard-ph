// stats.js — derive tracker statistics from the jobs array.
// Pure function — no React, no DOM, no storage.

import { todayLocalISO } from "./followups.js";

/**
 * Returns counts and score stats derived from the full jobs list.
 *
 * @param {object[]} jobs - array of tracker job objects
 * @returns {{
 *   total: number,
 *   saved: number,
 *   applied: number,
 *   interview: number,
 *   offer: number,
 *   closed: number,
 *   highRiskDodged: number,
 *   overdueFollowUps: number,
 *   bestScore: number | null,
 *   avgScore: number | null,
 * }}
 */
export function trackerStats(jobs) {
  const list = Array.isArray(jobs) ? jobs : [];

  let saved = 0;
  let applied = 0;
  let interview = 0;
  let offer = 0;
  let closed = 0;
  let highRiskDodged = 0;
  let overdueFollowUps = 0;
  let bestScore = null;
  let scoreSum = 0;
  let scoreCount = 0;

  const today = todayLocalISO();

  for (const job of list) {
    if (!job || typeof job !== "object") continue;

    const status = job.status;

    // ── status tallies ──────────────────────────────────────────────────
    if (status === "Saved") saved++;
    else if (status === "Applied") applied++;
    else if (status === "Interview") interview++;
    else if (status === "Offer") offer++;
    else if (status === "Closed") closed++;

    // ── high-risk dodged ────────────────────────────────────────────────
    // "Applied" or "Offer" + riskLevel "High"
    if (
      job.riskLevel === "High" &&
      (status === "Applied" || status === "Offer")
    ) {
      highRiskDodged++;
    }

    // ── overdue follow-ups ──────────────────────────────────────────────
    // followUpBy < today AND status !== "Closed"
    if (status !== "Closed") {
      const due =
        typeof job.followUpBy === "string" ? job.followUpBy.trim() : "";
      if (due && due < today) {
        overdueFollowUps++;
      }
    }

    // ── score tracking ──────────────────────────────────────────────────
    if (typeof job.score === "number" && !Number.isNaN(job.score)) {
      if (bestScore === null || job.score > bestScore) {
        bestScore = job.score;
      }
      scoreSum += job.score;
      scoreCount++;
    }
  }

  const total = list.filter((j) => j && typeof j === "object").length;
  const avgScore =
    scoreCount > 0 ? Math.round(scoreSum / scoreCount) : null;

  return {
    total,
    saved,
    applied,
    interview,
    offer,
    closed,
    highRiskDodged,
    overdueFollowUps,
    bestScore,
    avgScore,
  };
}
