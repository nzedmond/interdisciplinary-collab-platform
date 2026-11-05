"use server";

import { redirect } from "next/navigation";
import { confirmSignup } from "@/lib/email-verification";

export async function confirmEmailAction(formData: FormData) {
  const result = await confirmSignup(String(formData.get("token") ?? ""));

  if (result.status === "verified" || result.status === "already-verified") {
    // The email address is deliberately left out of the URL (browser history, logs).
    redirect(`/login?verified=${result.status}`);
  }

  redirect(`/verify-email?status=${result.status}`);
}
