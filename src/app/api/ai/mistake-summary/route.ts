import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile, canAccessStudent } from "@/lib/auth";
import { aiSummaryRequestSchema } from "@/lib/validations";
import type { GroupedCategory, WeakArea } from "@/lib/types";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = aiSummaryRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { student_id, start_date, end_date } = parsed.data;

  if (!(await canAccessStudent(profile, student_id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data: mistakes } = await supabase
    .from("mistakes")
    .select("*, mistake_labels(name)")
    .eq("student_id", student_id)
    .gte("mistake_date", start_date)
    .lte("mistake_date", end_date)
    .order("mistake_date", { ascending: false });

  if (!mistakes?.length) {
    return NextResponse.json(
      { error: "No mistakes found in this date range." },
      { status: 400 }
    );
  }

  const payload = mistakes.map((m) => ({
    date: m.mistake_date,
    topic: m.topic,
    label: (m.mistake_labels as { name?: string } | null)?.name,
    question: m.question_prompt,
    explanation: m.explanation,
    lesson: m.lesson_learned,
  }));

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You analyze student mistake records for a tutoring accountability portal.
Students manually tagged each mistake — preserve and reference those tags.
Return JSON with keys: summary (string), weak_areas (array of {area, evidence, priority: high|medium|low}),
grouped_categories (array of {category, mistake_count, examples[], suggestion}),
suggested_next_steps (string).
Group by patterns across manual labels and topics. Be encouraging but professional.`,
      },
      {
        role: "user",
        content: JSON.stringify({ start_date, end_date, mistakes: payload }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json({ error: "Empty AI response" }, { status: 500 });
  }

  let parsedAi: {
    summary: string;
    weak_areas: WeakArea[];
    grouped_categories: GroupedCategory[];
    suggested_next_steps: string;
  };

  try {
    parsedAi = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });
  }

  const { data: saved, error } = await supabase
    .from("ai_mistake_summaries")
    .insert({
      student_id,
      generated_for_start_date: start_date,
      generated_for_end_date: end_date,
      summary: parsedAi.summary,
      weak_areas: parsedAi.weak_areas ?? [],
      grouped_categories: parsedAi.grouped_categories ?? [],
      suggested_next_steps: parsedAi.suggested_next_steps ?? "",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ summary: saved });
}
