import OpenAI from "openai";
import { fetchQuestionSourceText } from "@/lib/ai/homework-grader";
import {
  MASTERY_MAX_QUESTIONS,
  MASTERY_MIN_QUESTIONS,
} from "@/lib/homework-mastery";
import type { HomeworkMasteryQuestion } from "@/lib/types";

const MASTERY_MODEL = "gpt-4o-mini";
const MAX_SOURCE_CHARS = 50000;
const MAX_COMPLETION_TOKENS = 12000;

export async function resolveMasterySourceText(input: {
  mastery_source_type: "text" | "url" | null;
  mastery_source_text: string | null;
  mastery_source_url: string | null;
}): Promise<string> {
  if (input.mastery_source_type === "text") {
    const text = input.mastery_source_text?.trim();
    if (!text) {
      throw new Error("Mastery study material text is missing.");
    }
    return text.slice(0, MAX_SOURCE_CHARS);
  }

  if (input.mastery_source_type === "url") {
    const url = input.mastery_source_url?.trim();
    if (!url) {
      throw new Error("Mastery study material URL is missing.");
    }
    return fetchQuestionSourceText(url);
  }

  throw new Error("Mastery study material is not configured.");
}

async function callOpenAiJson(messages: OpenAI.Chat.ChatCompletionMessageParam[]) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured.");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: MASTERY_MODEL,
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

export async function generateMasteryQuestions(
  sourceText: string
): Promise<HomeworkMasteryQuestion[]> {
  const content = await callOpenAiJson([
    {
      role: "system",
      content: `You create mastery-check questions for a tutoring homework gate.
Read the study material and write ${MASTERY_MIN_QUESTIONS} to ${MASTERY_MAX_QUESTIONS} questions.
Mix conceptual understanding and calculation/problem-solving questions.
Questions must be answerable from the material without outside resources.
Number questions 1..N in order.

Return JSON:
{ "questions": [ { "question_number": 1, "question_text": "...", "question_type": "conceptual" | "calculation" }, ... ] }`,
    },
    {
      role: "user",
      content: sourceText,
    },
  ]);

  const parsed = JSON.parse(content) as { questions?: unknown };
  if (!Array.isArray(parsed.questions)) {
    throw new Error("AI response missing questions.");
  }

  const questions = parsed.questions
    .map((entry, index): HomeworkMasteryQuestion | null => {
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
        question_type:
          row.question_type === "calculation" ? "calculation" : "conceptual",
      };
    })
    .filter((q): q is HomeworkMasteryQuestion => Boolean(q))
    .sort((a, b) => a.question_number - b.question_number);

  if (questions.length < MASTERY_MIN_QUESTIONS) {
    throw new Error("Could not generate enough mastery questions.");
  }

  return questions.slice(0, MASTERY_MAX_QUESTIONS);
}

export async function gradeMasteryAnswer(input: {
  sourceText: string;
  question: HomeworkMasteryQuestion;
  studentAnswer: string;
}): Promise<{ correct: boolean; feedback: string }> {
  const content = await callOpenAiJson([
    {
      role: "system",
      content: `You grade one mastery-check answer for a student homework gate.
Use the study material as the authority.
Accept equivalent correct answers (different notation, simplified forms, words vs symbols).
Be encouraging but accurate. Keep feedback to 1-3 sentences.

Return JSON: { "correct": boolean, "feedback": string }`,
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          study_material_excerpt: input.sourceText.slice(0, 12000),
          question_number: input.question.question_number,
          question_text: input.question.question_text,
          question_type: input.question.question_type,
          student_answer: input.studentAnswer,
        },
        null,
        2
      ),
    },
  ]);

  const parsed = JSON.parse(content) as {
    correct?: boolean;
    feedback?: string;
  };

  if (typeof parsed.correct !== "boolean") {
    throw new Error("AI response missing correct flag.");
  }

  return {
    correct: parsed.correct,
    feedback:
      typeof parsed.feedback === "string" && parsed.feedback.trim()
        ? parsed.feedback.trim()
        : parsed.correct
          ? "Correct."
          : "Not quite — review the material and try again on your next attempt.",
  };
}
