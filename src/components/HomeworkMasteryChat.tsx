"use client";

import { useEffect, useState } from "react";
import type { HomeworkMasterySession } from "@/lib/types";

type ChatMessage =
  | { role: "tutor"; text: string }
  | { role: "student"; text: string }
  | { role: "feedback"; text: string; correct: boolean };

function buildMessages(session: HomeworkMasterySession | null): ChatMessage[] {
  if (!session) return [];

  const messages: ChatMessage[] = [];

  for (const question of session.questions) {
    messages.push({
      role: "tutor",
      text: `Question ${question.question_number} (${question.question_type}): ${question.question_text}`,
    });

    const answer = session.answers.find(
      (entry) => entry.question_number === question.question_number
    );

    if (answer) {
      messages.push({ role: "student", text: answer.student_answer });
      messages.push({
        role: "feedback",
        text: answer.feedback,
        correct: answer.correct,
      });
    }
  }

  return messages;
}

function needsNewSession(session: HomeworkMasterySession | null): boolean {
  if (!session) return true;
  if (session.passed) return false;
  if (session.status === "completed" && !session.passed) return true;
  if (session.questions.length === 0) return true;
  return false;
}

function canResumeSession(session: HomeworkMasterySession | null): boolean {
  if (!session || session.passed) return false;
  if (session.status !== "in_progress") return false;
  return session.answers.length < session.questions.length;
}

export function HomeworkMasteryChat({
  homeworkId,
  homeworkTitle,
  initialSession,
  onPassed,
}: {
  homeworkId: string;
  homeworkTitle: string;
  initialSession: HomeworkMasterySession | null;
  onPassed: () => void;
}) {
  const [session, setSession] = useState<HomeworkMasterySession | null>(
    initialSession
  );
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const messages = buildMessages(session);
  const totalQuestions = session?.questions.length ?? 0;
  const answeredCount = session?.answers.length ?? 0;
  const currentQuestion =
    session && answeredCount < totalQuestions
      ? session.questions[answeredCount]
      : null;
  const complete = session?.status === "completed";
  const passed = session?.passed === true;

  useEffect(() => {
    if (passed) {
      onPassed();
    }
  }, [passed, onPassed]);

  async function startSession(retry = false) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/homework-mastery/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homework_id: homeworkId, retry }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Could not start mastery check.");
      }
      setSession(data.session);
      if (data.passed) {
        onPassed();
      }
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : "Could not start mastery check."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (bootstrapped || passed) return;

    if (canResumeSession(initialSession)) {
      setSession(initialSession);
      setBootstrapped(true);
      return;
    }

    if (needsNewSession(initialSession)) {
      setBootstrapped(true);
      void startSession(
        Boolean(initialSession?.status === "completed" && !initialSession.passed)
      );
    } else {
      setBootstrapped(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped, passed, homeworkId]);

  async function submitAnswer(event: React.FormEvent) {
    event.preventDefault();
    if (!answer.trim() || loading || complete) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/homework-mastery/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homework_id: homeworkId, answer: answer.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Could not submit answer.");
      }
      setSession(data.session);
      setAnswer("");
      if (data.passed) {
        onPassed();
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit answer."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-4 rounded-xl border border-[var(--color-border)] bg-white p-4 sm:p-5">
      <div>
        <p className="text-sm font-medium text-slate-800">AI mastery check</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Before submitting <span className="font-medium">{homeworkTitle}</span>,
          answer questions from your tutor&apos;s study material. You need about
          80% correct to continue.
        </p>
      </div>

      {totalQuestions > 0 && !complete && (
        <p className="text-xs font-medium text-[var(--color-muted)]">
          Progress: {answeredCount} / {totalQuestions} answered
        </p>
      )}

      <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-slate-50/70 p-3">
        {messages.length === 0 && loading && (
          <p className="text-sm text-[var(--color-muted)]">
            Preparing your questions…
          </p>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`rounded-lg px-3 py-2 text-sm ${
              message.role === "tutor"
                ? "bg-white text-slate-800"
                : message.role === "student"
                  ? "ml-6 bg-[var(--color-primary)] text-white"
                  : message.correct
                    ? "ml-6 border border-[var(--color-primary-light)] bg-[var(--color-primary-light)]/40 text-slate-700"
                    : "ml-6 border border-red-200 bg-red-50 text-slate-700"
            }`}
          >
            {message.role === "tutor" && (
              <p className="mb-1 text-xs font-medium text-[var(--color-muted)]">
                Tutor AI
              </p>
            )}
            {message.role === "student" && (
              <p className="mb-1 text-xs font-medium text-white/80">You</p>
            )}
            {message.role === "feedback" && (
              <p className="mb-1 text-xs font-medium text-[var(--color-muted)]">
                {message.correct ? "Correct" : "Needs work"}
              </p>
            )}
            <p className="whitespace-pre-wrap">{message.text}</p>
          </div>
        ))}
        {currentQuestion && !complete && (
          <div className="rounded-lg bg-white px-3 py-2 text-sm text-slate-800">
            <p className="mb-1 text-xs font-medium text-[var(--color-muted)]">
              Tutor AI
            </p>
            <p className="whitespace-pre-wrap">
              Question {currentQuestion.question_number} (
              {currentQuestion.question_type}): {currentQuestion.question_text}
            </p>
          </div>
        )}
      </div>

      {complete && session && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            passed
              ? "bg-[var(--color-primary-light)]/50 text-[var(--color-primary)]"
              : "bg-red-50 text-[var(--color-danger)]"
          }`}
        >
          {passed ? (
            <p>
              Mastery achieved ({session.score_percent}% correct). You can now
              submit your homework.
            </p>
          ) : (
            <p>
              Score: {session.score_percent}% — you need {session.pass_threshold}%
              to continue. Review the material and try again.
            </p>
          )}
        </div>
      )}

      {!complete && currentQuestion && (
        <form onSubmit={submitAnswer} className="space-y-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor={`mastery-answer-${homeworkId}`}
          >
            Your answer
          </label>
          <textarea
            id={`mastery-answer-${homeworkId}`}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            rows={3}
            required
            disabled={loading}
            placeholder="Type your answer…"
            className="text-sm"
          />
          <button
            type="submit"
            disabled={loading || !answer.trim()}
            className="btn btn-primary text-sm"
          >
            {loading ? "Checking…" : "Submit answer"}
          </button>
        </form>
      )}

      {complete && !passed && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void startSession(true)}
          className="btn btn-secondary text-sm"
        >
          {loading ? "Preparing…" : "Try again"}
        </button>
      )}

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
