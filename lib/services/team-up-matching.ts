/**
 * Team-Up Compatibility (Portfolio / Abstracted)
 *
 * Used by GET /api/team-up/match to rank suggested profiles. Scoring and
 * ranking logic are proprietary; this module exposes only the API contract.
 *
 * @module lib/services/team-up-matching
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TeamUpProfile = any;

export interface CompatibilityResult {
  compatibilityScore: number;
  compatibilityLevel: "high" | "medium" | "low";
}

/**
 * Returns a compatibility score and level for ranking. Stub implementation;
 * production logic is not included in this repo.
 */
export function computeCompatibility(
  _profile: TeamUpProfile,
  _candidate: TeamUpProfile
): CompatibilityResult {
  return {
    compatibilityScore: 0,
    compatibilityLevel: "medium",
  };
}
