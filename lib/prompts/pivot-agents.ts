/**
 * Pivot Engine agent prompts (portfolio / abstracted)
 *
 * System prompts for the pivot analysis multi-agent pipeline.
 * Real instructions and JSON schemas are not in this repository.
 * Template variables are kept so route .replace() calls still work.
 *
 * @module lib/prompts/pivot-agents
 */

/** Placeholder. Production prompt not in repo. Template vars used by route. */
export const marketAgentPivotPrompt = `Analyze markets. Startup: {startup_name} {startup_description} {startup_problem} {startup_solution} {startup_target_audience} {startup_business_model} {startup_competitive_advantage} {startup_market_opportunity}. Situation: {current_market} {current_users} {current_traction} {problems}. Evaluate: {alternative_markets}. Respond only valid JSON.`;

/** Placeholder. Production prompt not in repo. Template vars used by route. */
export const technicalAgentPivotPrompt = `Evaluate technical feasibility. Startup: {startup_name} {startup_description} {startup_problem} {startup_solution} {startup_competitive_advantage}. Stack: {tech_stack} MVP: {mvp_description} debt: {tech_debt} team: {team_size}. Options: {pivot_options}. Respond only valid JSON.`;

/** Placeholder. Production prompt not in repo. Template vars used by route. */
export const financeAgentPivotPrompt = `Project financial impact. Startup: {startup_name} {startup_description} {startup_problem} {startup_solution} {startup_business_model} {startup_target_audience}. Finances: {actual_cac} {actual_ltv} {burn_rate} {runway} {available_budget}. Options: {pivot_options}. Respond only valid JSON.`;

/** Placeholder. Production prompt not in repo. Template vars used by route. */
export const validationAgentPivotPrompt = `Design validation plan. Startup: {startup_name} {startup_description} {startup_problem} {startup_solution} {startup_target_audience} {startup_business_model}. Pivot: {pivot_option} market: {target_market}. Respond only valid JSON.`;

/** Placeholder. Production prompt not in repo. Template vars used by route. */
export const orchestratorPivotPrompt = `Synthesize into one recommendation. Startup: {startup_name} {startup_description} {startup_problem} {startup_solution} {startup_target_audience} {startup_business_model} {startup_competitive_advantage} {startup_market_opportunity}. Analyses: {market_analysis} {technical_analysis} {finance_analysis} {validation_analysis}. Respond only valid JSON.`;
