/**
 * Seeds two demo accounts — a US freelancer and a Philippine freelancer —
 * with realistic-looking but entirely fictional income, expenses, and
 * documents, so the product can be demonstrated end-to-end without ever
 * touching real customer data. Safe to re-run: it deletes and recreates
 * both demo users every time, so demo state never drifts into something
 * broken or half-finished.
 *
 * Run with: npx tsx prisma/seed-demo.ts   (from apps/web)
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

const DEMO_US_EMAIL = "demo-us@fyleo.demo";
const DEMO_PH_EMAIL = "demo-ph@fyleo.demo";
const DEMO_PASSWORD = "fyleo-demo-2024";

async function seedUsDemo() {
  await prisma.user.deleteMany({ where: { email: DEMO_US_EMAIL } });
  const { hash, salt } = hashPassword(DEMO_PASSWORD);
  const user = await prisma.user.create({
    data: {
      email: DEMO_US_EMAIL,
      passwordHash: hash,
      passwordSalt: salt,
      displayName: "Jordan Rivera (Demo)",
      country: "US",
      taxpayerType: "freelancer",
      filingStatus: "single",
      taxYear: 2024,
      isDemo: true,
    },
  });

  // Jordan is a freelance graphic designer — mixed 1099 clients + a bit of
  // platform income, a believable freelancer income/expense shape.
  await prisma.incomeItem.createMany({
    data: [
      { userId: user.id, source: "freelance", description: "Brand identity project — Northwind Coffee Co.", amount: 4200, currency: "USD", date: "2024-02-14", platform: "direct_client" },
      { userId: user.id, source: "freelance", description: "Website redesign — Larkspur Dental", amount: 6800, currency: "USD", date: "2024-04-02", platform: "direct_client" },
      { userId: user.id, source: "freelance", description: "Logo + packaging — Basil & Bloom", amount: 2100, currency: "USD", date: "2024-06-19", platform: "upwork" },
      { userId: user.id, source: "freelance", description: "Ongoing design retainer, Q3", amount: 5400, currency: "USD", date: "2024-08-30", platform: "direct_client" },
      { userId: user.id, source: "freelance", description: "Pitch deck design — Solano Ventures", amount: 3100, currency: "USD", date: "2024-10-11", platform: "direct_client" },
      { userId: user.id, source: "self_employment", description: "Stock illustration licensing royalties", amount: 940, currency: "USD", date: "2024-11-05", platform: "creative_market" },
    ],
  });

  await prisma.expenseItem.createMany({
    data: [
      { userId: user.id, category: "software_subscriptions", description: "Adobe Creative Cloud, annual plan", amount: 719.88, currency: "USD", date: "2024-01-10" },
      { userId: user.id, category: "software_subscriptions", description: "Figma professional seat", amount: 180, currency: "USD", date: "2024-01-15" },
      { userId: user.id, category: "equipment", description: "27\" monitor for design work", amount: 449.99, currency: "USD", date: "2024-02-20" },
      { userId: user.id, category: "home_office", description: "Home office desk + chair", amount: 620, currency: "USD", date: "2024-02-22" },
      { userId: user.id, category: "advertising_marketing", description: "Portfolio site hosting + domain", amount: 156, currency: "USD", date: "2024-03-01" },
      { userId: user.id, category: "professional_fees", description: "Bookkeeping software subscription", amount: 240, currency: "USD", date: "2024-04-05" },
      { userId: user.id, category: "travel", description: "Client site visit — flight + hotel", amount: 512, currency: "USD", date: "2024-05-14" },
      { userId: user.id, category: "meals", description: "Client lunch meeting — Basil & Bloom kickoff", amount: 86.4, currency: "USD", date: "2024-06-20" },
      { userId: user.id, category: "supplies", description: "Printer ink + presentation materials", amount: 94.5, currency: "USD", date: "2024-07-08" },
      { userId: user.id, category: "utilities", description: "Internet, business-use portion", amount: 480, currency: "USD", date: "2024-09-01" },
    ],
  });

  const doc1 = await prisma.document.create({
    data: {
      userId: user.id,
      filename: "adobe-cc-receipt-2024.pdf",
      mimeType: "application/pdf",
      status: "processed",
      ocrText: "Adobe Creative Cloud\nAnnual Subscription Receipt\nJan 10, 2024\nTotal: $719.88",
      ocrConfidence: 0.94,
      ocrEngine: "tesseract-js",
      extractedVendor: "Adobe",
      extractedAmount: 719.88,
      extractedCurrency: "USD",
      extractedDate: "2024-01-10",
    },
  });
  const doc2 = await prisma.document.create({
    data: {
      userId: user.id,
      filename: "northwind-invoice-paid.pdf",
      mimeType: "application/pdf",
      status: "processed",
      ocrText: "INVOICE — Rivera Design Co.\nBill to: Northwind Coffee Co.\nBrand identity package\nPaid Feb 14, 2024\nTotal: $4,200.00",
      ocrConfidence: 0.91,
      ocrEngine: "tesseract-js",
      extractedVendor: "Northwind Coffee Co.",
      extractedAmount: 4200,
      extractedCurrency: "USD",
      extractedDate: "2024-02-14",
    },
  });

  // Link two of the already-created items to their source document, so
  // the "extracted from this document" trail is visible in the demo.
  const adobeExpense = await prisma.expenseItem.findFirst({ where: { userId: user.id, description: { contains: "Adobe" } } });
  if (adobeExpense) await prisma.expenseItem.update({ where: { id: adobeExpense.id }, data: { documentId: doc1.id } });
  const northwindIncome = await prisma.incomeItem.findFirst({ where: { userId: user.id, description: { contains: "Northwind" } } });
  if (northwindIncome) await prisma.incomeItem.update({ where: { id: northwindIncome.id }, data: { documentId: doc2.id } });

  // A couple of deduction decisions already made, so the demo shows the
  // full range of statuses (confirmed, potential, needs info) at a glance.
  await prisma.deductionDecision.create({
    data: { userId: user.id, taxYear: 2024, candidateId: "us-deduction-software_subscriptions", decision: "confirmed" },
  });

  console.log(`Seeded US demo user: ${DEMO_US_EMAIL} / ${DEMO_PASSWORD}`);
}

async function seedPhDemo() {
  await prisma.user.deleteMany({ where: { email: DEMO_PH_EMAIL } });
  const { hash, salt } = hashPassword(DEMO_PASSWORD);
  const user = await prisma.user.create({
    data: {
      email: DEMO_PH_EMAIL,
      passwordHash: hash,
      passwordSalt: salt,
      displayName: "Marga Santos (Demo)",
      country: "PH",
      taxpayerType: "online_seller",
      filingStatus: "individual",
      taxYear: 2024,
      isDemo: true,
    },
  });

  // Marga runs a Shopee/Lazada online store selling handmade accessories,
  // a common Filipino online-seller freelancer profile.
  await prisma.incomeItem.createMany({
    data: [
      { userId: user.id, source: "online_selling", description: "Shopee store sales, January", amount: 68_500, currency: "PHP", date: "2024-01-31", platform: "shopee" },
      { userId: user.id, source: "online_selling", description: "Shopee store sales, February", amount: 74_200, currency: "PHP", date: "2024-02-29", platform: "shopee" },
      { userId: user.id, source: "online_selling", description: "Lazada store sales, Q1", amount: 121_000, currency: "PHP", date: "2024-03-31", platform: "lazada" },
      { userId: user.id, source: "online_selling", description: "Shopee store sales, Q2", amount: 198_400, currency: "PHP", date: "2024-06-30", platform: "shopee" },
      { userId: user.id, source: "freelance", description: "Custom accessory commissions, direct clients", amount: 42_000, currency: "PHP", date: "2024-07-20", platform: "direct_client" },
      { userId: user.id, source: "online_selling", description: "Lazada + TikTok Shop sales, Q3", amount: 165_300, currency: "PHP", date: "2024-09-30", platform: "tiktok_shop" },
      { userId: user.id, source: "online_selling", description: "Holiday season sales, Q4", amount: 210_600, currency: "PHP", date: "2024-12-20", platform: "shopee" },
    ],
  });

  await prisma.expenseItem.createMany({
    data: [
      { userId: user.id, category: "supplies", description: "Beads, findings, and packaging materials", amount: 38_400, currency: "PHP", date: "2024-01-20" },
      { userId: user.id, category: "shipping_logistics", description: "J&T Express shipping fees, Q1", amount: 12_600, currency: "PHP", date: "2024-03-15" },
      { userId: user.id, category: "advertising_marketing", description: "Shopee Ads boost campaign", amount: 8_500, currency: "PHP", date: "2024-04-02" },
      { userId: user.id, category: "shipping_logistics", description: "Ninja Van shipping fees, Q2", amount: 15_200, currency: "PHP", date: "2024-06-10" },
      { userId: user.id, category: "software_subscriptions", description: "Canva Pro annual subscription", amount: 2_400, currency: "PHP", date: "2024-06-25" },
      { userId: user.id, category: "utilities", description: "PLDT home internet, business-use portion", amount: 14_400, currency: "PHP", date: "2024-08-01" },
      { userId: user.id, category: "taxes_and_licenses", description: "Barangay + Mayor's business permit renewal", amount: 3_200, currency: "PHP", date: "2024-01-10" },
      { userId: user.id, category: "advertising_marketing", description: "TikTok Shop ads, Q3", amount: 11_800, currency: "PHP", date: "2024-09-05" },
      { userId: user.id, category: "shipping_logistics", description: "LBC + courier fees, holiday season", amount: 22_100, currency: "PHP", date: "2024-12-15" },
    ],
  });

  const doc1 = await prisma.document.create({
    data: {
      userId: user.id,
      filename: "canva-pro-receipt.pdf",
      mimeType: "application/pdf",
      status: "processed",
      ocrText: "Canva Pro\nAnnual Subscription Receipt\nJun 25, 2024\nTotal: ₱2,400.00",
      ocrConfidence: 0.93,
      ocrEngine: "tesseract-js",
      extractedVendor: "Canva",
      extractedAmount: 2400,
      extractedCurrency: "PHP",
      extractedDate: "2024-06-25",
    },
  });

  const canvaExpense = await prisma.expenseItem.findFirst({ where: { userId: user.id, description: { contains: "Canva" } } });
  if (canvaExpense) await prisma.expenseItem.update({ where: { id: canvaExpense.id }, data: { documentId: doc1.id } });

  await prisma.deductionDecision.create({
    data: { userId: user.id, taxYear: 2024, candidateId: "ph-osd", decision: "confirmed" },
  });

  console.log(`Seeded PH demo user: ${DEMO_PH_EMAIL} / ${DEMO_PASSWORD}`);
}

async function main() {
  await seedUsDemo();
  await seedPhDemo();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
