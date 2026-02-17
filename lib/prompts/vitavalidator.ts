/**
 * VitaValidator prompts (portfolio / abstracted)
 *
 * System and user prompts for the validation API. Real instructions and
 * scoring logic are not included in this repository.
 *
 * @module lib/prompts/vitavalidator
 */

/** Placeholder system prompt. Production prompt is not in this repo. */
export const VITAVALIDATOR_SYSTEM_PROMPT =
  "You are an analysis assistant. Analyze the startup idea and respond with valid JSON only. Do not include any text outside the JSON.";

/**
 * Builds the user prompt with the idea description.
 * @param description - User-provided startup idea description
 */
export const VITAVALIDATOR_USER_PROMPT = (description: string) =>
  `Analyze the following startup idea and respond with valid JSON only.\n\n"${description}"`;
