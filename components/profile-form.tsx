"use client";

import { Save, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { UserProfile } from "@/lib/types";

type ProfileResponse = {
  profile: UserProfile;
};

function listToText(values: string[]) {
  return values.join(", ");
}

function textToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProfileForm() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [majorOrTitle, setMajorOrTitle] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/profile", {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Profile could not be loaded.");
        }

        const data = (await response.json()) as ProfileResponse;
        const nextProfile = data.profile;

        setProfile(nextProfile);
        setName(nextProfile.name);
        setDepartment(nextProfile.department ?? "");
        setMajorOrTitle(nextProfile.majorOrTitle ?? "");
        setGraduationYear(nextProfile.graduationYear ? String(nextProfile.graduationYear) : "");
        setPortfolioUrl(nextProfile.portfolioUrl ?? "");
        setGithubUrl(nextProfile.githubUrl ?? "");
        setSkills(listToText(nextProfile.skills));
        setInterests(listToText(nextProfile.interests));
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        setError("Profile could not be loaded.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => controller.abort();
  }, []);

  const skillCount = useMemo(() => textToList(skills).length, [skills]);
  const interestCount = useMemo(() => textToList(interests).length, [interests]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        department,
        majorOrTitle,
        graduationYear: graduationYear ? Number(graduationYear) : null,
        portfolioUrl,
        githubUrl,
        skills: textToList(skills),
        interests: textToList(interests)
      })
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Profile could not be updated.");
      setIsSaving(false);
      return;
    }

    const data = (await response.json()) as ProfileResponse;
    setProfile(data.profile);
    setSuccessMessage("Profile updated.");
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border border-ink/10 bg-white p-8 text-center shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Loading profile</h2>
        <p className="mt-2 text-sm text-ink/65">Fetching your latest profile details.</p>
      </section>
    );
  }

  if (error && !profile) {
    return (
      <section className="rounded-lg border border-coral/30 bg-white p-8 text-center shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Profile unavailable</h2>
        <p className="mt-2 text-sm text-ink/65">{error}</p>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
      <div className="grid gap-5 md:grid-cols-2">
        <label>
          <span className="text-sm font-semibold text-ink">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
          />
        </label>

        <label>
          <span className="text-sm font-semibold text-ink">Department</span>
          <input
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
          />
        </label>

        <label>
          <span className="text-sm font-semibold text-ink">Major or title</span>
          <input
            value={majorOrTitle}
            onChange={(event) => setMajorOrTitle(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
          />
        </label>

        <label>
          <span className="text-sm font-semibold text-ink">Graduation year</span>
          <input
            value={graduationYear}
            onChange={(event) => setGraduationYear(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
            placeholder="2027"
          />
        </label>

        <label>
          <span className="text-sm font-semibold text-ink">Portfolio URL</span>
          <input
            value={portfolioUrl}
            onChange={(event) => setPortfolioUrl(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
            placeholder="https://..."
          />
        </label>

        <label>
          <span className="text-sm font-semibold text-ink">GitHub URL</span>
          <input
            value={githubUrl}
            onChange={(event) => setGithubUrl(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
            placeholder="https://github.com/..."
          />
        </label>

        <label className="md:col-span-2">
          <span className="text-sm font-semibold text-ink">Skills (comma-separated)</span>
          <input
            value={skills}
            onChange={(event) => setSkills(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
            placeholder="Python, React, UX research"
          />
          <p className="mt-1 text-xs text-ink/55">{skillCount} listed</p>
        </label>

        <label className="md:col-span-2">
          <span className="text-sm font-semibold text-ink">Interests (comma-separated)</span>
          <input
            value={interests}
            onChange={(event) => setInterests(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
            placeholder="Climate justice, storytelling, accessible tech"
          />
          <p className="mt-1 text-xs text-ink/55">{interestCount} listed</p>
        </label>
      </div>

      {error ? (
        <p className="mt-5 rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-ink">{error}</p>
      ) : null}
      {successMessage ? (
        <p className="mt-5 rounded-md border border-moss/20 bg-moss/10 px-3 py-2 text-sm text-ink">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSaving}
        className="focus-ring mt-6 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-65"
      >
        <Save className="h-4 w-4" />
        {isSaving ? "Saving" : "Save profile"}
      </button>

      {profile ? (
        <p className="mt-4 flex items-center gap-2 text-xs text-ink/60">
          <UserRound className="h-4 w-4" />
          Signed in as {profile.name}
        </p>
      ) : null}
    </form>
  );
}
