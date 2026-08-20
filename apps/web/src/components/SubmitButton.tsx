"use client";

import { useFormStatus } from "react-dom";
import { SpinnerIcon } from "./icons";

type Props = {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
};

const VARIANT_CLASS: Record<NonNullable<Props["variant"]>, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
};

/** Submit button for a native `<form action={fn}>` — shows a spinner + disables itself while pending. */
export function SubmitButton({ children, pendingText, variant = "primary", className = "" }: Props) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${VARIANT_CLASS[variant]} ${className}`}>
      {pending && <SpinnerIcon className="h-4 w-4 animate-spin" />}
      {pending ? pendingText ?? "Working…" : children}
    </button>
  );
}
