import Link from "next/link";

// Temporary home page. Replaced by the landing page with live stats in M6.
export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="card max-w-md text-center">
        <h1 className="text-lg font-semibold">Bug Bounty Ledger</h1>
        <p className="mt-2 text-sm text-muted">The scaffold is running. Features arrive milestone by milestone.</p>
        <Link className="btn btn-primary mt-4" href="/login">Sign in</Link>
      </div>
    </main>
  );
}
