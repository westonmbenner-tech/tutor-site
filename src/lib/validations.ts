import { z } from "zod";

export const studyLogSchema = z
  .object({
    log_date: z.string().min(1),
    questions_completed: z.coerce.number().int().min(0),
    questions_correct: z.coerce.number().int().min(0),
    questions_wrong: z.coerce.number().int().min(0),
    topic: z.string().optional(),
    confidence: z.coerce.number().int().min(1).max(5).optional().nullable(),
    errors_lessons_learned: z.string().optional(),
    miscellaneous_notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const correct =
        data.questions_correct ||
        (data.questions_completed - data.questions_wrong);
      return correct + data.questions_wrong <= data.questions_completed;
    },
    { message: "Correct + wrong cannot exceed completed." }
  );

export const mistakeSchema = z.object({
  mistake_date: z.string().min(1),
  question_prompt: z.string().optional(),
  topic: z.string().optional(),
  mistake_label_id: z.string().uuid().optional().nullable(),
  new_label_name: z.string().optional(),
  explanation: z.string().optional(),
  lesson_learned: z.string().optional(),
  study_log_id: z.string().uuid().optional().nullable(),
});

export const homeworkSchema = z.object({
  student_id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  due_date: z.string().optional().nullable(),
  links: z.string().optional(),
  attachments: z.string().optional(),
});

export const commentSchema = z.object({
  student_id: z.string().uuid(),
  study_log_id: z.string().uuid().optional().nullable(),
  comment: z.string().min(1),
  visible_to_student: z.coerce.boolean(),
  visible_to_parent: z.coerce.boolean(),
});

export const streakFreezeSchema = z.object({
  student_id: z.string().uuid(),
  freeze_date: z.string().min(1),
  reason: z.string().optional(),
});

export const studentSchema = z.object({
  profile_email: z.string().email().optional().or(z.literal("")),
  display_name: z.string().min(1),
  profile_id: z.string().uuid().optional().nullable(),
});

export const parentLinkSchema = z.object({
  parent_id: z.string().uuid(),
  student_id: z.string().uuid(),
});

export const aiSummaryRequestSchema = z.object({
  student_id: z.string().uuid(),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
});
