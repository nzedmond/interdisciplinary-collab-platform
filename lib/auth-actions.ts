"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export type AuthFormState = {
  error?: string;
  // Echoed back so the form keeps what the user typed after an error.
  values?: { name?: string; email?: string; department?: string; role?: string };
};

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

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.passwordHash) {
    return { error: "An account with that email already exists. Sign in instead.", values };
  }

  const passwordHash = await hashPassword(password);

  // A user row may already exist without a password (e.g. a seeded project owner); claim it.
  await prisma.user.upsert({
    where: { email },
    update: { name, role, department: department || null, passwordHash },
    create: { email, name, role, department: department || null, passwordHash }
  });

  return signInWithCredentials(email, password);
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
