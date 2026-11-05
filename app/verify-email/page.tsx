import Link from "next/link";
import { MailCheck, MailX } from "lucide-react";
import { confirmEmailAction } from "./actions";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string | string[]; status?: string | string[] }>;
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-moss text-sm font-bold text-white">CC</div>
        <div>
          <p className="text-sm font-semibold text-ink">Collab Commons</p>
          <p className="text-xs text-ink/60">Interdisciplinary project discovery</p>
        </div>
      </div>
      <section className="rounded-lg border border-ink/10 bg-white/90 p-6 shadow-soft">{children}</section>
    </main>
  );
}

// Confirming takes a button press (a POST), not just opening the link: some school
// email systems pre-open links to scan them, which would otherwise use up the link.
export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token, status } = await searchParams;

  if (status === "expired" || status === "invalid" || typeof token !== "string" || !token) {
    return (
      <Shell>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-normal text-ink">
          <MailX className="h-6 w-6 text-coral" />
          {status === "expired" ? "This link has expired" : "This link isn't valid"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink/70">
          {status === "expired"
            ? "Confirmation links last 24 hours."
            : "It may have been used already, replaced by a newer link, or copied incompletely."}{" "}
          Sign in with the email and password you chose and we&apos;ll send a new link, or sign up again.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/login" className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="focus-ring rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-moss hover:text-moss"
          >
            Sign up
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-normal text-ink">
        <MailCheck className="h-6 w-6 text-moss" />
        Confirm your email
      </h1>
      <p className="mt-3 text-sm leading-6 text-ink/70">One more step to finish creating your Collab Commons account.</p>
      <form action={confirmEmailAction} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
        >
          Confirm my email
        </button>
      </form>
    </Shell>
  );
}
