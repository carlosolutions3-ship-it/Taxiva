"use client";

import { useEffect } from "react";
import { AlertIcon } from "@/components/icons";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger-600">
        <AlertIcon className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-ink-900">Something went wrong</h2>
      <p className="mt-1.5 max-w-sm text-sm text-ink-500">
        That's on us, not your tax data — nothing you've entered was affected. Try again, and if it keeps
        happening, refresh the page.
      </p>
      <button onClick={() => reset()} className="btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}
