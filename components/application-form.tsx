"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";

type ApplicationFormProps = {
  projectId: string;
};

const availabilityOptions = [
  "1-3 hrs/week",
  "3-5 hrs/week",
  "5-7 hrs/week",
  "8+ hrs/week"
];

export function ApplicationForm({ projectId }: ApplicationFormProps) {
  const [message, setMessage] = useState("");
  const [availability, setAvailability] = useState(availabilityOptions[1]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch(`/api/projects/${projectId}/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        availability
      })
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Application could not be submitted.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitted(true);
    setIsSubmitting(false);
  }

  if (isSubmitted) {
    return (
      <section className="rounded-lg border border-moss/20 bg-white p-6 shadow-soft">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-moss" />
          <div>
            <h2 className="text-lg font-semibold text-ink">Application submitted</h2>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              Your interest has been recorded for this MVP. The next milestone can store this in the database.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
      <div>
        <label htmlFor="availability" className="text-sm font-semibold text-ink">
          Weekly availability
        </label>
        <select
          id="availability"
          value={availability}
          onChange={(event) => setAvailability(event.target.value)}
          className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
        >
          {availabilityOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <label htmlFor="message" className="text-sm font-semibold text-ink">
          Interest note
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="focus-ring mt-2 min-h-40 w-full resize-y rounded-md border border-ink/15 bg-white px-3 py-2 text-sm leading-6 text-ink"
          placeholder="Share why this project interests you and what you could contribute."
        />
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-65"
      >
        <Send className="h-4 w-4" />
        {isSubmitting ? "Submitting" : "Submit application"}
      </button>
    </form>
  );
}
