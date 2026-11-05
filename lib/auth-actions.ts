"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { EmailNotConfiguredError } from "@/lib/email";
import { resendForUnverifiedLogin, sendVerificationEmail, type VerificationEmailResult } from "@/lib/email-verification";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";

export type AuthFormState = {
  error?: string;
  // Echoed back so the form keeps what the user typed after an error.
  values?: { name?: string; email?: string; department?: string; role?: string };
  // Set once a verification email has gone out: the form shows "check your inbox".
  verificationSentTo?: string;
  // Local development without an email server only: the link, shown on screen.
  devVerificationLink?: string;
};

const rateLimitedMessage = "Too many verification emails for this address. Wait 15 minutes and try again.";

function verificationState(email: string, result: VerificationEmailResult): AuthFormState {
  if (!result.ok) {
    return { error: rateLimitedMessage, values: { email } };
  }

  return { verificationSentTo: email, devVerificationLink: result.devLink, values: { email } };
}

// Server actions have no Request object; build one from the incoming headers so the
// shared IP-based rate limiter can be used.
async function rateLimitByClient(bucket: string, limit: number) {
  return enforceRateLimit(new Request("http://localhost", { headers: await headers() }), {
    bucket,
    limit,
    windowMs: 15 * 60 * 1000
  });
}

const universityEmailPattern = /^[^\s@]+@[^\s@]+\.edu$/i;

// Only ever redirect within this site: keep the path and query of callbackUrl,
// whatever host it names, so it can't send people to another domain.
function safeRedirectPath(callbackUrl: FormDataEntryValue | null) {
  try {
    const url = new URL(String(callbackUrl ?? "/"), "http://localhost");
    const path = `${url.pathname}${url.search}`;

    return path.startsWith("/login") || path.startsWith("/signup") ? "/" : path;
  } catch {
    return "/";
  }
}

async function signInWithCredentials(
  email: string,
  password: string,
  redirectTo = "/"
): Promise<AuthFormState> {
  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    // signIn throws a redirect on success; only swallow real auth failures.
    if (error instanceof AuthError) {
      // Signed up but never confirmed? If the password matches their pending sign-up,
      // send a fresh link instead of a confusing "doesn't match".
      const resent = await resendForUnverifiedLogin(email, password).catch((sendError) => {
        console.error("[login] could not resend verification email", sendError);
        return null;
      });
      if (resent) {
        return {
          ...verificationState(email, resent),
          error: resent.ok ? "Confirm your email before signing in. We sent you a new link." : rateLimitedMessage
        };
      }

      return { error: "That email and password don't match an account.", values: { email } };
    }

    throw error;
  }

  return {};
}

export async function loginAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password.", values: { email } };
  }

  return signInWithCredentials(email, password, safeRedirectPath(formData.get("callbackUrl")));
}

export async function signupAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "faculty" ? "FACULTY" : "STUDENT";
  const department = String(formData.get("department") ?? "").trim();
  const values = { name, email, department, role: role === "FACULTY" ? "faculty" : "student" };

  if (name.length < 2) {
    return { error: "Enter your full name.", values };
  }

  if (!universityEmailPattern.test(email)) {
    return { error: "Use your university email address (ending in .edu).", values };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", values };
  }

  const rateLimit = await rateLimitByClient("signup", 10);
  if (!rateLimit.allowed) {
    return { error: `Too many sign-up attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.`, values };
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { passwordHash: true } });

  if (existing?.passwordHash) {
    return { error: "An account with that email already exists. Sign in instead.", values };
  }

  try {
    // No account is created or changed until the emailed link is confirmed. (An existing
    // passwordless account, e.g. a seeded project owner, is claimed at that point.)
    const result = await sendVerificationEmail({
      email,
      name,
      role,
      department: department || null,
      passwordHash: await hashPassword(password)
    });
    return result.ok ? verificationState(email, result) : { error: rateLimitedMessage, values };
  } catch (error) {
    if (error instanceof EmailNotConfiguredError) {
      console.error(error.message);
      return { error: "Sign-up is unavailable because email isn't set up on this server. Contact an admin.", values };
    }
    console.error("[signup] verification email failed", error);
    return { error: "We couldn't send the verification email. Try again in a few minutes.", values };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
