import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Full export of everything the account owns — the "data export" settings feature, for real. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [documents, income, expenses, filingState, deductionDecisions] = await Promise.all([
    prisma.document.findMany({ where: { userId: user.id } }),
    prisma.incomeItem.findMany({ where: { userId: user.id } }),
    prisma.expenseItem.findMany({ where: { userId: user.id } }),
    prisma.filingState.findUnique({ where: { userId: user.id } }),
    prisma.deductionDecision.findMany({ where: { userId: user.id } }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    account: {
      email: user.email,
      displayName: user.displayName,
      country: user.country,
      taxpayerType: user.taxpayerType,
      filingStatus: user.filingStatus,
      taxYear: user.taxYear,
      createdAt: user.createdAt,
    },
    documents,
    income,
    expenses,
    filingState,
    deductionDecisions,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="fyleo-export-${user.taxYear}.json"`,
    },
  });
}
