"use server";

import { revalidatePath } from "next/cache";
import { extractDocumentFields } from "@taxiva/document-ai";
import type { CountryCode } from "@taxiva/tax-engine-core";
import { prisma } from "./prisma";
import { requireUser } from "./actions";

// None of the actions in this file call redirect(). They're all invoked
// from <ActionForm> (see components/ActionForm.tsx), which calls the
// action directly and then explicitly runs router.refresh() client-side.
// redirect() back to the same route a form was submitted from was found
// to hang indefinitely in production — useFormStatus().pending never
// cleared even though the server-side mutation completed — so refreshing
// is left entirely to the client instead of Next's automatic post-action
// revalidation. revalidatePath still runs so the Router Cache doesn't
// serve stale data on the *next* visit to these routes from elsewhere
// (e.g. clicking a sidebar link).

export async function addIncomeAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const currency = user.country === "PH" ? "PHP" : "USD";

  await prisma.incomeItem.create({
    data: {
      userId: user.id,
      source: String(formData.get("source") ?? "other"),
      description: String(formData.get("description") ?? "Income"),
      amount: parseFloat(String(formData.get("amount") ?? "0")) || 0,
      currency,
      date: String(formData.get("date") ?? new Date().toISOString().slice(0, 10)),
      platform: String(formData.get("platform") ?? "") || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/income");
}

export async function deleteIncomeAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.incomeItem.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/income");
}

export async function addExpenseAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const currency = user.country === "PH" ? "PHP" : "USD";
  const description = String(formData.get("description") ?? "Expense");
  const vendor = String(formData.get("vendor") ?? "");
  const manualCategory = String(formData.get("category") ?? "");

  const { categorizeExpense } = await getEngineCategorizer(user.country as CountryCode);
  const category = manualCategory || categorizeExpense(description, vendor);

  await prisma.expenseItem.create({
    data: {
      userId: user.id,
      category,
      description,
      amount: parseFloat(String(formData.get("amount") ?? "0")) || 0,
      currency,
      date: String(formData.get("date") ?? new Date().toISOString().slice(0, 10)),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
}

export async function deleteExpenseAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.expenseItem.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
}

async function getEngineCategorizer(country: CountryCode) {
  const { ensureEnginesRegistered } = await import("@taxiva/document-ai");
  const { getEngine } = await import("@taxiva/tax-engine-core");
  ensureEnginesRegistered();
  return getEngine(country);
}

/**
 * Accepts either pasted document text (always available, zero external
 * dependencies) or an uploaded image (best-effort local OCR via
 * Tesseract.js). Either way, the same rule-based field extraction and
 * country-aware categorization runs afterward.
 */
export async function uploadDocumentAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const pastedText = String(formData.get("pastedText") ?? "").trim();
  const file = formData.get("file");
  const kind = String(formData.get("kind") ?? "expense"); // "income" | "expense"

  let ocrText = pastedText;
  let ocrConfidence: number | null = pastedText ? 100 : null;
  let ocrEngine: string | null = pastedText ? "manual-paste" : null;
  let filename = "pasted-text.txt";
  let mimeType = "text/plain";

  if (file instanceof File && file.size > 0) {
    filename = file.name;
    mimeType = file.type || "application/octet-stream";
    if (!ocrText) {
      try {
        const { TesseractOcrEngine } = await import("@taxiva/document-ai");
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await new TesseractOcrEngine().recognize(buffer);
        ocrText = result.text;
        ocrConfidence = result.confidence;
        ocrEngine = result.engine;
      } catch (err) {
        ocrText = "";
        ocrEngine = "failed";
      }
    }
  }

  const fields = extractDocumentFields(ocrText || "");
  const currency = fields.currency ?? (user.country === "PH" ? "PHP" : "USD");

  const document = await prisma.document.create({
    data: {
      userId: user.id,
      filename,
      mimeType,
      ocrText: ocrText || null,
      ocrConfidence: ocrConfidence ?? undefined,
      ocrEngine: ocrEngine ?? undefined,
      extractedVendor: fields.vendor,
      extractedAmount: fields.amount,
      extractedCurrency: currency,
      extractedDate: fields.date,
      status: ocrText ? "processed" : "failed",
    },
  });

  if (fields.amount && fields.amount > 0) {
    if (kind === "income") {
      await prisma.incomeItem.create({
        data: {
          userId: user.id,
          documentId: document.id,
          source: "other",
          description: fields.vendor ?? "Uploaded document",
          amount: fields.amount,
          currency,
          date: fields.date ?? new Date().toISOString().slice(0, 10),
        },
      });
    } else {
      const engine = await getEngineCategorizer(user.country as CountryCode);
      const category = engine.categorizeExpense(fields.vendor ?? "", fields.vendor ?? undefined);
      await prisma.expenseItem.create({
        data: {
          userId: user.id,
          documentId: document.id,
          category,
          description: fields.vendor ?? "Uploaded document",
          amount: fields.amount,
          currency,
          date: fields.date ?? new Date().toISOString().slice(0, 10),
        },
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/income");
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/documents");
}

export async function deleteDocumentAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.document.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/income");
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/documents");
}

async function setDeductionDecision(formData: FormData, decision: "confirmed" | "not_eligible"): Promise<void> {
  const user = await requireUser();
  const candidateId = String(formData.get("candidateId") ?? "");
  if (!candidateId) return;
  await prisma.deductionDecision.upsert({
    where: { userId_taxYear_candidateId: { userId: user.id, taxYear: user.taxYear, candidateId } },
    create: { userId: user.id, taxYear: user.taxYear, candidateId, decision },
    update: { decision },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/deductions");
}

export async function confirmDeductionAction(formData: FormData): Promise<void> {
  await setDeductionDecision(formData, "confirmed");
}

export async function markDeductionNotEligibleAction(formData: FormData): Promise<void> {
  await setDeductionDecision(formData, "not_eligible");
}

export async function resetDeductionDecisionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const candidateId = String(formData.get("candidateId") ?? "");
  await prisma.deductionDecision.deleteMany({ where: { userId: user.id, taxYear: user.taxYear, candidateId } });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/deductions");
}

export async function updateSettingsAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const country = String(formData.get("country") ?? user.country);
  const taxpayerType = String(formData.get("taxpayerType") ?? user.taxpayerType);
  const filingStatus = String(formData.get("filingStatus") ?? user.filingStatus);
  const taxYear = parseInt(String(formData.get("taxYear") ?? user.taxYear), 10) || user.taxYear;
  const displayName = String(formData.get("displayName") ?? "");

  await prisma.user.update({
    where: { id: user.id },
    data: { country, taxpayerType, filingStatus, taxYear, displayName: displayName || null },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}

const STAGE_ORDER = ["draft", "reviewed", "approved", "simulated_filed"] as const;

/**
 * Advances the filing stage by exactly one step from whatever stage the
 * CLIENT believes it's currently at (passed as `fromStage`, a hidden
 * field on the form). This is a compare-and-swap, not a blind
 * read-then-write: two rapid clicks (e.g. an impatient double-click, or
 * two requests that happen to overlap) both read the same starting stage
 * and both compute the same "next" stage, so a naive read-modify-write
 * would silently lose one of the two advances. updateMany's WHERE clause
 * makes the second, stale call match zero rows and become a no-op
 * instead of corrupting the sequence.
 */
export async function advanceFilingStageAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const fromStage = String(formData.get("fromStage") ?? "draft") as (typeof STAGE_ORDER)[number];
  const fromIndex = Math.max(0, STAGE_ORDER.indexOf(fromStage));
  const nextStage = STAGE_ORDER[Math.min(fromIndex + 1, STAGE_ORDER.length - 1)];

  const existing = await prisma.filingState.findUnique({ where: { userId: user.id } });
  if (!existing) {
    await prisma.filingState.create({
      data: { userId: user.id, country: user.country, taxYear: user.taxYear, currentStage: nextStage },
    });
  } else {
    await prisma.filingState.updateMany({
      where: { userId: user.id, currentStage: fromStage },
      data: { currentStage: nextStage, country: user.country, taxYear: user.taxYear },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/filing");
}

export async function resetFilingStageAction(): Promise<void> {
  const user = await requireUser();
  await prisma.filingState.upsert({
    where: { userId: user.id },
    create: { userId: user.id, country: user.country, taxYear: user.taxYear, currentStage: "draft" },
    update: { currentStage: "draft" },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/filing");
}
