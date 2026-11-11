"use client";

export default function ResearcherError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      aria-labelledby="researcher-error-title"
      className="mx-auto max-w-2xl rounded-xl border border-line bg-panel px-6 py-10 text-center"
      role="alert"
    >
      <h1 id="researcher-error-title" className="text-lg font-semibold">
        We could not load this page
      </h1>
      <p className="mt-2 text-sm text-muted">
        Your data has not been changed. Check your connection and try again.
        If the problem continues, contact the project administrator.
      </p>
      <button className="btn btn-primary mt-5" onClick={reset} type="button">
        Try again
      </button>
    </section>
  );
}
