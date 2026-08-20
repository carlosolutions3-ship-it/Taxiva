import { ensureEnginesRegistered, generateInsights } from "@taxiva/document-ai";
import { getEngine } from "@taxiva/tax-engine-core";
import type {
  CountryCode,
  ExpenseItem,
  FilingStatus,
  IncomeItem,
  TaxpayerProfile,
} from "@taxiva/tax-engine-core";
import type { User, IncomeItem as DbIncomeItem, ExpenseItem as DbExpenseItem } from "@prisma/client";
import { prisma } from "./prisma";

ensureEnginesRegistered();

export function getUserEngine(user: Pick<User, "country">) {
  return getEngine(user.country as CountryCode);
}

export function userToProfile(user: User): TaxpayerProfile {
  return {
    id: user.id,
    country: user.country as CountryCode,
    filingStatus: user.filingStatus as FilingStatus,
    taxYear: user.taxYear,
    taxpayerType: user.taxpayerType,
    displayName: user.displayName ?? undefined,
  };
}

export function dbIncomeToDomain(rows: DbIncomeItem[]): IncomeItem[] {
  return rows.map((r) => ({
    id: r.id,
    source: r.source as IncomeItem["source"],
    description: r.description,
    amount: r.amount,
    currency: r.currency as IncomeItem["currency"],
    date: r.date,
    documentId: r.documentId ?? undefined,
    withheldTax: r.withheldTax ?? undefined,
    platform: r.platform ?? undefined,
  }));
}

export function dbExpenseToDomain(rows: DbExpenseItem[]): ExpenseItem[] {
  return rows.map((r) => ({
    id: r.id,
    category: r.category as ExpenseItem["category"],
    description: r.description,
    amount: r.amount,
    currency: r.currency as ExpenseItem["currency"],
    date: r.date,
    documentId: r.documentId ?? undefined,
  }));
}

export async function getUserTaxContext(user: User) {
  const [incomeRows, expenseRows] = await Promise.all([
    prisma.incomeItem.findMany({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    prisma.expenseItem.findMany({ where: { userId: user.id }, orderBy: { date: "desc" } }),
  ]);

  const profile = userToProfile(user);
  const income = dbIncomeToDomain(incomeRows);
  const expenses = dbExpenseToDomain(expenseRows);
  const engine = getUserEngine(user);

  const estimate = engine.estimateTax({ profile, income, expenses });
  const deductionCandidates = engine.findDeductionCandidates({ profile, income, expenses });
  const missingDocuments = engine.detectMissingDocuments({ profile, income, expenses });
  const insights = generateInsights({ estimate, deductionCandidates, missingDocuments });

  return { profile, income, expenses, engine, estimate, deductionCandidates, missingDocuments, insights };
}

export { getEngine };
