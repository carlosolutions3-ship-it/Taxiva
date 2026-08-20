"use server";

import { revalidatePath } from "next/cache";
import { extractDocumentFields } from "@taxiva/document-ai";
import type { CountryCode } from "@taxiva/tax-engine-core";
import { prisma } from "./prisma";
import { requireUser } from "./actions";

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
  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/income");
  revalidatePath("/dashboard/expenses");
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
}

const STAGE_ORDER = ["draft", "reviewed", "approved", "simulated_filed"] as const;

export async function advanceFilingStageAction(): Promise<void> {
  const user = await requireUser();
  const existing = await prisma.filingState.findUnique({ where: { userId: user.id } });
  const currentStage = (existing?.currentStage ?? "draft") as (typeof STAGE_ORDER)[number];
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const nextStage = STAGE_ORDER[Math.min(currentIndex + 1, STAGE_ORDER.length - 1)];

  await prisma.filingState.upsert({
    where: { userId: user.id },
    create: { userId: user.id, country: user.country, taxYear: user.taxYear, currentStage: nextStage },
    update: { currentStage: nextStage, country: user.country, taxYear: user.taxYear },
  });

  revalidatePath("/dashboard/filing");
}

export async function resetFilingStageAction(): Promise<void> {
  const user = await requireUser();
  await prisma.filingState.upsert({
    where: { userId: user.id },
    create: { userId: user.id, country: user.country, taxYear: user.taxYear, currentStage: "draft" },
    update: { currentStage: "draft" },
  });
  revalidatePath("/dashboard/filing");
}
