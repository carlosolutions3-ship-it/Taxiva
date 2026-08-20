"use client";

import { useRef, useState } from "react";
import { uploadDocumentAction } from "@/lib/data-actions";
import { ActionSubmitButton } from "./ActionSubmitButton";
import { ActionForm } from "./ActionForm";
import { UploadIcon } from "./icons";

export function DocumentUploadForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showPaste, setShowPaste] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !fileInputRef.current) return;
    fileInputRef.current.files = files;
    setFileName(files[0].name);
  }

  return (
    <ActionForm action={uploadDocumentAction} className="card animate-in space-y-4">
      <div>
        <span className="label">This document is mostly</span>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2.5 text-sm transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
            <input type="radio" name="kind" value="expense" defaultChecked className="accent-brand-600" />
            An expense (receipt, invoice, subscription bill)
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2.5 text-sm transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
            <input type="radio" name="kind" value="income" className="accent-brand-600" />
            Income (payout report, pay stub)
          </label>
        </div>
      </div>

      <div>
        <span className="label">Upload a file</span>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            dragOver ? "border-brand-400 bg-brand-50" : "border-ink-200 bg-ink-50/50 hover:border-ink-300"
          }`}
        >
          <UploadIcon className={`h-6 w-6 ${dragOver ? "text-brand-600" : "text-ink-400"}`} />
          <p className="mt-2 text-sm font-medium text-ink-700">
            {fileName ?? "Drag and drop, or click to browse"}
          </p>
          <p className="mt-0.5 text-xs text-ink-400">Image or PDF</p>
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowPaste((v) => !v)}
        className="text-xs font-medium text-brand-700 hover:underline"
      >
        {showPaste ? "Hide" : "Or paste the document's text instead"}
      </button>

      {showPaste && (
        <div className="animate-in">
          <label className="label" htmlFor="pastedText">Paste the document's text</label>
          <textarea
            className="input min-h-28"
            id="pastedText"
            name="pastedText"
            placeholder={"e.g.\nJ&T Express\nOfficial Receipt\nJan 5, 2024\nTotal Due: ₱1,250.00"}
          />
          <p className="help-text">
            Reliable in any environment — useful when OCR isn't available (e.g. no internet access to
            fetch OCR language data).
          </p>
        </div>
      )}

      <ActionSubmitButton pendingText="Processing…">Process document</ActionSubmitButton>
    </ActionForm>
  );
}
