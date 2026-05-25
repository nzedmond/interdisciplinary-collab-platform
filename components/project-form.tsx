"use client";

import Link from "next/link";
import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { categories, departments } from "@/lib/data";
import { saveProjectDraft } from "@/lib/project-drafts";
import type { Project } from "@/lib/types";

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProjectForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("Computer Science");
  const [category, setCategory] = useState(categories[1]);
  const [requiredSkills, setRequiredSkills] = useState("");
  const [helpfulSkills, setHelpfulSkills] = useState("");
  const [commitment, setCommitment] = useState("3-5 hrs/week");
  const [duration, setDuration] = useState("Spring semester");
  const [goals, setGoals] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        description,
        departments: [department],
        category,
        requiredSkills: splitList(requiredSkills),
        helpfulSkills: splitList(helpfulSkills),
        commitment,
        duration,
        goals: splitList(goals)
      })
    });

    const data = (await response.json()) as { error?: string; project?: Project };

    if (!response.ok || !data.project) {
      setError(data.error ?? "Project could not be posted.");
      setIsSubmitting(false);
      return;
    }

    saveProjectDraft(data.project);
    setCreatedProjectId(data.project.id);
    setIsSubmitting(false);
  }

  if (createdProjectId) {
    return (
      <section className="rounded-lg border border-moss/20 bg-white p-6 shadow-soft">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-moss" />
          <div>
            <h2 className="text-lg font-semibold text-ink">Project draft created</h2>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              This MVP generated draft ID {createdProjectId}. The next database milestone will persist new postings.
            </p>
            <Link
              href="/projects/mine"
              className="focus-ring mt-5 inline-flex items-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
            >
              View my projects
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="text-sm font-semibold text-ink">Project title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
            placeholder="Community Climate Storytelling Lab"
          />
        </label>

        <label>
          <span className="text-sm font-semibold text-ink">Department</span>
          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
          >
            {departments
              .filter((item) => item !== "All departments")
              .map((item) => (
                <option key={item}>{item}</option>
              ))}
          </select>
        </label>

        <label>
          <span className="text-sm font-semibold text-ink">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
          >
            {categories
              .filter((item) => item !== "All categories")
              .map((item) => (
                <option key={item}>{item}</option>
              ))}
          </select>
        </label>

        <label className="md:col-span-2">
          <span className="text-sm font-semibold text-ink">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="focus-ring mt-2 min-h-36 w-full resize-y rounded-md border border-ink/15 bg-white px-3 py-2 text-sm leading-6 text-ink"
            placeholder="Describe the project, who it serves, and what collaborators will help build or study."
          />
        </label>

        <label>
          <span className="text-sm font-semibold text-ink">Required skills</span>
          <input
            value={requiredSkills}
            onChange={(event) => setRequiredSkills(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
            placeholder="Python, interviews, visual design"
          />
        </label>

        <label>
          <span className="text-sm font-semibold text-ink">Helpful skills</span>
          <input
            value={helpfulSkills}
            onChange={(event) => setHelpfulSkills(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
            placeholder="GIS, audio editing, public writing"
          />
        </label>

        <label>
          <span className="text-sm font-semibold text-ink">Time commitment</span>
          <input
            value={commitment}
            onChange={(event) => setCommitment(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
          />
        </label>

        <label>
          <span className="text-sm font-semibold text-ink">Duration</span>
          <input
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
          />
        </label>

        <label className="md:col-span-2">
          <span className="text-sm font-semibold text-ink">Collaboration goals</span>
          <input
            value={goals}
            onChange={(event) => setGoals(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
            placeholder="Build prototype, run interviews, publish exhibit"
          />
        </label>
      </div>

      {error ? (
        <p className="mt-5 rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="focus-ring mt-6 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-65"
      >
        <Send className="h-4 w-4" />
        {isSubmitting ? "Posting" : "Post project"}
      </button>
    </form>
  );
}
