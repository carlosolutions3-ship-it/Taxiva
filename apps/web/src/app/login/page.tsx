import Link from "next/link";
import { loginAction } from "@/lib/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="text-lg font-semibold text-ink-900">Taxiva</Link>
          <p className="mt-1 text-sm text-ink-500">Welcome back.</p>
        </div>
        <form action={loginAction} className="card space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn-primary w-full">Log in</button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-500">
          New to Taxiva? <Link href="/register" className="text-brand-700 hover:underline">Create a free account</Link>
        </p>
      </div>
    </main>
  );
}
