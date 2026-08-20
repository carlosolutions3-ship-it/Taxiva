import Link from "next/link";
import { requireUser } from "@/lib/actions";
import { getUserTaxContext } from "@/lib/tax";
import { prisma } from "@/lib/prisma";
import type { FilingStage } from "@taxiva/tax-engine-core";
import { computeActionItems, computeReadiness, computeRefundEstimate, computeTaxHealth } from "@/lib/finance";
import { formatMoney, greetingForHour } from "@/lib/format";
import { StatCard, StatusBadge } from "@/components/ui";
import {
  BanknoteIcon,
  DocumentIcon,
  CheckShieldIcon,
  AlertIcon,
  SparkleIcon,
  ArrowRightIcon,
  ChevronRightIcon,
} from "@/components/icons";

export default async function OverviewPage() {
  const user = await requireUser();
  const { estimate, insights, income, missingDocuments, deductionCandidates } = await getUserTaxContext(user);
  const [documentsCount, filingState] = await Promise.all([
    prisma.document.count({ where: { userId: user.id } }),
    prisma.filingState.findUnique({ where: { userId: user.id } }),
  ]);

  const hasIncome = income.length > 0;
  const blockingMissing = missingDocuments.filter((d) => d.severity === "blocking");
  const documentsExpected = documentsCount + missingDocuments.length;
  const readiness = computeReadiness({
    hasIncome,
    documentsCollected: documentsCount,
    documentsExpected,
    blockingMissingCount: blockingMissing.length,
    hasEstimate: hasIncome,
    filingStage: (filingState?.currentStage ?? "draft") as FilingStage,
  });
  const refund = computeRefundEstimate(income, estimate);
  const health = computeTaxHealth({ blockingMissingCount: blockingMissing.length, hasIncome });
  const actionItems = computeActionItems({ missingDocuments, deductionCandidates });

  const greeting = greetingForHour(new Date().getHours());
  const firstName = (user.displayName || "").split(" ")[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">
            {greeting}
            {firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="mt-1 text-ink-500">Here's where things stand for tax year {user.taxYear}.</p>
        </div>
        <StatusBadge tone={health.status === "good" ? "success" : "warning"} dot>
          {health.headline}
        </StatusBadge>
      </div>

      {/* Tax season status */}
      <div className="animate-in overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 to-ink-800 p-6 text-white shadow-popover sm:p-7">
        <p className="text-xs font-medium uppercase tracking-wide text-white/50">Tax season status</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <p className="text-2xl font-semibold sm:text-3xl">Your return is {readiness}% ready.</p>
          <Link
            href="/dashboard/estimate"
            className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            View tax return
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-white transition-all duration-700 ease-out"
            style={{ width: `${readiness}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-white/60">{health.reason}</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Documents"
          value={`${documentsCount} / ${documentsExpected || documentsCount}`}
          hint="collected"
          icon={<DocumentIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Potential deductions"
          value={formatMoney(deductionCandidates.reduce((a, c) => a + c.amount, 0), estimate.currency, { compact: true })}
          hint={`${deductionCandidates.length} found`}
          tone="success"
          icon={<CheckShieldIcon className="h-4 w-4" />}
        />
        <StatCard
          label={refund.isRefund ? "Estimated refund" : "Estimated balance due"}
          value={formatMoney(Math.abs(refund.amount), estimate.currency, { compact: true })}
          hint={hasIncome ? undefined : "Add income to estimate"}
          tone={refund.isRefund ? "brand" : "warning"}
          icon={<BanknoteIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Action required"
          value={String(actionItems.length)}
          hint={actionItems.length === 0 ? "You're all caught up" : "item(s) to review"}
          tone={actionItems.length === 0 ? "success" : "warning"}
          icon={<AlertIcon className="h-4 w-4" />}
        />
      </div>

      {/* Action items, plain language */}
      {actionItems.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">What needs your attention</h2>
          <div className="space-y-2">
            {actionItems.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="card-interactive animate-in flex items-center justify-between gap-4 !p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      item.severity === "blocking" ? "bg-danger-50 text-danger-600" : "bg-warning-50 text-warning-600"
                    }`}
                  >
                    <AlertIcon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink-900">{item.label}</p>
                    <p className="text-xs text-ink-500">{item.description}</p>
                  </div>
                </div>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-300" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* AI insights, plain language */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <SparkleIcon className="h-4 w-4 text-brand-600" />
          <h2 className="text-lg font-semibold text-ink-900">What your assistant noticed</h2>
        </div>
        <div className="space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`animate-in rounded-xl border p-4 ${
                insight.severity === "action_needed"
                  ? "border-danger-200 bg-danger-50"
                  : insight.severity === "attention"
                  ? "border-warning-200 bg-warning-50"
                  : "border-ink-200 bg-white"
              }`}
            >
              <p className="font-medium text-ink-900">{insight.headline}</p>
              <p className="mt-1 text-sm text-ink-600">{insight.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/documents" className="card-interactive">
          <p className="font-medium text-ink-900">Upload a document →</p>
          <p className="mt-1 text-sm text-ink-500">Receipts, invoices, payout reports.</p>
        </Link>
        <Link href="/dashboard/estimate" className="card-interactive">
          <p className="font-medium text-ink-900">See your tax summary →</p>
          <p className="mt-1 text-sm text-ink-500">Plain-language breakdown, no jargon.</p>
        </Link>
        <Link href="/dashboard/assistant" className="card-interactive">
          <p className="font-medium text-ink-900">Ask the AI assistant →</p>
          <p className="mt-1 text-sm text-ink-500">"Did I miss anything?"</p>
        </Link>
      </div>
    </div>
  );
}
