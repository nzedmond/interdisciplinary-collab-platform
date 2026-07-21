import { beforeEach, describe, expect, it, vi } from "vitest";

let activeUserId = null;
const state = {
  profiles: {
    "student-1": {
      id: "student-1",
      name: "Student One",
      role: "student",
      department: "Computer Science",
      majorOrTitle: "Data Science major",
      graduationYear: 2027,
      skills: ["Python"],
      interests: ["Civic tech"],
      portfolioUrl: null,
      githubUrl: null
    },
    "owner-1": {
      id: "owner-1",
      name: "Owner One",
      role: "faculty",
      department: "Media Studies",
      majorOrTitle: "Professor",
      graduationYear: null,
      skills: ["Mentoring"],
      interests: ["Public scholarship"],
      portfolioUrl: null,
      githubUrl: null
    }
  },
  projects: {},
  applications: {}
};

let projectCounter = 0;
let applicationCounter = 0;

vi.mock("@/lib/session-user", () => ({
  getSessionUserId: vi.fn(async () => activeUserId)
}));

vi.mock("@/lib/project-repository", () => ({
  createProject: vi.fn(async (input, userId) => {
    projectCounter += 1;
    const id = `project-${projectCounter}`;
    const project = {
      id,
      ...input,
      owner: userId,
      ownerRole: "Faculty",
      status: "open",
      applicants: 0,
      matchScore: 80,
      recommendationReason: "Flow test"
    };
    state.projects[id] = { ...project, ownerId: userId };
    return project;
  }),
  getProjects: vi.fn(async () =>
    Object.values(state.projects).map(({ ownerId, ...project }) => ({
      ...project,
      owner: ownerId
    }))
  ),
  getProjectById: vi.fn(async (id) => {
    const project = state.projects[id];
    if (!project) {
      return null;
    }

    const { ownerId, ...rest } = project;
    return { ...rest, owner: ownerId };
  }),
  getProjectAuthorizationContext: vi.fn(async (id) => {
    const project = state.projects[id];
    if (!project) {
      return null;
    }

    return {
      id,
      ownerId: project.ownerId,
      status: project.status === "open" ? "OPEN" : project.status === "reviewing" ? "REVIEWING" : "FILLED"
    };
  }),
  createApplication: vi.fn(async (input, userId) => {
    const project = state.projects[input.projectId];
    if (!project) {
      return null;
    }

    applicationCounter += 1;
    const id = `application-${applicationCounter}`;
    const application = {
      id,
      projectId: input.projectId,
      projectTitle: project.title,
      applicantName: userId,
      status: "submitted",
      submittedAt: "2026-07-21"
    };
    state.applications[id] = {
      ...application,
      ownerId: project.ownerId,
      applicantId: userId
    };
    project.applicants += 1;
    return application;
  }),
  getApplicationAuthorizationContext: vi.fn(async (id) => {
    const application = state.applications[id];
    if (!application) {
      return null;
    }

    return {
      id,
      project: {
        ownerId: application.ownerId
      }
    };
  }),
  updateOwnedProjectApplicationStatus: vi.fn(async (id, status, userId) => {
    const application = state.applications[id];
    if (!application || application.ownerId !== userId) {
      return null;
    }

    application.status = status;
    return {
      id: application.id,
      projectId: application.projectId,
      projectTitle: application.projectTitle,
      applicantName: application.applicantName,
      status: application.status,
      submittedAt: application.submittedAt
    };
  }),
  updateOwnedProjectStatus: vi.fn(async (projectId, status, userId) => {
    const project = state.projects[projectId];
    if (!project || project.ownerId !== userId) {
      return null;
    }

    project.status = status;
    const { ownerId, ...rest } = project;
    return { ...rest, owner: ownerId };
  }),
  getUserProfile: vi.fn(async (userId) => state.profiles[userId] ?? null),
  updateUserProfile: vi.fn(async (userId, input) => {
    if (!state.profiles[userId]) {
      return null;
    }

    state.profiles[userId] = {
      ...state.profiles[userId],
      ...input
    };
    return state.profiles[userId];
  }),
  getSavedProjectIds: vi.fn(async () => []),
  setSavedProject: vi.fn(async () => [])
}));

import { POST as createProjectRoute } from "@/app/api/projects/route";
import { POST as createApplicationRoute } from "@/app/api/projects/[id]/applications/route";
import { PATCH as updateApplicationRoute } from "@/app/api/applications/[id]/route";
import { PATCH as updateProjectRoute } from "@/app/api/projects/[id]/route";
import { PATCH as updateProfileRoute } from "@/app/api/profile/route";

function jsonRequest(url, method, body) {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("critical authenticated flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activeUserId = null;
    projectCounter = 0;
    applicationCounter = 0;
    state.projects = {};
    state.applications = {};
    state.profiles["student-1"] = {
      id: "student-1",
      name: "Student One",
      role: "student",
      department: "Computer Science",
      majorOrTitle: "Data Science major",
      graduationYear: 2027,
      skills: ["Python"],
      interests: ["Civic tech"],
      portfolioUrl: null,
      githubUrl: null
    };
  });

  it("covers profile edit, project post, apply, owner review, and owner status update", async () => {
    activeUserId = "student-1";
    const profileResponse = await updateProfileRoute(
      jsonRequest("http://localhost/api/profile", "PATCH", {
        name: "Maya Johnson",
        department: "Computer Science",
        majorOrTitle: "Data Science major",
        graduationYear: 2027,
        portfolioUrl: "https://portfolio.example",
        githubUrl: "https://github.com/maya",
        skills: ["Python", "React"],
        interests: ["Climate justice", "Public humanities"]
      })
    );
    expect(profileResponse.status).toBe(200);

    activeUserId = "owner-1";
    const projectResponse = await createProjectRoute(
      jsonRequest("http://localhost/api/projects", "POST", {
        title: "Cross-campus Story Mapping Lab",
        description:
          "Build a collaborative map and narrative archive that combines oral histories with local climate data.",
        departments: ["Media Studies", "Computer Science"],
        category: "Civic Data",
        requiredSkills: ["TypeScript"],
        helpfulSkills: ["Interview research"],
        commitment: "3-5 hrs/week",
        duration: "Semester",
        goals: ["Publish interactive prototype"]
      })
    );
    expect(projectResponse.status).toBe(201);
    const projectBody = await projectResponse.json();
    const projectId = projectBody.project.id;

    activeUserId = "student-1";
    const applicationResponse = await createApplicationRoute(
      jsonRequest("http://localhost/api/projects/project-1/applications", "POST", {
        message: "I can contribute React implementation and interview synthesis for this project.",
        availability: "3-5 hrs/week"
      }),
      { params: Promise.resolve({ id: projectId }) }
    );
    expect(applicationResponse.status).toBe(201);
    const applicationBody = await applicationResponse.json();
    const applicationId = applicationBody.application.id;

    activeUserId = "owner-1";
    const reviewResponse = await updateApplicationRoute(
      jsonRequest("http://localhost/api/applications/application-1", "PATCH", {
        status: "interview"
      }),
      { params: Promise.resolve({ id: applicationId }) }
    );
    expect(reviewResponse.status).toBe(200);

    const statusResponse = await updateProjectRoute(
      jsonRequest("http://localhost/api/projects/project-1", "PATCH", {
        status: "filled"
      }),
      { params: Promise.resolve({ id: projectId }) }
    );
    expect(statusResponse.status).toBe(200);
    const statusBody = await statusResponse.json();
    expect(statusBody.project.status).toBe("filled");
  });
});
