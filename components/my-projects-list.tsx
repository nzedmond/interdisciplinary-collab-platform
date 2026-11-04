"use client";

import Link from "next/link";
import { BriefcaseBusiness, Clock, Mail, MessageSquareText, Plus, UserRound, UserRoundCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { ApplicantDecision } from "@/components/applicant-decision";
import type { Application, OwnedProjectApplication, Project } from "@/lib/types";

const projectStatuses: Project["status"][] = ["open", "reviewing", "filled"];

function projectStatusLabel(status: Project["status"]) {
  if (status === "reviewing") {
    return "Reviewing";
  }

  if (status === "filled") {
    return "Filled";
  }

  return "Open";
}

function projectStatusStyles(status: Project["status"]) {
  if (status === "reviewing") {
    return "bg-gold/20 text-ink";
  }

  if (status === "filled") {
    return "bg-ink/10 text-ink";
  }

  return "bg-moss/10 text-moss";
}

function isProjectStatus(value: string): value is Project["status"] {
  return projectStatuses.includes(value as Project["status"]);
}

function ApplicantCounts({ applications }: { applications: OwnedProjectApplication[] }) {
  if (applications.length === 0) {
    return null;
  }

  const count = (status: Application["status"]) =>
    applications.filter((application) => application.status === status).length;
  const parts = [
    `${applications.length} total`,
    count("submitted") ? `${count("submitted")} new` : null,
    count("interview") ? `${count("interview")} interviewing` : null,
    count("accepted") ? `${count("accepted")} accepted` : null
  ].filter(Boolean);

  return <span className="text-xs font-normal text-ink/55">· {parts.join(" · ")}</span>;
}

export function MyProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<OwnedProjectApplication[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProjects() {
      try {
        setIsLoadingProjects(true);
        setProjectError(null);

        const response = await fetch("/api/projects/mine", {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Projects could not be loaded.");
        }

        const data = (await response.json()) as { projects: Project[] };
        setProjects(data.projects);

        const applicationsResponse = await fetch("/api/projects/mine/applications", {
          signal: controller.signal
        });

        if (!applicationsResponse.ok) {
          throw new Error("Applications could not be loaded.");
        }

        const applicationsData = (await applicationsResponse.json()) as {
          applications: OwnedProjectApplication[];
        };
        setApplications(applicationsData.applications);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setProjectError("Your projects could not be loaded.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingProjects(false);
        }
      }
    }

    loadProjects();

    return () => controller.abort();
  }, []);

  // ApplicantDecision saves the change; keep this list's copy in sync for the counts.
  function syncApplicationStatus(applicationId: string, status: Application["status"]) {
    setApplications((currentApplications) =>
      currentApplications.map((application) =>
        application.id === applicationId ? { ...application, status } : application
      )
    );
  }

  async function updateProjectStatus(projectId: string, status: Project["status"]) {
    const previousProjects = projects;

    setProjects((currentProjects) =>
      currentProjects.map((project) => (project.id === projectId ? { ...project, status } : project))
    );

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error("Project status could not be updated.");
      }

      const data = (await response.json()) as {
        project: Project;
      };

      setProjects((currentProjects) =>
        currentProjects.map((project) => (project.id === projectId ? data.project : project))
      );
    } catch {
      setProjects(previousProjects);
    }
  }

  if (isLoadingProjects) {
    return (
      <section className="rounded-lg border border-ink/10 bg-white p-8 text-center shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Loading projects</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/65">
          Fetching your posted projects from the database.
        </p>
      </section>
    );
  }

  if (projectError) {
    return (
      <section className="rounded-lg border border-coral/30 bg-white p-8 text-center shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Projects unavailable</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/65">{projectError}</p>
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section className="rounded-lg border border-ink/10 bg-white p-8 text-center shadow-soft">
        <h2 className="text-lg font-semibold text-ink">No posted projects yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/65">
          Database-backed projects you post will appear here.
        </p>
        <Link
          href="/projects/new"
          className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
        >
          <Plus className="h-4 w-4" />
          Post project
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {projects.map((project) => (
        <article key={project.id} className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${projectStatusStyles(project.status)}`}
                >
                  {projectStatusLabel(project.status)}
                </span>
                <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-semibold text-blue">
                  {project.category}
                </span>
                <label className="flex items-center gap-2 rounded-md border border-ink/15 bg-white px-2 py-1">
                  <span className="sr-only">Project status</span>
                  <select
                    value={project.status}
                    onChange={(event) => {
                      if (!isProjectStatus(event.target.value)) {
                        return;
                      }
                      updateProjectStatus(project.id, event.target.value);
                    }}
                    className="focus-ring bg-transparent text-xs font-semibold text-ink outline-none"
                  >
                    {projectStatuses.map((status) => (
                      <option key={status} value={status}>
                        {projectStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <h2 className="text-xl font-semibold text-ink">{project.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/70">{project.description}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm text-ink/75 sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4 text-coral" />
              {project.departments.join(", ")}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-coral" />
              {project.commitment}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {project.requiredSkills.map((skill) => (
              <span key={skill} className="rounded-full border border-ink/10 px-3 py-1 text-xs font-medium text-ink/75">
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-6 border-t border-ink/10 pt-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <UserRoundCheck className="h-4 w-4 text-moss" />
              Applicants
              <ApplicantCounts applications={applications.filter((application) => application.projectId === project.id)} />
            </h3>
            <div className="mt-3 space-y-3">
              {applications.filter((application) => application.projectId === project.id).length > 0 ? (
                applications
                  .filter((application) => application.projectId === project.id)
                  .map((application) => (
                    <div key={application.id} className="rounded-lg border border-ink/10 bg-paper p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/people/${application.applicantId}`}
                            className="text-sm font-semibold text-ink hover:text-moss hover:underline"
                          >
                            {application.applicantName}
                          </Link>
                          <p className="mt-1 text-xs text-ink/60">
                            {[application.applicantMajorOrTitle, application.applicantDepartment, `Applied ${application.submittedAt}`]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <ApplicantDecision
                          applicationId={application.id}
                          initialStatus={application.status}
                          onStatusChange={(status) => syncApplicationStatus(application.id, status)}
                        />
                      </div>

                      {application.message ? (
                        <p className="mt-3 flex gap-2 whitespace-pre-line text-sm leading-6 text-ink/70">
                          <MessageSquareText className="mt-1 h-4 w-4 shrink-0 text-coral" />
                          {application.message}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/people/${application.applicantId}`}
                          className="focus-ring inline-flex items-center gap-1 rounded-md border border-ink/15 bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-moss hover:text-moss"
                        >
                          <UserRound className="h-3 w-3" />
                          View profile
                        </Link>
                        <a
                          href={`mailto:${application.applicantEmail}?subject=${encodeURIComponent(
                            `Your application to "${application.projectTitle}"`
                          )}`}
                          className="focus-ring inline-flex items-center gap-1 rounded-md border border-ink/15 bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-moss hover:text-moss"
                        >
                          <Mail className="h-3 w-3" />
                          Email
                        </a>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="rounded-lg border border-ink/10 bg-paper p-4 text-sm text-ink/65">
                  No applicants yet.
                </p>
              )}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
