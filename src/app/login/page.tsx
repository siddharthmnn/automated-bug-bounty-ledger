import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";
export default function LoginPage() {
 return <div className="grid min-h-screen place-items-center px-4"><div className="card w-full max-w-sm">
  <h1 className="text-xl font-semibold">Sign in</h1><p className="mt-1 mb-5 text-sm text-muted">Admins and researchers use the same sign-in.</p>
  <Suspense><LoginForm/></Suspense>
  <p className="mt-5 text-sm text-muted">New researcher? <Link className="link" href="/register">Create an account</Link></p>
 </div></div>;
}
