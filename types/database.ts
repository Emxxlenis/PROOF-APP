export type UserRole = "student" | "mentor" | "admin";

export type StartupStage = "ideation" | "validation" | "mvp" | "first_sale" | "growth";

export type AgentType =
  | "orchestrator"
  | "validation"
  | "technical"
  | "market"
  | "sales"
  | "finance"
  | "progress";

export type KRStatus = "not_started" | "in_progress" | "completed";

export type MilestoneType =
  | "first_validation"
  | "mvp_launched"
  | "first_user"
  | "first_sale"
  | "1k_mrr";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  cohort_id: string | null;
  created_at: string;
  last_login: string | null;
}

export interface Startup {
  id: string;
  student_id: string;
  name: string;
  description: string;
  category: string | null;
  stage: StartupStage;
  logo_url: string | null;
  cover_image_url: string | null;
  visibility: "private" | "public";
  last_activity: string | null;
  problem: string | null;
  solution: string | null;
  target_audience: string | null;
  business_model: string | null;
  competitive_advantage: string | null;
  market_opportunity: string | null;
  additional_context: string | null;
  improvements: string | null;
  brainstorm_ideas: string[] | null;
  created_at: string;
}

export interface Validation {
  id: string;
  startup_id: string;
  viability_score: number;
  technical_score: number;
  market_score: number;
  competition_score: number;
  business_model_score: number;
  context_score: number;
  strengths: Record<string, any>;
  risks: Record<string, any>;
  recommendations: Record<string, any>;
  created_at: string;
}

export interface CoachInteraction {
  id: string;
  student_id: string;
  agent_type: AgentType;
  query: string;
  response: string;
  tokens_used: number | null;
  created_at: string;
}

export interface OKR {
  id: string;
  startup_id: string;
  week_number: number;
  objective: string;
  key_result_1: string;
  kr1_status: KRStatus;
  kr1_deadline?: string | null;
  key_result_2: string;
  kr2_status: KRStatus;
  kr2_deadline?: string | null;
  key_result_3: string;
  kr3_status: KRStatus;
  kr3_deadline?: string | null;
  created_at: string;
}

export interface OKREvidence {
  id: string;
  okr_id: string;
  key_result_number: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  description: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
}

export interface CoachChatFile {
  id: string;
  interaction_id: string | null;
  student_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  description: string | null;
  uploaded_at: string;
}

export interface ProgressLog {
  id: string;
  student_id: string;
  milestone_type: MilestoneType;
  milestone_date: string;
  notes: string | null;
}

export interface Achievement {
  id: string;
  student_id: string;
  achievement_type: string;
  unlocked_at: string;
}
