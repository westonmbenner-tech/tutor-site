import OpenAI from "openai";
import type {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import type { HomeworkAiGrading, HomeworkAiQuestionResult } from "@/lib/types";

const MAX_URL_CONTENT_CHARS = 12000;
const GRADING_MODEL = "gpt-4o-mini";

export interface GradeHomeworkInput {
  homeworkTitle: string;
  homeworkDescription: string | null;
  studentSubmission: string;
  sourceType: "image" | "url";
  sourceLabel: string;
  questionUrl?: string;
  questionImages?: { mimeType: string; base64: string; name: string }[];
}

interface AiGradingResponse {
  overall_summary: string;
  questions: HomeworkAiQuestionResult[];
  missed_questions_summary: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchQuestionSourceText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "TutorCheckHomeworkGrader/1.0",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Could not fetch question link (${response.status}).`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    const body = await response.text();

    if (contentType.includes("text/html")) {
      const text = stripHtml(body);
      return text.slice(0, MAX_URL_CONTENT_CHARS);
    }

    return body.slice(0, MAX_URL_CONTENT_CHARS);
  } finally {
    clearTimeout(timeout);
  }
}

function buildSystemPrompt(): string {
  return `You grade student homework for a tutoring portal.
Use the provided question source and the student's submission.
For each question you can identify:
- Extract or restate the question
- Match the student's answer from their submission
- Mark correct true/false
- Give concise feedback; for incorrect answers explain why

Return JSON with keys:
- overall_summary (string): brief overview of performance
- questions (array): { question_number, question_text, student_answer, correct, feedback }
- missed_questions_summary (string): summary of every missed question and why the student was wrong

If the student submission does not address a question, set student_answer to null and correct to false.
Be fair, specific, and professional.`;
}

function buildUserText(input: GradeHomeworkInput, questionSourceText?: string): string {
  return JSON.stringify(
    {
      assignment_title: input.homeworkTitle,
      assignment_description: input.homeworkDescription,
      student_submission: input.studentSubmission,
      question_source_type: input.sourceType,
      question_source_label: input.sourceLabel,
      question_source_url: input.questionUrl ?? null,
      question_source_text: questionSourceText ?? null,
    },
    null,
    2
  );
}

function parseAiGradingResponse(content: string): AiGradingResponse {
  const parsed = JSON.parse(content) as Partial<AiGradingResponse>;

  if (typeof parsed.overall_summary !== "string") {
    throw new Error("AI response missing overall_summary.");
  }

  if (typeof parsed.missed_questions_summary !== "string") {
    throw new Error("AI response missing missed_questions_summary.");
  }

  const questions = Array.isArray(parsed.questions)
    ? parsed.questions
        .map((question, index) => {
          if (!question || typeof question !== "object") return null;

          const row = question as unknown as Record<string, unknown>;
          const questionNumber =
            typeof row.question_number === "number"
              ? row.question_number
              : index + 1;

          if (typeof row.question_text !== "string") return null;
          if (typeof row.correct !== "boolean") return null;
          if (typeof row.feedback !== "string") return null;

          return {
            question_number: questionNumber,
            question_text: row.question_text,
            student_answer:
              typeof row.student_answer === "string"
                ? row.student_answer
                : null,
            correct: row.correct,
            feedback: row.feedback,
          } satisfies HomeworkAiQuestionResult;
        })
        .filter((question): question is HomeworkAiQuestionResult =>
          Boolean(question)
        )
    : [];

  return {
    overall_summary: parsed.overall_summary,
    questions,
    missed_questions_summary: parsed.missed_questions_summary,
  };
}

export async function gradeHomeworkWithAi(
  input: GradeHomeworkInput
): Promise<Omit<HomeworkAiGrading, "id" | "created_at" | "created_by">> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured.");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let questionSourceText: string | undefined;

  if (input.sourceType === "url") {
    if (!input.questionUrl) {
      throw new Error("Question URL is required.");
    }

    try {
      questionSourceText = await fetchQuestionSourceText(input.questionUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not fetch question URL.";
      questionSourceText = `Question link could not be fetched automatically (${message}). Use the URL context if present in the assignment description. URL: ${input.questionUrl}`;
    }
  }

  const userContent: ChatCompletionContentPart[] = [
    {
      type: "text",
      text: buildUserText(input, questionSourceText),
    },
  ];

  if (input.sourceType === "image" && input.questionImages?.length) {
    for (const image of input.questionImages) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${image.mimeType};base64,${image.base64}`,
        },
      });
    }
  }

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt() },
    { role: "user", content: userContent },
  ];

  const completion = await openai.chat.completions.create({
    model: GRADING_MODEL,
    response_format: { type: "json_object" },
    messages,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty AI response.");
  }

  const parsed = parseAiGradingResponse(content);

  return {
    submission_snapshot: input.studentSubmission,
    source_type: input.sourceType,
    source_label: input.sourceLabel,
    overall_summary: parsed.overall_summary,
    questions: parsed.questions,
    missed_questions_summary: parsed.missed_questions_summary,
  };
}
