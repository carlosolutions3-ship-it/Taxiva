import { requireUser } from "@/lib/actions";
import { uploadDocumentAction } from "@/lib/data-actions";
import { prisma } from "@/lib/prisma";

export default async function DocumentsPage() {
  const user = await requireUser();
  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Documents</h1>
        <p className="mt-1 text-ink-600">
          Upload a receipt/invoice image (best-effort local OCR via Tesseract.js) or paste the text
          directly — both paths run the same field extraction and categorization.
        </p>
      </div>

      <form action={uploadDocumentAction} className="card space-y-4">
        <div>
          <span className="label">This document is mostly</span>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input type="radio" name="kind" value="expense" defaultChecked className="accent-brand-600" />
              An expense (receipt, invoice, subscription bill)
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input type="radio" name="kind" value="income" className="accent-brand-600" />
              Income (payout report, pay stub)
            </label>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="file">Upload a file (image or PDF)</label>
          <input className="input" id="file" name="file" type="file" accept="image/*,.pdf" />
        </div>
        <div className="text-center text-xs text-ink-400">— or —</div>
        <div>
          <label className="label" htmlFor="pastedText">Paste the document's text</label>
          <textarea
            className="input min-h-28"
            id="pastedText"
            name="pastedText"
            placeholder={"e.g.\nJ&T Express\nOfficial Receipt\nJan 5, 2024\nTotal Due: ₱1,250.00"}
          />
          <p className="mt-1 text-xs text-ink-400">
            Reliable in any environment — useful when OCR isn't available (e.g. no internet access to fetch
            OCR language data).
          </p>
        </div>
        <button type="submit" className="btn-primary">Process document</button>
      </form>

      <div className="space-y-3">
        {documents.length === 0 && <p className="text-center text-ink-400">No documents uploaded yet.</p>}
        {documents.map((doc) => (
          <div key={doc.id} className="card">
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink-900">{doc.filename}</p>
              <span className={`badge ${doc.status === "processed" ? "bg-brand-100 text-brand-800" : "bg-red-100 text-red-700"}`}>
                {doc.status}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-ink-600 sm:grid-cols-4">
              <div><span className="text-ink-400">Vendor:</span> {doc.extractedVendor ?? "—"}</div>
              <div><span className="text-ink-400">Amount:</span> {doc.extractedAmount != null ? `${doc.extractedCurrency === "PHP" ? "₱" : "$"}${doc.extractedAmount.toLocaleString()}` : "—"}</div>
              <div><span className="text-ink-400">Date:</span> {doc.extractedDate ?? "—"}</div>
              <div><span className="text-ink-400">OCR engine:</span> {doc.ocrEngine ?? "—"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
