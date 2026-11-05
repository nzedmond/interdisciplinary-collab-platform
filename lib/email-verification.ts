import { createHash, randomBytes } from "node:crypto";
import { isDevelopmentEmailFallback, sendEmail } from "@/lib/email";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
// At most this many verification emails per address per window (stops inbox flooding).
export const MAX_EMAILS_PER_WINDOW = 3;
export const EMAIL_WINDOW_MS = 15 * 60 * 1000;

export type SignupDetails = {
  email: string;
  name: string;
  role: "STUDENT" | "FACULTY";
  department: string | null;
  passwordHash: string;
};

export type VerificationEmailResult =
  | { ok: true; devLink?: string }
  | { ok: false; reason: "rate-limited" };

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function appUrl() {
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

// Stores a pending sign-up and emails its confirmation link. Nothing about an existing
// account changes until the link is confirmed.
export async function sendVerificationEmail(details: SignupDetails): Promise<VerificationEmailResult> {
  const now = Date.now();

  await prisma.pendingSignup.deleteMany({ where: { expiresAt: { lt: new Date(now) } } });

  const recentEmails = await prisma.pendingSignup.count({
    where: { email: details.email, createdAt: { gt: new Date(now - EMAIL_WINDOW_MS) } }
  });
  if (recentEmails >= MAX_EMAILS_PER_WINDOW) {
    return { ok: false, reason: "rate-limited" };
  }

  const token = randomBytes(32).toString("base64url");
  await prisma.pendingSignup.create({
    data: { ...details, tokenHash: hashToken(token), expiresAt: new Date(now + VERIFICATION_TTL_MS) }
  });

  const link = `${appUrl()}/verify-email?token=${token}`;
  const result = await sendEmail({
    to: details.email,
    subject: "Confirm your Collab Commons account",
    text: [
      `Hi ${details.name},`,
      "",
      "Confirm your email to finish creating your Collab Commons account:",
      link,
      "",
      "The link expires in 24 hours. If you didn't sign up, ignore this email and nothing will change."
    ].join("\n"),
    html: `<p>Hi ${escapeHtml(details.name)},</p>
<p>Confirm your email to finish creating your Collab Commons account:</p>
<p><a href="${link}">Confirm my email</a></p>
<p>The link expires in 24 hours. If you didn't sign up, ignore this email and nothing will change.</p>`
  });

  return { ok: true, devLink: "loggedForDevelopment" in result && isDevelopmentEmailFallback() ? link : undefined };
}

export type ConfirmResult =
  | { status: "verified"; email: string }
  | { status: "already-verified"; email: string }
  | { status: "expired"; email: string }
  | { status: "invalid" };

export async function confirmSignup(token: string): Promise<ConfirmResult> {
  if (!token) {
    return { status: "invalid" };
  }

  const pending = await prisma.pendingSignup.findUnique({ where: { tokenHash: hashToken(token) } });

  if (!pending) {
    return { status: "invalid" };
  }

  if (pending.expiresAt.getTime() < Date.now()) {
    await prisma.pendingSignup.delete({ where: { tokenHash: pending.tokenHash } });
    return { status: "expired", email: pending.email };
  }

  const existing = await prisma.user.findUnique({ where: { email: pending.email } });

  // A verified account with a password already exists: never let an old or stray link
  // overwrite its password.
  if (existing?.emailVerifiedAt && existing.passwordHash) {
    await prisma.pendingSignup.deleteMany({ where: { email: pending.email } });
    return { status: "already-verified", email: pending.email };
  }

  await prisma.$transaction([
    existing
      ? // Claiming an account that exists without a password (e.g. a project owner added
        // by the seed). Keep its role so a sign-up form can't change it.
        prisma.user.update({
          where: { id: existing.id },
          data: {
            name: pending.name,
            department: existing.department ?? pending.department,
            passwordHash: pending.passwordHash,
            emailVerifiedAt: new Date()
          }
        })
      : prisma.user.create({
          data: {
            email: pending.email,
            name: pending.name,
            role: pending.role,
            department: pending.department,
            passwordHash: pending.passwordHash,
            emailVerifiedAt: new Date()
          }
        }),
    // Other pending links for this address are now stale.
    prisma.pendingSignup.deleteMany({ where: { email: pending.email } })
  ]);

  return { status: "verified", email: pending.email };
}

// For someone who signed up but hasn't confirmed yet and tries to sign in: if the password
// matches their pending sign-up, send a fresh link. Returns null when there's no match,
// so it reveals nothing about addresses without the right password.
export async function resendForUnverifiedLogin(email: string, password: string) {
  const pendings = await prisma.pendingSignup.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  for (const pending of pendings) {
    if (await verifyPassword(password, pending.passwordHash)) {
      return sendVerificationEmail({
        email: pending.email,
        name: pending.name,
        role: pending.role === "FACULTY" ? "FACULTY" : "STUDENT",
        department: pending.department,
        passwordHash: pending.passwordHash
      });
    }
  }

  return null;
}
