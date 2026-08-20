"use client";

import { useMemo, useState } from "react";
import type { Document } from "@prisma/client";
import type { MissingDocument } from "@taxiva/tax-engine-core";
import { deleteDocumentAction } from "@/lib/data-actions";
import { formatDate } from "@/lib/format";
import { StatusBadge, EmptyState } from "./ui";
import { ActionSubmitButton } from "./ActionSubmitButton";
import { ActionForm } from "./ActionForm";
import { SearchIcon, ChevronRightIcon, TrashIcon, DocumentIcon, CheckIcon, AlertIcon } from "./icons";

type Filter = "all" | "ready" | "review";

function isReady(doc: Document): boolean {
  return doc.status === "processed" && doc.extractedAmount != null && doc.extractedAmount > 0;
}

export function DocumentList({
  documents,
  missingDocuments,
}: {
  documents: Document[];
  missingDocuments: MissingDocument[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((d) => {
      if (q && !`${d.filename} ${d.extractedVendor ?? ""}`.toLowerCase().includes(q)) return false;
      if (filter === "ready" && !isReady(d)) return false;
      if (filter === "review" && isReady(d)) return false;
      return true;
    });
  }, [documents, query, filter]);

  const ready = filtered.filter(isReady);
  const needsReview = filtered.filter((d) => !isReady(d));

  if (documents.length === 0 && missingDocuments.length === 0) {
    return (
      <EmptyState
        icon={<DocumentIcon className="h-5 w-5" />}
        title="No documents yet"
        description="Upload a receipt, invoice, or payout report above and I'll read it automatically."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Search documents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-ink-200 bg-white p-1">
          {(["all", "ready", "review"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f ? "bg-ink-900 text-white" : "text-ink-500 hover:bg-ink-50"
              }`}
            >
              {f === "review" ? "Needs review" : f}
            </button>
          ))}
        </div>
      </div>

      {ready.length > 0 && (
        <DocGroup
          title="Ready"
          tone="success"
          docs={ready}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
        />
      )}
      {needsReview.length > 0 && (
        <DocGroup
          title="Needs review"
          tone="warning"
          docs={needsReview}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
        />
      )}
      {filtered.length === 0 && documents.length > 0 && (
        <p className="py-8 text-center text-sm text-ink-400">No documents match your search.</p>
      )}

      {missingDocuments.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-ink-900">Missing</h3>
            <StatusBadge tone="neutral">{missingDocuments.length}</StatusBadge>
          </div>
          <div className="space-y-2">
            {missingDocuments.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-dashed border-ink-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full ${d.severity === "blocking" ? "bg-danger-50 text-danger-600" : "bg-ink-100 text-ink-400"}`}>
                    <AlertIcon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink-900">{d.label}</p>
                    <p className="text-xs text-ink-500">{d.reason}</p>
                  </div>
                </div>
                <StatusBadge tone={d.severity === "blocking" ? "danger" : "neutral"}>{d.severity}</StatusBadge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DocGroup({
  title,
  tone,
  docs,
  expandedId,
  setExpandedId,
}: {
  title: string;
  tone: "success" | "warning";
  docs: Document[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
        <StatusBadge tone={tone}>{docs.length}</StatusBadge>
      </div>
      <div className="space-y-2">
        {docs.map((doc) => {
          const expanded = expandedId === doc.id;
          return (
            <div key={doc.id} className="card animate-in !p-0 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : doc.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone === "success" ? "bg-success-50 text-success-600" : "bg-warning-50 text-warning-600"}`}>
                    {tone === "success" ? <CheckIcon className="h-4 w-4" /> : <AlertIcon className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{doc.extractedVendor || doc.filename}</p>
                    <p className="truncate text-xs text-ink-400">
                      {doc.extractedAmount != null
                        ? `${doc.extractedCurrency === "PHP" ? "₱" : "$"}${doc.extractedAmount.toLocaleString()}`
                        : "No amount detected"}
                      {doc.extractedDate ? ` · ${doc.extractedDate}` : ""}
                    </p>
                  </div>
                </div>
                <ChevronRightIcon className={`h-4 w-4 shrink-0 text-ink-300 transition-transform ${expanded ? "rotate-90" : ""}`} />
              </button>
              {expanded && (
                <div className="animate-in border-t border-ink-100 bg-ink-50/50 px-4 py-3.5 text-sm">
                  <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div>
                      <dt className="text-ink-400">Filename</dt>
                      <dd className="truncate text-ink-700">{doc.filename}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-400">Uploaded</dt>
                      <dd className="text-ink-700">{formatDate(doc.createdAt.toISOString())}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-400">AI extraction</dt>
                      <dd className="text-ink-700">{doc.ocrEngine ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-400">Confidence</dt>
                      <dd className="text-ink-700">{doc.ocrConfidence != null ? `${Math.round(doc.ocrConfidence)}%` : "—"}</dd>
                    </div>
                  </dl>
                  {doc.ocrText && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-medium text-ink-500">Extracted text preview</p>
                      <p className="max-h-24 overflow-y-auto whitespace-pre-wrap rounded-lg border border-ink-100 bg-white p-2.5 text-xs text-ink-600">
                        {doc.ocrText.slice(0, 600)}
                      </p>
                    </div>
                  )}
                  <ActionForm action={deleteDocumentAction} className="mt-3">
                    <input type="hidden" name="id" value={doc.id} />
                    <ActionSubmitButton variant="danger" pendingText="Removing…" className="text-xs">
                      <TrashIcon className="h-3.5 w-3.5" />
                      Delete document
                    </ActionSubmitButton>
                  </ActionForm>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
