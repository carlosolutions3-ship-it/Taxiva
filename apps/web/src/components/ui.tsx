import type { ReactNode } from "react";
import Link from "next/link";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "brand" | "success" | "warning" | "danger";
  icon?: ReactNode;
}) {
  const valueTone: Record<string, string> = {
    default: "text-ink-900",
    brand: "text-brand-700",
    success: "text-success-700",
    warning: "text-warning-700",
    danger: "text-danger-700",
  };
  return (
    <div className="card animate-in">
      <div className="flex items-start justify-between">
        <p className="text-sm text-ink-500">{label}</p>
        {icon && <span className="text-ink-300">{icon}</span>}
      </div>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${valueTone[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  brand: "bg-brand-50 text-brand-700",
  neutral: "bg-ink-100 text-ink-600",
};

export function StatusBadge({
  tone,
  children,
  dot = false,
}: {
  tone: "success" | "warning" | "danger" | "brand" | "neutral";
  children: ReactNode;
  dot?: boolean;
}) {
  const dotColor: Record<string, string> = {
    success: "bg-success-500",
    warning: "bg-warning-500",
    danger: "bg-danger-500",
    brand: "bg-brand-500",
    neutral: "bg-ink-400",
  };
  return (
    <span className={`badge ${STATUS_STYLE[tone]}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColor[tone]}`} />}
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
          {icon}
        </div>
      )}
      <p className="font-medium text-ink-900">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary mt-5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="section-eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-ink-100 ${className}`} />;
}
