import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pendingSignup: {
      deleteMany: vi.fn(async () => ({ count: 0 })),
      count: vi.fn(async () => 0),
      create: vi.fn(async () => ({})),
      findUnique: vi.fn(),
      findMany: vi.fn(async () => []),
      delete: vi.fn(async () => ({}))
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(async () => ({})),
      create: vi.fn(async () => ({}))
    },
    $transaction: vi.fn(async (operations) => Promise.all(operations))
  }
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async () => ({ delivered: true })),
  isDevelopmentEmailFallback: vi.fn(() => false)
}));

import { prisma } from "@/lib/prisma";
import { isDevelopmentEmailFallback, sendEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { confirmSignup, hashToken, resendForUnverifiedLogin, sendVerificationEmail } from "./email-verification";

const details = {
  email: "new@college.edu",
  name: "New Student",
  role: "STUDENT",
  department: "History",
  passwordHash: "salt:hash"
};

function pending(overrides = {}) {
  return {
    tokenHash: "h",
    ...details,
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    ...overrides
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.pendingSignup.count).mockResolvedValue(0);
  vi.mocked(isDevelopmentEmailFallback).mockReturnValue(false);
});

describe("sendVerificationEmail", () => {
  it("stores only a hash of the token and emails the raw token", async () => {
    const result = await sendVerificationEmail(details);

    const stored = vi.mocked(prisma.pendingSignup.create).mock.calls[0][0].data;
    const emailed = vi.mocked(sendEmail).mock.calls[0][0];
    const token = new URL(emailed.text.match(/https?:\/\/\S+/)[0]).searchParams.get("token");

    expect(result).toEqual({ ok: true, devLink: undefined });
    expect(emailed.to).toBe("new@college.edu");
    expect(stored.tokenHash).toBe(hashToken(token));
    expect(stored.tokenHash).not.toBe(token);
    expect(stored.expiresAt.getTime()).toBeGreaterThan(Date.now() + 23 * 60 * 60 * 1000);
  });

  it("refuses after 3 emails to the same address in the window", async () => {
    vi.mocked(prisma.pendingSignup.count).mockResolvedValue(3);

    expect(await sendVerificationEmail(details)).toEqual({ ok: false, reason: "rate-limited" });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns the link for on-screen display only in the development fallback", async () => {
    vi.mocked(sendEmail).mockResolvedValueOnce({ delivered: false, loggedForDevelopment: true });
    vi.mocked(isDevelopmentEmailFallback).mockReturnValue(true);

    const result = await sendVerificationEmail(details);

    expect(result.devLink).toMatch(/\/verify-email\?token=/);
  });

  it("removes the pending sign-up when sending fails", async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("SMTP down"));

    await expect(sendVerificationEmail(details)).rejects.toThrow("SMTP down");
    const { tokenHash } = vi.mocked(prisma.pendingSignup.create).mock.calls[0][0].data;
    expect(prisma.pendingSignup.delete).toHaveBeenCalledWith({ where: { tokenHash } });
  });

  it("escapes the name in the HTML email", async () => {
    await sendVerificationEmail({ ...details, name: "<script>x</script>" });

    expect(vi.mocked(sendEmail).mock.calls[0][0].html).not.toContain("<script>");
  });
});

describe("confirmSignup", () => {
  it("rejects unknown tokens", async () => {
    vi.mocked(prisma.pendingSignup.findUnique).mockResolvedValue(null);

    expect(await confirmSignup("nope")).toEqual({ status: "invalid" });
  });

  it("rejects and deletes expired tokens", async () => {
    vi.mocked(prisma.pendingSignup.findUnique).mockResolvedValue(pending({ expiresAt: new Date(Date.now() - 1) }));

    expect(await confirmSignup("t")).toEqual({ status: "expired", email: details.email });
    expect(prisma.pendingSignup.delete).toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("creates a verified account for a new email", async () => {
    vi.mocked(prisma.pendingSignup.findUnique).mockResolvedValue(pending());
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    expect(await confirmSignup("t")).toEqual({ status: "verified", email: details.email });
    const created = vi.mocked(prisma.user.create).mock.calls[0][0].data;
    expect(created).toMatchObject({ email: details.email, passwordHash: "salt:hash", role: "STUDENT" });
    expect(created.emailVerifiedAt).toBeInstanceOf(Date);
    expect(prisma.pendingSignup.deleteMany).toHaveBeenCalledWith({ where: { email: details.email } });
  });

  it("never overwrites the password of an already verified account", async () => {
    vi.mocked(prisma.pendingSignup.findUnique).mockResolvedValue(pending());
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      emailVerifiedAt: new Date(),
      passwordHash: "existing"
    });

    expect(await confirmSignup("t")).toEqual({ status: "already-verified", email: details.email });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("claims a passwordless account but keeps its role", async () => {
    vi.mocked(prisma.pendingSignup.findUnique).mockResolvedValue(pending({ role: "FACULTY" }));
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u2",
      role: "STUDENT",
      department: "Music",
      emailVerifiedAt: null,
      passwordHash: null
    });

    expect((await confirmSignup("t")).status).toBe("verified");
    const update = vi.mocked(prisma.user.update).mock.calls[0][0];
    expect(update.where).toEqual({ id: "u2" });
    expect(update.data).not.toHaveProperty("role");
    expect(update.data.department).toBe("Music");
    expect(update.data.passwordHash).toBe("salt:hash");
  });
});

describe("resendForUnverifiedLogin", () => {
  it("resends only when the password matches a pending sign-up", async () => {
    vi.mocked(prisma.pendingSignup.findMany).mockResolvedValue([
      pending({ passwordHash: await hashPassword("correct-password") })
    ]);

    expect(await resendForUnverifiedLogin(details.email, "wrong-password")).toBeNull();
    expect(sendEmail).not.toHaveBeenCalled();

    expect(await resendForUnverifiedLogin(details.email, "correct-password")).toEqual({ ok: true, devLink: undefined });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
