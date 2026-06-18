"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type RemovalResult = { error: string | null; success: boolean };

export function ConfirmRemovalPanel({
  entityLabel,
  entityName,
  consequences,
  onRemove,
  redirectTo,
  startInConfirmStep = false,
  idleButtonLabel,
}: {
  entityLabel: string;
  entityName: string;
  consequences: string[];
  onRemove: () => Promise<RemovalResult>;
  redirectTo: string;
  startInConfirmStep?: boolean;
  idleButtonLabel?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm">(
    startInConfirmStep ? "confirm" : "idle"
  );
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCancel() {
    setStep("idle");
    setAcknowledged(false);
    setError(null);
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await onRemove();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    });
  }

  if (step === "idle") {
    return (
      <button
        type="button"
        onClick={() => setStep("confirm")}
        className="btn btn-secondary text-sm text-[var(--color-danger)]"
      >
        Remove {idleButtonLabel ?? entityLabel.toLowerCase()}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50/60 p-4">
      <h3 className="font-medium text-slate-800">
        Remove {entityName}?
      </h3>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        This action cannot be undone. The following will be permanently removed:
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {consequences.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
          className="mt-1"
        />
        <span>
          I understand that removing this {entityLabel.toLowerCase()} is permanent.
        </span>
      </label>
      {error && (
        <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={pending}
          className="btn btn-secondary text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending || !acknowledged}
          className="btn btn-primary text-sm !bg-[var(--color-danger)] hover:!bg-red-800"
        >
          {pending
            ? "Removing…"
            : `Yes, remove ${entityLabel.toLowerCase()} permanently`}
        </button>
      </div>
    </div>
  );
}
