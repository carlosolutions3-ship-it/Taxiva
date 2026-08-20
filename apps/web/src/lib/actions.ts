"use server";

import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { createSession, destroySession, getCurrentUser, hashPassword, verifyPassword } from "./auth";

export async function registerAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const country = String(formData.get("country") ?? "US");

  if (!email || !password || password.length < 8) {
    redirect("/register?error=" + encodeURIComponent("Please provide a valid email and a password of at least 8 characters."));
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/register?error=" + encodeURIComponent("An account with that email already exists."));
  }

  const { hash, salt } = hashPassword(password);
  const taxpayerType = country === "PH" ? "self_employed" : "employee";
  const filingStatus = country === "PH" ? "individual" : "single";
  const taxYear = country === "PH" ? 2024 : 2024;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      passwordSalt: salt,
      displayName: displayName || null,
      country,
      taxpayerType,
      filingStatus,
      taxYear,
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    redirect("/login?error=" + encodeURIComponent("Invalid email or password."));
  }

  await createSession(user!.id);
  redirect("/dashboard");
}

// Hardcoded to exactly the two seeded demo accounts (see
// prisma/seed-demo.ts) — this cannot be used to log in as an arbitrary
// user, only to enter one of the two pre-built, clearly-labeled demo
// accounts. No password is required by design: it's a "try it now" door,
// not an auth bypass for real accounts.
const DEMO_EMAILS: Record<"US" | "PH", string> = {
  US: "demo-us@fyleo.demo",
  PH: "demo-ph@fyleo.demo",
};

export async function demoLoginAction(formData: FormData): Promise<void> {
  const country = String(formData.get("country") ?? "US") === "PH" ? "PH" : "US";
  const user = await prisma.user.findUnique({ where: { email: DEMO_EMAILS[country] } });
  if (!user || !user.isDemo) {
    redirect("/login?error=" + encodeURIComponent("Demo account isn't seeded yet. Run `npm run db:seed:demo` in apps/web."));
  }
  await createSession(user!.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
