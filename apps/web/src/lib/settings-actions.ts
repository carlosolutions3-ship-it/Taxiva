"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { requireUser } from "./actions";
import { destroySession, hashPassword, verifyPassword } from "./auth";

export async function changePasswordAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!verifyPassword(currentPassword, user.passwordHash, user.passwordSalt)) {
    redirect("/dashboard/settings?securityError=" + encodeURIComponent("Current password is incorrect.") + "#security");
  }
  if (newPassword.length < 8) {
    redirect("/dashboard/settings?securityError=" + encodeURIComponent("New password must be at least 8 characters.") + "#security");
  }
  if (newPassword !== confirmPassword) {
    redirect("/dashboard/settings?securityError=" + encodeURIComponent("New passwords don't match.") + "#security");
  }

  const { hash, salt } = hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash, passwordSalt: salt } });

  // Sign out every other session — a password change should invalidate
  // credentials an attacker (or an old device) might still be holding.
  const cookieStore = await cookies();
  const currentToken = cookieStore.get("taxiva_session")?.value;
  await prisma.session.deleteMany({ where: { userId: user.id, token: { not: currentToken } } });

  redirect("/dashboard/settings?securitySaved=1#security");
}

export async function updateNotificationsAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const emailRemindersEnabled = formData.get("emailRemindersEnabled") === "on";
  await prisma.user.update({ where: { id: user.id }, data: { emailRemindersEnabled } });
  revalidatePath("/dashboard/settings");
}

export async function deleteAccountAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const password = String(formData.get("password") ?? "");

  if (!verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    redirect("/dashboard/settings?deleteError=" + encodeURIComponent("Password is incorrect — account not deleted.") + "#privacy");
  }

  await prisma.user.delete({ where: { id: user.id } }); // cascades documents, income, expenses, sessions, filing state, deduction decisions
  await destroySession();
  redirect("/");
}
