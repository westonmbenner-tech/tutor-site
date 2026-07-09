"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateHomework } from "@/app/actions/homework";
import { HomeworkDescriptionPreview } from "@/components/HomeworkDescription";
import { MasterySourceFields } from "@/components/admin/MasterySourceFields";
import { ParentNotifyOnSubmitField } from "@/components/admin/ParentNotifyOnSubmitField";
import type { HomeworkDescriptionFormat } from "@/lib/parse-homework-latex";
import type { HomeworkAssignment } from "@/lib/types";

const initialState = { error: null as string | null, success: false };

type ResolvedHomework = HomeworkAssignment & {
  resolved_status: "assigned" | "completed" | "late" | "missing";
};

export function EditHomeworkForm({ item }: { item: ResolvedHomework }) {
  const router = useRouter();
  const boundAction = updateHomework.bind(null, item.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [description, setDescription] = useState(item.description ?? "");
  const [descriptionFormat, setDescriptionFormat] =
    useState<HomeworkDescriptionFormat>(item.description_format ?? "plain");

  useEffect(() => {
    setDescription(item.description ?? "");
    setDescriptionFormat(item.description_format ?? "plain");
  }, [item.id, item.description, item.description_format]);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="form-group">
        <label className="label" htmlFor={`title-${item.id}`}>
          Title
        </label>
        <input
          id={`title-${item.id}`}
          name="title"
          required
          defaultValue={item.title}
        />
      </div>
      <div className="form-group">
        <label className="label" htmlFor={`description-${item.id}`}>
          Description
        </label>
        <textarea
          id={`description-${item.id}`}
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
      <MasterySourceFields
        idPrefix={`edit-${item.id}-`}
        defaultMandate={item.mandate_ai_mastery ?? false}
        defaultSourceType={item.mastery_source_type ?? "text"}
        defaultSourceText={item.mastery_source_text ?? ""}
        defaultSourceUrl={item.mastery_source_url ?? ""}
      />
      <ParentNotifyOnSubmitField
        idPrefix={`edit-${item.id}-`}
        defaultChecked={item.notify_parent_on_submit ?? false}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-group mb-0">
          <label className="label" htmlFor={`due_date-${item.id}`}>
            Due date
          </label>
          <input
            id={`due_date-${item.id}`}
            name="due_date"
            type="date"
            defaultValue={item.due_date ?? ""}
          />
        </div>
        <div className="form-group mb-0">
          <label className="label" htmlFor={`status-${item.id}`}>
            Status
          </label>
          <select
            id={`status-${item.id}`}
            name="status"
            defaultValue={item.status}
          >
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
            <option value="late">Late</option>
            <option value="missing">Missing</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="label" htmlFor={`links-${item.id}`}>
          Links (JSON array)
        </label>
        <textarea
          id={`links-${item.id}`}
          name="links"
          rows={2}
          defaultValue={JSON.stringify(item.links ?? [], null, 2)}
        />
      </div>
      <div className="form-group">
        <label className="label" htmlFor={`attachments-${item.id}`}>
          Attachments metadata (JSON)
        </label>
        <textarea
          id={`attachments-${item.id}`}
          name="attachments"
          rows={2}
          defaultValue={JSON.stringify(item.attachments ?? [], null, 2)}
        />
      </div>
      {state.error && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-[var(--color-primary)]">Assignment updated.</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary text-sm">
        {pending ? "Saving…" : "Save assignment"}
      </button>
    </form>
  );
}
