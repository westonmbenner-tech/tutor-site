"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold text-slate-800">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-slate-600">{error.message}</p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
