import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { gradeHomeworkWithAi } from "@/lib/ai/homework-grader";
import { getProfile } from "@/lib/auth";
import { parseHomeworkAiGradings } from "@/lib/homework-ai-gradings";
import { createClient } from "@/lib/supabase/server";
import type { HomeworkAiGrading } from "@/lib/types";

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_QUESTION_TEXT_CHARS = 50000;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const homeworkId = formData.get("homework_id");
    const sourceType = formData.get("source_type");

    if (typeof homeworkId !== "string" || !homeworkId) {
      return NextResponse.json({ error: "Homework ID is required." }, { status: 400 });
    }

    if (sourceType !== "image" && sourceType !== "url" && sourceType !== "text") {
      return NextResponse.json(
        { error: "Question source type must be image, url, or text." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: homework, error: homeworkError } = await supabase
      .from("homework_assignments")
      .select("id, student_id, title, description, submission_text, ai_gradings")
      .eq("id", homeworkId)
      .maybeSingle();

    if (homeworkError || !homework) {
      return NextResponse.json(
        { error: "Homework assignment not found." },
        { status: 404 }
      );
    }

    if (!homework.submission_text?.trim()) {
      return NextResponse.json(
        { error: "This assignment has no written submission to grade." },
        { status: 400 }
      );
    }

    let sourceLabel = "";
    let questionUrl: string | undefined;
    let questionText: string | undefined;
    let questionImages:
      | { mimeType: string; base64: string; name: string }[]
      | undefined;

    if (sourceType === "text") {
      const text = formData.get("question_text");
      if (typeof text !== "string" || !text.trim()) {
        return NextResponse.json(
          { error: "Question text is required." },
          { status: 400 }
        );
      }

      questionText = text.replace(/\r\n/g, "\n").trim().slice(0, MAX_QUESTION_TEXT_CHARS);
      const preview = questionText.replace(/\s+/g, " ").slice(0, 60);
      sourceLabel = preview.length < questionText.length ? `${preview}…` : preview;
    } else if (sourceType === "url") {
      const url = formData.get("question_url");
      if (typeof url !== "string" || !url.trim()) {
        return NextResponse.json(
          { error: "Question URL is required." },
          { status: 400 }
        );
      }

      try {
        const parsed = new URL(url.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("Invalid protocol");
        }
        questionUrl = parsed.toString();
        sourceLabel = questionUrl;
      } catch {
        return NextResponse.json({ error: "Invalid question URL." }, { status: 400 });
      }
    } else {
      const files = formData
        .getAll("question_images")
        .filter((entry): entry is File => entry instanceof File && entry.size > 0);

      if (files.length === 0) {
        return NextResponse.json(
          { error: "Upload at least one question image." },
          { status: 400 }
        );
      }

      if (files.length > MAX_IMAGES) {
        return NextResponse.json(
          { error: `You can upload up to ${MAX_IMAGES} images.` },
          { status: 400 }
        );
      }

      questionImages = [];

      for (const file of files) {
        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
          return NextResponse.json(
            { error: "Images must be JPEG, PNG, WebP, or GIF." },
            { status: 400 }
          );
        }

        if (file.size > MAX_IMAGE_BYTES) {
          return NextResponse.json(
            { error: "Each image must be 5 MB or smaller." },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        questionImages.push({
          mimeType: file.type,
          base64: buffer.toString("base64"),
          name: file.name,
        });
      }

      sourceLabel =
        questionImages.length === 1
          ? questionImages[0].name
          : `${questionImages.length} images`;
    }

    const gradingResult = await gradeHomeworkWithAi({
      homeworkTitle: homework.title,
      homeworkDescription: homework.description,
      studentSubmission: homework.submission_text.trim(),
      sourceType,
      sourceLabel,
      questionUrl,
      questionText,
      questionImages,
    });

    const existingGradings = parseHomeworkAiGradings(homework.ai_gradings);
    const newGrading: HomeworkAiGrading = {
      id: randomUUID(),
      created_at: new Date().toISOString(),
      created_by: profile?.id ?? null,
      ...gradingResult,
    };

    const { data: saved, error: saveError } = await supabase
      .from("homework_assignments")
      .update({ ai_gradings: [newGrading, ...existingGradings] })
      .eq("id", homeworkId)
      .select("ai_gradings")
      .single();

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    revalidatePath("/admin/homework");
    revalidatePath(`/admin/homework/${homeworkId}`);
    revalidatePath(`/admin/students/${homework.student_id}`);

    return NextResponse.json({
      grading: newGrading,
      ai_gradings: parseHomeworkAiGradings(saved.ai_gradings),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Homework grading failed.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
