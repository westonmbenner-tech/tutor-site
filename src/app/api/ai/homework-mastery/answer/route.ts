import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  gradeMasteryAnswer,
  resolveMasterySourceText,
} from "@/lib/ai/homework-mastery";
import { assertStudentMasteryHomeworkAccess } from "@/lib/homework-mastery-access";
import { finalizeMasterySession } from "@/lib/homework-mastery";
import { createClient } from "@/lib/supabase/server";
import type { HomeworkMasterySession } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const homeworkId = body.homework_id;
    const answer =
      typeof body.answer === "string" ? body.answer.replace(/\r\n/g, "\n").trim() : "";

    if (typeof homeworkId !== "string" || !homeworkId) {
      return NextResponse.json({ error: "Homework ID is required." }, { status: 400 });
    }

    if (!answer) {
      return NextResponse.json({ error: "Please enter an answer." }, { status: 400 });
    }

    const access = await assertStudentMasteryHomeworkAccess(homeworkId);
    if (!access.homework) {
      return NextResponse.json(
        { error: access.error ?? "Unauthorized" },
        { status: access.error === "Unauthorized" ? 401 : 400 }
      );
    }

    const homework = access.homework;
    const session = homework.mastery_session;

    if (!session || session.questions.length === 0) {
      return NextResponse.json(
        { error: "Start the mastery check first." },
        { status: 400 }
      );
    }

    if (session.passed) {
      return NextResponse.json({ session, passed: true, complete: true });
    }

    if (session.status === "completed" && !session.passed) {
      return NextResponse.json(
        { error: "Retry the mastery check to continue." },
        { status: 400 }
      );
    }

    const currentIndex = session.answers.length;
    if (currentIndex >= session.questions.length) {
      return NextResponse.json(
        { error: "All questions have already been answered." },
        { status: 400 }
      );
    }

    const currentQuestion = session.questions[currentIndex];
    const sourceText = await resolveMasterySourceText({
      mastery_source_type: homework.mastery_source_type,
      mastery_source_text: homework.mastery_source_text,
      mastery_source_url: homework.mastery_source_url,
    });

    const graded = await gradeMasteryAnswer({
      sourceText,
      question: currentQuestion,
      studentAnswer: answer,
    });

    const updatedAnswers = [
      ...session.answers,
      {
        question_number: currentQuestion.question_number,
        student_answer: answer,
        correct: graded.correct,
        feedback: graded.feedback,
      },
    ];

    let updatedSession: HomeworkMasterySession = {
      ...session,
      answers: updatedAnswers,
      status: "in_progress",
    };

    const complete = updatedAnswers.length >= session.questions.length;
    if (complete) {
      updatedSession = finalizeMasterySession(updatedSession);
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("homework_assignments")
      .update({ mastery_session: updatedSession })
      .eq("id", homeworkId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/dashboard/homework");
    revalidatePath("/dashboard");

    return NextResponse.json({
      session: updatedSession,
      passed: updatedSession.passed,
      complete,
      last_feedback: graded.feedback,
      last_correct: graded.correct,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not grade mastery answer.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
