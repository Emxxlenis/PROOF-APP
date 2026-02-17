/**
 * Mentor communication prompts (portfolio / abstracted)
 *
 * Prompts for re-engagement emails and mentor recommendations.
 * Real instructions and output schemas are not in this repository.
 *
 * @module lib/prompts/mentor-email
 */

export interface InactivityEmailContext {
  studentName: string;
  startupName: string;
  startupDescription: string;
  lastActivity: string;
  daysInactive: number;
  lastConversation?: string;
  recentProgress?: string;
}

/**
 * Builds prompt for re-engagement email. Production prompt not in repo.
 */
export const INACTIVITY_EMAIL_PROMPT = (context: InactivityEmailContext): string =>
  `Write a short re-engagement email. Context: ${context.studentName}, ${context.startupName}, ${context.startupDescription}. Last activity: ${context.lastActivity}. Days inactive: ${context.daysInactive}. Respond with HTML content only.`;

export interface MentorRecommendationsContext {
  studentName: string;
  startupName: string;
  startupStage: string;
  lastValidationScore?: number;
  recentOKRs?: string;
  currentChallenges?: string[];
}

/**
 * Builds prompt for mentor recommendations. Production prompt not in repo.
 */
export const MENTOR_RECOMMENDATIONS_PROMPT = (context: MentorRecommendationsContext): string =>
  `Generate 3 short recommendations for a mentor. Context: ${context.studentName}, ${context.startupName}, stage ${context.startupStage}. Respond with valid JSON only.`;
