"use client";

import { useActionState, useState } from "react";
import { createHomework } from "@/app/actions/homework";
import { HomeworkDescriptionPreview } from "@/components/HomeworkDescription";
import { MasterySourceFields } from "@/components/admin/MasterySourceFields";
import { ParentNotifyOnSubmitField } from "@/components/admin/ParentNotifyOnSubmitField";
import type { HomeworkDescriptionFormat } from "@/lib/parse-homework-latex";
import type { Student } from "@/lib/types";

const initialState = { error: null as string | null, success: false };

export function CreateHomeworkForm({ students }: { students: Student[] }) {
  const [state, formAction, pending] = useActionState(createHomework, initialState);
  const [description, setDescription] = useState("");
  const [descriptionFormat, setDescriptionFormat] =
    useState<HomeworkDescriptionFormat>("plain");

  return (
    <form action={formAction} className="space-y-4">
      <div className="form-group">
        <label className="label" htmlFor="student_id">
          Student
        </label>
        <select id="student_id" name="student_id" required defaultValue="">
          <option value="" disabled>
            Select student
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.display_name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="label" htmlFor="title">
          Title
        </label>
        <input id="title" name="title" required />
      </div>
      <div className="form-group">
        <label className="label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Use $...$ or $$...$$ for math when displaying as LaTeX."
        />
      </div>
      <HomeworkDescriptionPreview
        description={description}
        selectedFormat={descriptionFormat}
        onFormatChange={setDescriptionFormat}
      />
      <MasterySourceFields idPrefix="create-" />
      <ParentNotifyOnSubmitField idPrefix="create-" />
      <div className="form-group">
        <label className="label" htmlFor="due_date">
          Due date
        </label>
        <input id="due_date" name="due_date" type="date" />
      </div>
      <div className="form-group">
        <label className="label" htmlFor="links">
          Links (JSON array)
        </label>
        <textarea
          id="links"
          name="links"
          rows={2}
          placeholder='[{"url":"https://...","label":"Worksheet"}]'
        />
      </div>
      <div className="form-group">
        <label className="label" htmlFor="attachments">
          Attachments metadata (JSON)
        </label>
        <textarea
          id="attachments"
          name="attachments"
          rows={2}
          placeholder='[{"name":"worksheet.pdf"}]'
        />
      </div>
      {state.error && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-[var(--color-primary)]">Homework assigned.</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary">
        Assign homework
      </button>
    </form>
  );
}
