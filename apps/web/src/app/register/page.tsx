import Link from "next/link";
import { registerAction } from "@/lib/actions";

export default async function RegisterPage({
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
          <p className="mt-1 text-sm text-ink-500">Create your free account — no payment info required.</p>
        </div>
        <form action={registerAction} className="card space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="label" htmlFor="displayName">Name</label>
            <input className="input" id="displayName" name="displayName" placeholder="Jamie Cruz" />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" required minLength={8} placeholder="At least 8 characters" />
          </div>
          <div>
            <span className="label">Which country are you filing in?</span>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input type="radio" name="country" value="US" defaultChecked className="accent-brand-600" />
                🇺🇸 United States
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input type="radio" name="country" value="PH" className="accent-brand-600" />
                🇵🇭 Philippines
              </label>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">Create account</button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-500">
          Already have an account? <Link href="/login" className="text-brand-700 hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}
