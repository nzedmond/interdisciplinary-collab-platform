import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { embedTexts } from "@/lib/embeddings";
import { cosineSimilarity, profileText, projectText, scoreMatch, type MatchableProfile } from "@/lib/matching";
import { getSessionUserId } from "@/lib/session-user";
import type { Prisma } from "@prisma/client";
import type { Application, OwnedProjectApplication, Project, UserProfile } from "@/lib/types";

type ProjectWithRelations = Awaited<ReturnType<typeof fetchProjectById>>;

function mapProjectStatus(status: string): Project["status"] {
  if (status === "REVIEWING") {
    return "reviewing";
  }

  if (status === "FILLED" || status === "ARCHIVED") {
    return "filled";
  }

  return "open";
}

function mapApplicationStatus(status: string): Application["status"] {
  if (status === "INTERVIEW") {
    return "interview";
  }

  if (status === "ACCEPTED") {
    return "accepted";
  }

  if (status === "DECLINED") {
    return "declined";
  }

  return "submitted";
}

function toDatabaseApplicationStatus(status: Application["status"]) {
  if (status === "interview") {
    return "INTERVIEW";
  }

  if (status === "accepted") {
    return "ACCEPTED";
  }

  if (status === "declined") {
    return "DECLINED";
  }

  return "SUBMITTED";
}

function toDatabaseProjectStatus(status: Project["status"]) {
  if (status === "reviewing") {
    return "REVIEWING";
  }

  if (status === "filled") {
    return "FILLED";
  }

  return "OPEN";
}

function mapRole(role: string) {
  if (role === "FACULTY") {
    return "faculty" as const;
  }

  if (role === "ADMIN") {
    return "admin" as const;
  }

  return "student" as const;
}

function roleLabel(role: string, majorOrTitle?: string | null): Project["ownerRole"] {
  if (majorOrTitle?.toLowerCase().includes("staff")) {
    return "Staff";
  }

  if (role === "FACULTY" || majorOrTitle?.toLowerCase().startsWith("prof")) {
    return "Faculty";
  }

  return "Student";
}

// Match scores are personal: each project is compared with the signed-in viewer's
// profile. Loaded once per request; null when nobody is signed in.
const getViewerProfile = cache(async (): Promise<MatchableProfile | null> => {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      majorOrTitle: true,
      department: true,
      bio: true,
      experience: true,
      coursework: true,
      skills: { select: { skill: { select: { name: true } } } },
      interests: { select: { interest: { select: { name: true } } } }
    }
  });

  return user
    ? {
        ...user,
        skills: user.skills.map(({ skill }) => skill.name),
        interests: user.interests.map(({ interest }) => interest.name)
      }
    : null;
});

const emptyProfile: MatchableProfile = { skills: [], interests: [] };
let hasWarnedAboutEmbeddings = false;

type UnscoredProject = Omit<
  Project,
  "matchScore" | "recommendationReason" | "semanticScore" | "keywordScore" | "matchMethod"
>;

// Adds match scores and reasons. Uses the local embedding model when it's available,
// and falls back to keyword (exact skill) matching if it can't load, so pages never break.
async function withMatches(projects: UnscoredProject[]): Promise<Project[]> {
  const profile = (await getViewerProfile()) ?? emptyProfile;
  const viewerText = profileText(profile);
  const tags = [
    ...profile.skills.map((tag) => ({ tag, kind: "skill" as const })),
    ...profile.interests.map((tag) => ({ tag, kind: "interest" as const }))
  ];
  let vectors: Map<string, number[]> | null = null;

  if (viewerText && projects.length > 0) {
    try {
      vectors = await embedTexts([viewerText, ...tags.map(({ tag }) => tag), ...projects.map(projectText)]);
    } catch (error) {
      if (!hasWarnedAboutEmbeddings) {
        hasWarnedAboutEmbeddings = true;
        console.warn("[matching] embedding model unavailable; using keyword matching instead.", error);
      }
    }
  }

  const viewerVector = vectors?.get(viewerText);

  return projects.map((project) => {
    const projectVector = vectors?.get(projectText(project));
    const canUseEmbeddings = Boolean(viewerVector && projectVector);
    const match = scoreMatch({
      project,
      profile,
      similarity: canUseEmbeddings ? cosineSimilarity(viewerVector!, projectVector!) : null,
      tagSimilarities: canUseEmbeddings
        ? tags.flatMap(({ tag, kind }) => {
            const tagVector = vectors!.get(tag);
            return tagVector ? [{ tag, kind, similarity: cosineSimilarity(tagVector, projectVector!) }] : [];
          })
        : []
    });

    return { ...project, ...match };
  });
}

async function withMatch(project: UnscoredProject) {
  return (await withMatches([project]))[0];
}

function mapProject(project: NonNullable<ProjectWithRelations>): UnscoredProject {
  const requiredSkills = project.skills
    .filter((projectSkill) => projectSkill.required)
    .map((projectSkill) => projectSkill.skill.name);
  const helpfulSkills = project.skills
    .filter((projectSkill) => !projectSkill.required)
    .map((projectSkill) => projectSkill.skill.name);

  return {
    id: project.id,
    title: project.title,
    owner: project.owner.name,
    ownerRole: roleLabel(project.owner.role, project.owner.majorOrTitle),
    departments: project.departments,
    category: project.category,
    description: project.description,
    requiredSkills,
    helpfulSkills,
    commitment: project.commitment,
    duration: project.duration,
    goals: project.goals,
    status: mapProjectStatus(project.status),
    applicants: project._count.applications,
    verified: Boolean(project.verifiedAt),
    archived: project.status === "ARCHIVED"
  };
}

async function fetchProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      owner: true,
      skills: {
        include: {
          skill: true
        },
        orderBy: {
          skill: {
            name: "asc"
          }
        }
      },
      _count: {
        select: {
          applications: true
        }
      }
    }
  });
}

export async function getProjectAuthorizationContext(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      ownerId: true,
      status: true
    }
  });
}

export async function getApplicationAuthorizationContext(applicationId: string) {
  return prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      project: {
        select: {
          ownerId: true
        }
      }
    }
  });
}

async function findOrCreateSkill(name: string) {
  return prisma.skill.upsert({
    where: { name },
    update: {},
    create: { name }
  });
}

async function createProjectSkills(projectId: string, skills: string[], required: boolean) {
  await Promise.all(
    skills.map(async (name) => {
      const skill = await findOrCreateSkill(name);

      await prisma.projectSkill.upsert({
        where: {
          projectId_skillId: {
            projectId,
            skillId: skill.id
          }
        },
        update: {
          required
        },
        create: {
          projectId,
          skillId: skill.id,
          required
        }
      });
    })
  );
}

export async function getProjects() {
  // Archived projects were removed by an admin and are hidden from browsing.
  const projects = await prisma.project.findMany({
    where: {
      status: { not: "ARCHIVED" }
    },
    include: {
      owner: true,
      skills: {
        include: {
          skill: true
        },
        orderBy: {
          skill: {
            name: "asc"
          }
        }
      },
      _count: {
        select: {
          applications: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return withMatches(projects.map(mapProject));
}

export async function getProjectById(id: string) {
  const project = await fetchProjectById(id);

  return project ? withMatch(mapProject(project)) : null;
}

type UserWithTags = Prisma.UserGetPayload<{
  include: { skills: { include: { skill: true } }; interests: { include: { interest: true } } };
}>;

function toUserProfile(user: UserWithTags): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapRole(user.role),
    department: user.department ?? "",
    majorOrTitle: user.majorOrTitle ?? "",
    graduationYear: user.graduationYear,
    skills: user.skills.map((entry) => entry.skill.name),
    interests: user.interests.map((entry) => entry.interest.name),
    portfolioUrl: user.portfolioUrl,
    githubUrl: user.githubUrl,
    resumeUrl: user.resumeUrl,
    bio: user.bio,
    coursework: user.coursework,
    experience: user.experience
  };
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      skills: {
        include: {
          skill: true
        },
        orderBy: {
          skill: {
            name: "asc"
          }
        }
      },
      interests: {
        include: {
          interest: true
        },
        orderBy: {
          interest: {
            name: "asc"
          }
        }
      }
    }
  });

  return user ? toUserProfile(user) : null;
}

export async function updateUserProfile(
  userId: string,
  input: {
    name: string;
    department: string;
    majorOrTitle: string;
    graduationYear: number | null;
    portfolioUrl: string | null;
    githubUrl: string | null;
    resumeUrl?: string | null;
    bio?: string | null;
    coursework?: string | null;
    experience?: string | null;
    skills: string[];
    interests: string[];
  }
) {
  const profile = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        department: input.department,
        majorOrTitle: input.majorOrTitle,
        graduationYear: input.graduationYear,
        portfolioUrl: input.portfolioUrl,
        githubUrl: input.githubUrl,
        // Optional so older clients that don't send these fields leave them unchanged.
        resumeUrl: input.resumeUrl,
        bio: input.bio,
        coursework: input.coursework,
        experience: input.experience
      }
    });

    await tx.userSkill.deleteMany({
      where: { userId }
    });
    await tx.userInterest.deleteMany({
      where: { userId }
    });

    for (const skillName of input.skills) {
      const skill = await tx.skill.upsert({
        where: { name: skillName },
        update: {},
        create: { name: skillName }
      });

      await tx.userSkill.create({
        data: {
          userId,
          skillId: skill.id
        }
      });
    }

    for (const interestName of input.interests) {
      const interest = await tx.interest.upsert({
        where: { name: interestName },
        update: {},
        create: { name: interestName }
      });

      await tx.userInterest.create({
        data: {
          userId,
          interestId: interest.id
        }
      });
    }

    return tx.user.findUnique({
      where: { id: userId },
      include: {
        skills: {
          include: {
            skill: true
          },
          orderBy: {
            skill: {
              name: "asc"
            }
          }
        },
        interests: {
          include: {
            interest: true
          },
          orderBy: {
            interest: {
              name: "asc"
            }
          }
        }
      }
    });
  });

  return profile ? toUserProfile(profile) : null;
}

export async function getOwnedProjects(userId: string) {
  const projects = await prisma.project.findMany({
    where: {
      ownerId: userId
    },
    include: {
      owner: true,
      skills: {
        include: {
          skill: true
        },
        orderBy: {
          skill: {
            name: "asc"
          }
        }
      },
      _count: {
        select: {
          applications: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return withMatches(projects.map(mapProject));
}

export async function createProject(input: {
  title: string;
  description: string;
  departments: string[];
  category: string;
  requiredSkills: string[];
  helpfulSkills: string[];
  commitment: string;
  duration: string;
  goals: string[];
}, userId: string) {
  const project = await prisma.project.create({
    data: {
      title: input.title,
      description: input.description,
      ownerId: userId,
      category: input.category,
      departments: input.departments,
      commitment: input.commitment,
      duration: input.duration,
      goals: input.goals
    }
  });

  await createProjectSkills(project.id, input.requiredSkills, true);
  await createProjectSkills(project.id, input.helpfulSkills, false);

  const createdProject = await fetchProjectById(project.id);

  if (!createdProject) {
    throw new Error("Project could not be loaded after creation.");
  }

  return withMatch(mapProject(createdProject));
}

export async function getSavedProjectIds(userId: string) {
  const savedProjects = await prisma.savedProject.findMany({
    where: {
      userId
    },
    select: {
      projectId: true
    }
  });

  return savedProjects.map((savedProject) => savedProject.projectId);
}

export async function setSavedProject(projectId: string, isSaved: boolean, userId: string) {
  const project = await fetchProjectById(projectId);

  if (!project) {
    return null;
  }

  if (isSaved) {
    await prisma.savedProject.upsert({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      },
      update: {},
      create: {
        userId,
        projectId
      }
    });
  } else {
    await prisma.savedProject.deleteMany({
      where: {
        userId,
        projectId
      }
    });
  }

  return getSavedProjectIds(userId);
}

export async function createApplication(input: {
  projectId: string;
  message: string;
  availability: string;
}, userId: string) {
  const project = await fetchProjectById(input.projectId);

  if (!project) {
    return null;
  }

  const messageWithAvailability = `${input.message.trim()}\n\nAvailability: ${input.availability}`;

  return prisma.application.upsert({
    where: {
      projectId_applicantId: {
        projectId: input.projectId,
        applicantId: userId
      }
    },
    update: {
      message: messageWithAvailability,
      status: "SUBMITTED"
    },
    create: {
      projectId: input.projectId,
      applicantId: userId,
      message: messageWithAvailability
    }
  });
}

export async function getApplicationsForCurrentUser(userId: string) {
  const applications = await prisma.application.findMany({
    where: {
      applicantId: userId
    },
    include: {
      project: true,
      applicant: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return applications.map((application) => ({
    id: application.id,
    projectTitle: application.project.title,
    applicantName: application.applicant.name,
    status: mapApplicationStatus(application.status),
    submittedAt: application.createdAt.toISOString().slice(0, 10)
  }));
}

export async function getApplicationsForOwnedProjects(userId: string): Promise<OwnedProjectApplication[]> {
  const applications = await prisma.application.findMany({
    where: {
      project: {
        ownerId: userId
      }
    },
    include: {
      project: true,
      applicant: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return applications.map((application) => ({
    id: application.id,
    projectId: application.projectId,
    projectTitle: application.project.title,
    applicantId: application.applicantId,
    applicantName: application.applicant.name,
    applicantEmail: application.applicant.email,
    applicantDepartment: application.applicant.department ?? undefined,
    applicantMajorOrTitle: application.applicant.majorOrTitle ?? undefined,
    message: application.message ?? undefined,
    status: mapApplicationStatus(application.status),
    submittedAt: application.createdAt.toISOString().slice(0, 10)
  }));
}

export async function updateOwnedProjectApplicationStatus(
  applicationId: string,
  status: Application["status"],
  userId: string
) {
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      project: {
        ownerId: userId
      }
    }
  });

  if (!application) {
    return null;
  }

  const updatedApplication = await prisma.application.update({
    where: {
      id: applicationId
    },
    data: {
      status: toDatabaseApplicationStatus(status)
    },
    include: {
      project: true,
      applicant: true
    }
  });

  return {
    id: updatedApplication.id,
    projectId: updatedApplication.projectId,
    projectTitle: updatedApplication.project.title,
    applicantId: updatedApplication.applicantId,
    applicantName: updatedApplication.applicant.name,
    applicantEmail: updatedApplication.applicant.email,
    applicantDepartment: updatedApplication.applicant.department ?? undefined,
    applicantMajorOrTitle: updatedApplication.applicant.majorOrTitle ?? undefined,
    message: updatedApplication.message ?? undefined,
    status: mapApplicationStatus(updatedApplication.status),
    submittedAt: updatedApplication.createdAt.toISOString().slice(0, 10)
  };
}

export async function updateOwnedProjectStatus(
  projectId: string,
  status: Project["status"],
  userId: string
) {
  // Only an admin can restore an archived project, so owners can't change its status.
  const existing = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
      status: { not: "ARCHIVED" }
    }
  });

  if (!existing) {
    return null;
  }

  await prisma.project.update({
    where: {
      id: projectId
    },
    data: {
      status: toDatabaseProjectStatus(status)
    }
  });

  const updated = await fetchProjectById(projectId);
  return updated ? withMatch(mapProject(updated)) : null;
}

// A profile is visible to its owner, to admins, and to anyone who owns a project
// the person has applied to (so owners can review applicants). Nobody else.
export async function canViewProfile(viewerId: string, profileUserId: string) {
  if (viewerId === profileUserId) {
    return true;
  }

  const viewer = await prisma.user.findUnique({ where: { id: viewerId }, select: { role: true } });

  if (viewer?.role === "ADMIN") {
    return true;
  }

  const application = await prisma.application.findFirst({
    where: { applicantId: profileUserId, project: { ownerId: viewerId } },
    select: { id: true }
  });

  return Boolean(application);
}

// Applications a person has made to projects the viewer owns, newest first.
export async function getApplicationsToOwnerFromApplicant(ownerId: string, applicantId: string) {
  const applications = await prisma.application.findMany({
    where: { applicantId, project: { ownerId } },
    include: { project: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" }
  });

  return applications.map((application) => ({
    id: application.id,
    projectId: application.project.id,
    projectTitle: application.project.title,
    message: application.message ?? undefined,
    status: mapApplicationStatus(application.status),
    submittedAt: application.createdAt.toISOString().slice(0, 10)
  }));
}

// The viewer's own application to a project, if any (for the project page).
export async function getViewerApplication(projectId: string, userId: string) {
  const application = await prisma.application.findUnique({
    where: { projectId_applicantId: { projectId, applicantId: userId } },
    select: { status: true, createdAt: true }
  });

  return application
    ? { status: mapApplicationStatus(application.status), submittedAt: application.createdAt.toISOString().slice(0, 10) }
    : null;
}
