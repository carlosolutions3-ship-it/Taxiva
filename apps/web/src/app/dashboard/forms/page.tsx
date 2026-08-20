import Link from "next/link";
import { requireUser } from "@/lib/actions";
import { getUserTaxContext } from "@/lib/tax";
import { SectionHeader, StatusBadge } from "@/components/ui";
import { ChevronRightIcon } from "@/components/icons";

export default async function FormsPage() {
  const user = await requireUser();
  const { engine, profile, income, expenses, estimate } = await getUserTaxContext(user);
  const forms = engine.generateDraftForms({ profile, income, expenses, estimate });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-sm text-ink-400">
        <Link href="/dashboard/estimate" className="hover:text-ink-600">Tax return</Link>
        <ChevronRightIcon className="h-3.5 w-3.5" />
        <span className="text-ink-600">Draft forms</span>
      </div>
      <SectionHeader
        eyebrow="Advanced view"
        title="Draft forms"
        description="Generated from your current data. These are drafts for planning only — every form carries its own disclaimer below."
      />

      {forms.map((form) => (
        <div key={form.formId} className="card animate-in">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">{form.formName}</h2>
            <StatusBadge tone="neutral">Draft</StatusBadge>
          </div>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {form.fields.map((field) => (
                <tr key={field.key} className="border-b border-ink-50 last:border-0">
                  <td className="py-2 pr-4 text-ink-600">{field.label}</td>
                  <td className="py-2 text-right font-medium tabular-nums text-ink-900">
                    {typeof field.value === "number" ? field.value.toLocaleString() : field.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-800">{form.disclaimer}</p>
        </div>
      ))}
    </div>
  );
}
