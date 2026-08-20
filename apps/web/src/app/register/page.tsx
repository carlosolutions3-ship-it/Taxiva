import Link from "next/link";
import { registerAction } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { BRAND_NAME } from "@/lib/brand";
import { AlertIcon } from "@/components/icons";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-900 text-xs font-bold text-white">
              {BRAND_NAME[0]}
            </div>
            <span className="text-lg font-semibold text-ink-900">{BRAND_NAME}</span>
          </Link>
          <p className="mt-2 text-sm text-ink-500">Create your free account — no payment info required.</p>
        </div>
        <form action={registerAction} className="card animate-in space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-700">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
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
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2.5 text-sm transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input type="radio" name="country" value="US" defaultChecked className="accent-brand-600" />
                🇺🇸 United States
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2.5 text-sm transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input type="radio" name="country" value="PH" className="accent-brand-600" />
                🇵🇭 Philippines
              </label>
            </div>
          </div>
          <SubmitButton pendingText="Creating account…" className="w-full">Create account</SubmitButton>
        </form>
        <p className="mt-4 text-center text-sm text-ink-500">
          Already have an account? <Link href="/login" className="font-medium text-brand-700 hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}
