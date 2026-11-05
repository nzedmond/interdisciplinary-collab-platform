"use client";

import Link from "next/link";
import { CheckCircle2, LogIn, MailCheck, UserPlus } from "lucide-react";
import { useActionState } from "react";
import { loginAction, signupAction, type AuthFormState } from "@/lib/auth-actions";
import { departments } from "@/lib/data";

type AuthFormProps = {
  mode: "login" | "signup";
  // Where to go after signing in; validated server-side to stay on this site.
  callbackUrl?: string;
  // Shown on the login page after someone confirms their email.
  notice?: string;
};

const inputClass = "focus-ring mt-1 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink";
const labelClass = "block text-sm font-semibold text-ink";

export function AuthForm({ mode, callbackUrl, notice }: AuthFormProps) {
  const isSignup = mode === "signup";
  const [state, formAction, isPending] = useActionState<AuthFormState, FormData>(
    isSignup ? signupAction : loginAction,
    {}
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-moss text-sm font-bold text-white">
          CC
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Collab Commons</p>
          <p className="text-xs text-ink/60">Interdisciplinary project discovery</p>
        </div>
      </div>

      <section className="rounded-lg border border-ink/10 bg-white/90 p-6 shadow-soft">
        <h1 className="text-2xl font-bold tracking-normal text-ink">
          {isSignup ? "Create your account" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink/70">
          {isSignup
            ? "Join with your university email to find and post campus projects."
            : "Use your university email to continue."}
        </p>

        {notice && !state.error ? (
          <p className="mt-4 flex gap-2 rounded-md border border-moss/30 bg-moss/10 px-3 py-2 text-sm text-moss">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {notice}
          </p>
        ) : null}

        {isSignup && state.verificationSentTo ? (
          <VerificationSent email={state.verificationSentTo} devLink={state.devVerificationLink} />
        ) : (
          <form action={formAction} className="mt-6 space-y-4">
            {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
            {isSignup ? (
              <label className={labelClass}>
                Full name
                <input name="name" required autoComplete="name" defaultValue={state.values?.name} className={inputClass} />
              </label>
            ) : null}
  
            <label className={labelClass}>
              University email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                defaultValue={state.values?.email}
                placeholder="you@university.edu"
                className={inputClass}
              />
            </label>
  
            <label className={labelClass}>
              Password
              <input
                name="password"
                type="password"
                required
                minLength={isSignup ? 8 : undefined}
                autoComplete={isSignup ? "new-password" : "current-password"}
                className={inputClass}
              />
            </label>
  
            {isSignup ? (
              <>
                <fieldset>
                  <legend className={labelClass}>I am a</legend>
                  <div className="mt-2 flex gap-4 text-sm text-ink">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="role" value="student" defaultChecked={state.values?.role !== "faculty"} /> Student
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="role" value="faculty" defaultChecked={state.values?.role === "faculty"} /> Faculty or staff
                    </label>
                  </div>
                </fieldset>
  
                <label className={labelClass}>
                  Department
                  <select
                    // Remount after each submit so the echoed value is applied after React resets the form.
                    key={JSON.stringify(state)}
                    name="department"
                    className={inputClass}
                    defaultValue={state.values?.department ?? ""}
                  >
                    <option value="">Choose later</option>
                    {departments.slice(1).map((department) => (
                      <option key={department}>{department}</option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
  
            {state.error ? (
              <p role="alert" className="rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
                {state.error}
              </p>
            ) : null}
  
            {!isSignup && state.devVerificationLink ? <DevLink link={state.devVerificationLink} /> : null}
  
            <button
              type="submit"
              disabled={isPending}
              className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-60"
            >
              {isSignup ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              {isPending ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-ink/70">
          {isSignup ? "Already have an account? " : "New here? "}
          <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-moss hover:underline">
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </main>
  );
}

function DevLink({ link }: { link: string }) {
  return (
    <div className="rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-xs leading-5 text-ink">
      <p className="font-semibold">Development mode: no email server is configured.</p>
      <p className="mt-1">The email wasn&apos;t sent. Use this link (it is also in the server log):</p>
      <a href={link} className="mt-1 block break-all font-semibold text-moss underline">
        {link}
      </a>
    </div>
  );
}

function VerificationSent({ email, devLink }: { email: string; devLink?: string }) {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-3 rounded-md border border-moss/30 bg-moss/10 p-4">
        <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-moss" />
        <div className="text-sm leading-6 text-ink">
          <p className="font-semibold">Check your inbox</p>
          <p className="mt-1 text-ink/75">
            We sent a confirmation link to <strong>{email}</strong>. Open it within 24 hours to finish creating your
            account. You can&apos;t sign in until you do.
          </p>
        </div>
      </div>
      {devLink ? <DevLink link={devLink} /> : null}
      <p className="text-sm text-ink/60">
        No email after a few minutes? Check spam, or{" "}
        <Link href="/login" className="font-semibold text-moss hover:underline">
          sign in
        </Link>{" "}
        with the password you chose and we&apos;ll send a new link.
      </p>
    </div>
  );
}
