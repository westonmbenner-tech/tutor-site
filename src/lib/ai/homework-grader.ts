import OpenAI from "openai";
import type {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import type { HomeworkAiGrading, HomeworkAiQuestionResult } from "@/lib/types";

const MAX_URL_CONTENT_CHARS = 50000;
const MAX_QUESTION_TEXT_CHARS = 50000;
const GRADING_MODEL = "gpt-4o-mini";
const GRADING_BATCH_SIZE = 8;
const MAX_COMPLETION_TOKENS = 16000;

export interface GradeHomeworkInput {
  homeworkTitle: string;
  homeworkDescription: string | null;
  studentSubmission: string;
  sourceType: "image" | "url" | "text";
  sourceLabel: string;
  questionUrl?: string;
  questionText?: string;
  questionImages?: { mimeType: string; base64: string; name: string }[];
}

interface ExtractedQuestion {
  question_number: number;
  question_text: string;
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
  const timeout = setTimeout(() => controller.abort(), 15000);

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

function buildQuestionSourceParts(
  input: GradeHomeworkInput,
  questionSourceText?: string
): ChatCompletionContentPart[] {
  const parts: ChatCompletionContentPart[] = [
    {
      type: "text",
      text: [
        "=== QUESTION SOURCE (authoritative) ===",
        "Extract and grade questions ONLY from this section.",
        "Never treat the student submission as the question list.",
        "",
        `Assignment title: ${input.homeworkTitle}`,
        input.homeworkDescription
          ? `Assignment description: ${input.homeworkDescription}`
          : null,
        input.questionUrl ? `Source URL: ${input.questionUrl}` : null,
        questionSourceText
          ? `Source text:\n${questionSourceText}`
          : input.sourceType === "image"
            ? "Source: see attached question image(s) below."
            : null,
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];

  if (input.sourceType === "image" && input.questionImages?.length) {
    for (const image of input.questionImages) {
      parts.push({
        type: "image_url",
        image_url: {
          url: `data:${image.mimeType};base64,${image.base64}`,
        },
      });
    }
  }

  return parts;
}

function buildStudentSubmissionText(studentSubmission: string): string {
  return [
    "=== STUDENT SUBMISSION (answers only) ===",
    "Use this ONLY to find student_answer values.",
    "Never copy submission text into question_text.",
    "",
    studentSubmission,
  ].join("\n");
}

function extractionSystemPrompt(): string {
  return `You extract every homework question from the QUESTION SOURCE provided.
The student submission is NOT included in this step.

Rules:
- List every distinct question in order (numbered or unnumbered).
- question_text must come from the question source only — worksheet, link, or images.
- Do not stop after 10 questions. Extract ALL questions visible in the source.
- Restate each question clearly; include given values, diagrams described in text, etc.
- If a question has sub-parts (a, b, c), treat each sub-part as its own entry with labels like "3a", "3b" in question_text.

Return JSON:
{ "questions": [ { "question_number": 1, "question_text": "..." }, ... ] }`;
}

function gradingSystemPrompt(): string {
  return `You grade a batch of homework questions for a tutoring portal.

You receive:
1. An authoritative list of questions (question_number + question_text) from the worksheet.
2. The student's submission (answers only).

Rules:
- question_text in your output must match the provided question list — do not rewrite from the submission.
- student_answer must come from the student submission only (final answer per question).
- Mark correct when mathematically equivalent (e.g. "10 root 2" = "10√2" = "10*sqrt(2)").
- Use the student's FINAL answer, not crossed-out work.
- If unanswered: student_answer null, correct false.

Return JSON:
{ "questions": [ { "question_number", "question_text", "student_answer", "correct", "feedback" }, ... ] }
Include one entry per question in this batch, in order.`;
}

function parseExtractedQuestions(content: string): ExtractedQuestion[] {
  const parsed = JSON.parse(content) as { questions?: unknown };
  if (!Array.isArray(parsed.questions)) return [];

  return parsed.questions
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const questionNumber =
        typeof row.question_number === "number" ? row.question_number : index + 1;
      if (typeof row.question_text !== "string" || !row.question_text.trim()) {
        return null;
      }
      return {
        question_number: questionNumber,
        question_text: row.question_text.trim(),
      };
    })
    .filter((q): q is ExtractedQuestion => Boolean(q))
    .sort((a, b) => a.question_number - b.question_number);
}

function parseGradedBatch(
  content: string,
  expectedQuestions: ExtractedQuestion[]
): HomeworkAiQuestionResult[] {
  const parsed = JSON.parse(content) as { questions?: unknown };
  const raw = Array.isArray(parsed.questions) ? parsed.questions : [];

  return expectedQuestions.map((expected, index) => {
    const entry = raw[index];
    const row =
      entry && typeof entry === "object"
        ? (entry as Record<string, unknown>)
        : null;

    const studentAnswer =
      typeof row?.student_answer === "string" ? row.student_answer : null;
    const correct = typeof row?.correct === "boolean" ? row.correct : false;
    const feedback =
      typeof row?.feedback === "string"
        ? row.feedback
        : correct
          ? "Correct."
          : "Incorrect or not found in submission.";

    return {
      question_number: expected.question_number,
      question_text: expected.question_text,
      student_answer: studentAnswer,
      correct,
      feedback,
    };
  });
}

function buildSummaries(
  questions: HomeworkAiQuestionResult[]
): Pick<AiGradingResponse, "overall_summary" | "missed_questions_summary"> {
  const correctCount = questions.filter((q) => q.correct).length;
  const missed = questions.filter((q) => !q.correct);

  return {
    overall_summary: `Scored ${correctCount} of ${questions.length} question${questions.length === 1 ? "" : "s"} correctly.`,
    missed_questions_summary:
      missed.length === 0
        ? "No missed questions."
        : missed
            .map(
              (q) =>
                `Question ${q.question_number}: ${q.feedback}${
                  q.student_answer ? ` (answered: ${q.student_answer})` : " (no answer found)"
                }`
            )
            .join("\n\n"),
  };
}

function chunkQuestions<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function callOpenAiJson(
  openai: OpenAI,
  messages: ChatCompletionMessageParam[]
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: GRADING_MODEL,
    response_format: { type: "json_object" },
    max_completion_tokens: MAX_COMPLETION_TOKENS,
    messages,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty AI response.");
  }
  return content;
}

async function extractQuestionsFromSource(
  openai: OpenAI,
  input: GradeHomeworkInput,
  questionSourceText?: string
): Promise<ExtractedQuestion[]> {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: extractionSystemPrompt() },
    {
      role: "user",
      content: buildQuestionSourceParts(input, questionSourceText),
    },
  ];

  const content = await callOpenAiJson(openai, messages);
  return parseExtractedQuestions(content);
}

async function gradeQuestionBatch(
  openai: OpenAI,
  batch: ExtractedQuestion[],
  studentSubmission: string
): Promise<HomeworkAiQuestionResult[]> {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: gradingSystemPrompt() },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: [
            "=== QUESTIONS TO GRADE (from worksheet — do not replace with submission text) ===",
            JSON.stringify({ questions: batch }, null, 2),
            "",
            buildStudentSubmissionText(studentSubmission),
          ].join("\n"),
        },
      ],
    },
  ];

  const content = await callOpenAiJson(openai, messages);
  return parseGradedBatch(content, batch);
}

function legacySystemPrompt(): string {
  return `You grade student homework for a tutoring portal.

CRITICAL — separate question source from student submission:
- question_text must ALWAYS come from the question source (worksheet, link, or images).
- student_answer must ALWAYS come from the student submission.
- NEVER put student submission text into question_text.
- If you run out of questions in the source, stop — do not invent questions from the submission.

IMPORTANT — grade every question:
- Return one result per question in the source. Do not stop after 10.
- If unanswered: student_answer null, correct false.

IMPORTANT — use the final answer only:
- Judge correct true/false only against the student's final committed answer.

IMPORTANT — accept equivalent answers:
- Mark correct when mathematically equivalent (e.g. "10 root 2" = "10√2").

Return JSON with keys: overall_summary, questions, missed_questions_summary`;
}

function parseLegacyGradingResponse(content: string): AiGradingResponse {
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

async function gradeHomeworkLegacy(
  openai: OpenAI,
  input: GradeHomeworkInput,
  questionSourceText?: string
): Promise<Omit<HomeworkAiGrading, "id" | "created_at" | "created_by">> {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: legacySystemPrompt() },
    {
      role: "user",
      content: [
        ...buildQuestionSourceParts(input, questionSourceText),
        {
          type: "text",
          text: buildStudentSubmissionText(input.studentSubmission),
        },
      ],
    },
  ];

  const content = await callOpenAiJson(openai, messages);
  const parsed = parseLegacyGradingResponse(content);

  return {
    submission_snapshot: input.studentSubmission,
    source_type: input.sourceType,
    source_label: input.sourceLabel,
    overall_summary: parsed.overall_summary,
    questions: parsed.questions,
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
  } else if (input.sourceType === "text") {
    if (!input.questionText?.trim()) {
      throw new Error("Question text is required.");
    }
    questionSourceText = input.questionText.trim().slice(0, MAX_QUESTION_TEXT_CHARS);
  }

  const extracted = await extractQuestionsFromSource(
    openai,
    input,
    questionSourceText
  );

  if (extracted.length === 0) {
    return gradeHomeworkLegacy(openai, input, questionSourceText);
  }

  const batches = chunkQuestions(extracted, GRADING_BATCH_SIZE);
  const gradedQuestions: HomeworkAiQuestionResult[] = [];

  for (const batch of batches) {
    const batchResults = await gradeQuestionBatch(
      openai,
      batch,
      input.studentSubmission
    );
    gradedQuestions.push(...batchResults);
  }

  const summaries = buildSummaries(gradedQuestions);

  return {
    submission_snapshot: input.studentSubmission,
    source_type: input.sourceType,
    source_label: input.sourceLabel,
    overall_summary: summaries.overall_summary,
    questions: gradedQuestions,
    missed_questions_summary: summaries.missed_questions_summary,
  };
}
