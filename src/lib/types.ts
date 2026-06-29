export type UserRole = "admin" | "student" | "parent";

export type HomeworkStatus = "assigned" | "completed" | "late" | "missing";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  requested_role: SignupRole | null;
  login_history: string[];
  created_at: string;
}

export type SignupRole = Extract<UserRole, "student" | "parent">;

export interface Student {
  id: string;
  profile_id: string | null;
  display_name: string;
  active: boolean;
  streak_freeze_balance: number;
  created_at: string;
}

export interface Parent {
  id: string;
  profile_id: string | null;
  display_name: string;
  created_at: string;
}

export interface ParentStudentLink {
  id: string;
  parent_id: string;
  student_id: string;
  created_at: string;
}

export interface HomeworkAiQuestionResult {
  question_number: number;
  question_text: string;
  student_answer: string | null;
  correct: boolean;
  feedback: string;
}

export interface HomeworkAiGrading {
  id: string;
  created_at: string;
  created_by: string | null;
  submission_snapshot: string | null;
  source_type: "image" | "url" | "text";
  source_label: string;
  overall_summary: string;
  questions: HomeworkAiQuestionResult[];
  missed_questions_summary: string;
}

export interface HomeworkMasteryQuestion {
  question_number: number;
  question_text: string;
  question_type: "conceptual" | "calculation";
}

export interface HomeworkMasteryAnswer {
  question_number: number;
  student_answer: string;
  correct: boolean;
  feedback: string;
}

export interface HomeworkMasterySession {
  status: "not_started" | "in_progress" | "completed";
  questions: HomeworkMasteryQuestion[];
  answers: HomeworkMasteryAnswer[];
  score_percent: number | null;
  passed: boolean;
  pass_threshold: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface HomeworkAssignment {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  description_format: "plain" | "latex";
  due_date: string | null;
  status: HomeworkStatus;
  links: { url: string; label?: string }[];
  attachments: { name: string; url?: string }[];
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
  submission_text: string | null;
  ai_gradings: HomeworkAiGrading[];
  mandate_ai_mastery: boolean;
  mastery_source_type: "text" | "url" | null;
  mastery_source_text: string | null;
  mastery_source_url: string | null;
  mastery_session: HomeworkMasterySession | null;
}

export interface StudyLog {
  id: string;
  student_id: string;
  log_date: string;
  questions_completed: number;
  questions_correct: number;
  questions_wrong: number;
  topic: string | null;
  confidence: number | null;
  errors_lessons_learned: string | null;
  miscellaneous_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MistakeLabel {
  id: string;
  student_id: string;
  name: string;
  created_at: string;
}

export interface Mistake {
  id: string;
  student_id: string;
  study_log_id: string | null;
  mistake_date: string;
  question_prompt: string | null;
  topic: string | null;
  mistake_label_id: string | null;
  explanation: string | null;
  lesson_learned: string | null;
  created_at: string;
  updated_at: string;
  mistake_labels?: MistakeLabel | null;
}

export interface TutorComment {
  id: string;
  student_id: string;
  study_log_id: string | null;
  homework_assignment_id: string | null;
  parent_comment_id: string | null;
  author_id: string;
  comment: string;
  visible_to_student: boolean;
  visible_to_parent: boolean;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "role"> | null;
}

export interface WeakArea {
  area: string;
  evidence: string;
  priority: "high" | "medium" | "low";
}

export interface GroupedCategory {
  category: string;
  mistake_count: number;
  examples: string[];
  suggestion: string;
}

export interface AIMistakeSummary {
  id: string;
  student_id: string;
  generated_for_start_date: string;
  generated_for_end_date: string;
  summary: string | null;
  weak_areas: WeakArea[];
  grouped_categories: GroupedCategory[];
  suggested_next_steps: string | null;
  created_at: string;
}

export interface StreakFreeze {
  id: string;
  student_id: string;
  freeze_date: string;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface WeeklyProgress {
  weekStart: string;
  weekEnd: string;
  studyLogDays: number;
  homeworkDays: number;
  activityDays: number;
  freezeDays: number;
  effectiveDays: number;
  targetDays: number;
  isSuccessful: boolean;
}

export interface StudentAnalytics {
  totalQuestionsCompleted: number;
  totalQuestionsWrong: number;
  accuracyPercent: number | null;
  avgConfidence: number | null;
  commonLabels: { name: string; count: number }[];
}

export interface AttentionFlag {
  type: "no_log" | "overdue_homework" | "low_confidence" | "declining_accuracy";
  message: string;
}

export interface Message {
  id: string;
  student_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "role"> | null;
}
