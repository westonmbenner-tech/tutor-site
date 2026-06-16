import type { ReactNode } from "react";

export function PageFullBleed({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 px-4 sm:px-6 lg:px-10 ${className}`}
    >
      {children}
    </div>
  );
}
