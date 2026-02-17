/**
 * VitaCoach agent prompts (portfolio / abstracted)
 *
 * System prompts for the multi-agent coaching API. Real instructions,
 * roles, and protocols are not included in this repository.
 *
 * @module lib/prompts/vitacoach
 */

const AGENT_BASE =
  "You are an assistant. Stay within the topic. Respond concisely. End with one clear next action or question.";

export const ORCHESTRATOR_SYSTEM_PROMPT = `${AGENT_BASE}

Context: {startup_name} | Stage: {startup_stage} | Score: {last_validation_score}/100
OKRs: {current_okrs}`;

export const VALIDATION_AGENT_SYSTEM_PROMPT = AGENT_BASE;
export const TECHNICAL_AGENT_SYSTEM_PROMPT = AGENT_BASE;
export const MARKET_AGENT_SYSTEM_PROMPT = AGENT_BASE;
export const SALES_AGENT_SYSTEM_PROMPT = AGENT_BASE;
export const FINANCE_AGENT_SYSTEM_PROMPT = AGENT_BASE;
export const PROGRESS_AGENT_SYSTEM_PROMPT = AGENT_BASE;
