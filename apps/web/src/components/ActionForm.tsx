"use client";

import { createContext, useContext, useRef, useTransition } from "react";

const ActionPendingContext = createContext<boolean | null>(null);

/**
 * A form that submits to a Server Action and then forces a real document
 * reload, rather than relying on React DOM's native `<form action={fn}>`
 * dispatch or Next's `router.refresh()`. Both of those were found to be
 * unreliable in production for a form that redisplays the page it was
 * submitted from: the server-side mutation reliably succeeds (verified
 * directly against the database), but the client-visible UI intermittently
 * never updates — reproduced repeatedly across income, deductions, and
 * filing regardless of revalidatePath placement, compare-and-swap-safe
 * mutations, or which hooks read the pending state. `window.location.reload()`
 * has no such ambiguity: it always shows exactly what the server has.
 */
export function ActionForm({
  action,
  children,
  className,
  id,
}: {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      id={id}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          await action(formData);
          // A real document reload rather than router.refresh(). This was
          // found to be the only reliable way to show a same-page action's
          // result: router.refresh()'s RSC re-fetch intermittently never
          // committed to the visible DOM in production — the button stayed
          // "pending" and the server-confirmed new state (verified directly
          // against the database) never appeared, even though the network
          // request itself succeeded. Reproduced repeatedly across income,
          // deductions, and filing regardless of revalidatePath placement,
          // CAS-safe mutations, or removing useFormStatus from the mix — so
          // this treats it as a router.refresh() reliability issue rather
          // than continuing to chase it. A full reload costs a flash of
          // white and a network round trip, which is an acceptable trade
          // for "the button never lies about whether the click worked."
          window.location.reload();
        });
      }}
    >
      <ActionPendingContext.Provider value={pending}>{children}</ActionPendingContext.Provider>
    </form>
  );
}

/** Returns pending state from an enclosing ActionForm, or null if there isn't one. */
export function useActionFormPending(): boolean | null {
  return useContext(ActionPendingContext);
}
