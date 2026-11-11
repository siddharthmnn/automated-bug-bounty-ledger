import Link from "next/link";
import { RegisterForm } from "@/components/forms/RegisterForm";
export default function RegisterPage() {
 return <div className="grid min-h-screen place-items-center px-4"><div className="card w-full max-w-md">
  <h1 className="text-xl font-semibold">Join as a researcher</h1>
  <p className="mt-1 mb-5 text-sm text-muted">Creates your researcher profile and login in one database transaction.</p>
  <RegisterForm/>
  <p className="mt-5 text-sm text-muted">Already registered? <Link className="link" href="/login">Sign in</Link></p>
 </div></div>;
}
