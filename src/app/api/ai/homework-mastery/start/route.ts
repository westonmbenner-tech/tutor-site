import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  generateMasteryQuestions,
  resolveMasterySourceText,
} from "@/lib/ai/homework-mastery";
import { assertStudentMasteryHomeworkAccess } from "@/lib/homework-mastery-access";
import {
  createEmptyMasterySession,
  MASTERY_PASS_THRESHOLD,
} from "@/lib/homework-mastery";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const homeworkId = body.homework_id;
    const retry = body.retry === true;

    if (typeof homeworkId !== "string" || !homeworkId) {
      return NextResponse.json({ error: "Homework ID is required." }, { status: 400 });
    }

    const access = await assertStudentMasteryHomeworkAccess(homeworkId);
    if (!access.homework) {
      return NextResponse.json(
        { error: access.error ?? "Unauthorized" },
        { status: access.error === "Unauthorized" ? 401 : 400 }
      );
    }

    const homework = access.homework;

    if (homework.mastery_session?.passed && !retry) {
      return NextResponse.json({
        session: homework.mastery_session,
        passed: true,
      });
    }

    if (
      !retry &&
      homework.mastery_session?.status === "in_progress" &&
      homework.mastery_session.questions.length > 0 &&
      homework.mastery_session.answers.length <
        homework.mastery_session.questions.length
    ) {
      return NextResponse.json({
        session: homework.mastery_session,
        passed: false,
      });
    }

    const sourceText = await resolveMasterySourceText({
      mastery_source_type: homework.mastery_source_type,
      mastery_source_text: homework.mastery_source_text,
      mastery_source_url: homework.mastery_source_url,
    });

    const questions = await generateMasteryQuestions(sourceText);
    const session = {
      ...createEmptyMasterySession(),
      status: "in_progress" as const,
      questions,
      started_at: new Date().toISOString(),
      pass_threshold: MASTERY_PASS_THRESHOLD,
    };

    const supabase = await createClient();
    const { error } = await supabase
      .from("homework_assignments")
      .update({ mastery_session: session })
      .eq("id", homeworkId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/dashboard/homework");
    revalidatePath("/dashboard");

    return NextResponse.json({ session, passed: false });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not start mastery check.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
