import { requireUser } from "@/lib/actions";
import { getUserTaxContext } from "@/lib/tax";

export default async function FormsPage() {
  const user = await requireUser();
  const { engine, profile, income, expenses, estimate } = await getUserTaxContext(user);
  const forms = engine.generateDraftForms({ profile, income, expenses, estimate });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Draft forms</h1>
        <p className="mt-1 text-ink-600">
          Generated from your current data. These are drafts for planning only — see the disclaimer on
          each form.
        </p>
      </div>

      {forms.map((form) => (
        <div key={form.formId} className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">{form.formName}</h2>
            <span className="badge bg-ink-100 text-ink-600">DRAFT</span>
          </div>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {form.fields.map((field) => (
                <tr key={field.key} className="border-b border-ink-50 last:border-0">
                  <td className="py-2 pr-4 text-ink-600">{field.label}</td>
                  <td className="py-2 text-right font-medium text-ink-900">
                    {typeof field.value === "number" ? field.value.toLocaleString() : field.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{form.disclaimer}</p>
        </div>
      ))}
    </div>
  );
}
