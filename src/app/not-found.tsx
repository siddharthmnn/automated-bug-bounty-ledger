import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="card max-w-md text-center">
        <h1 className="text-lg font-semibold">Not found</h1>
        <p className="mt-2 text-sm text-muted">That page or record does not exist, or you are not allowed to see it.</p>
        <Link className="btn btn-primary mt-4" href="/">Go home</Link>
      </div>
    </main>
  );
}
