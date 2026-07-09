export function ParentNotifyOnSubmitField({
  defaultChecked = false,
  idPrefix = "",
}: {
  defaultChecked?: boolean;
  idPrefix?: string;
}) {
  return (
    <label className="flex items-start gap-2 rounded-lg border border-[var(--color-border)] bg-slate-50/60 p-4 text-sm text-slate-800">
      <input
        type="checkbox"
        id={`${idPrefix}notify-parent-on-submit`}
        name="notify_parent_on_submit"
        defaultChecked={defaultChecked}
        className="mt-1"
      />
      <span>
        Allow parent to be notified when student submits homework
        <span className="mt-1 block text-[var(--color-muted)]">
          Linked parents receive an email at their login address when this
          student submits.
        </span>
      </span>
    </label>
  );
}
