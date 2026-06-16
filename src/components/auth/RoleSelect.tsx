import type { SignupRole } from "@/lib/types";
import { roleLabel } from "@/lib/profile-setup";

export function RoleSelect({
  name,
  id,
  value,
  onChange,
  disabled = false,
  className = "",
}: {
  name?: string;
  id?: string;
  value: SignupRole;
  onChange?: (value: SignupRole) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      disabled={disabled}
      onChange={
        onChange
          ? (event) => onChange(event.target.value as SignupRole)
          : undefined
      }
      className={`rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 ${className}`}
    >
      <option value="student">{roleLabel("student")}</option>
      <option value="parent">{roleLabel("parent")}</option>
    </select>
  );
}
