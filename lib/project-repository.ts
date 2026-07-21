import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/data";
import type { Application, OwnedProjectApplication, Project } from "@/lib/types";

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

function calculateMatchScore(project: {
  skills: { skill: { name: string }; required: boolean }[];
}) {
  const userSkills = new Set(currentUser.skills.map((skill) => skill.toLowerCase()));
  const projectSkills = project.skills.map(({ skill }) => skill.name.toLowerCase());
  const overlap = projectSkills.filter((skill) => userSkills.has(skill)).length;

  return Math.min(98, 68 + overlap * 8);
}

function recommendationReason(project: {
  skills: { skill: { name: string }; required: boolean }[];
}) {
  const matches = project.skills
    .map(({ skill }) => skill.name)
    .filter((skill) => currentUser.skills.includes(skill));

  if (matches.length > 0) {
    return `Recommended because it matches ${matches.slice(0, 3).join(", ")}.`;
  }

  return "Recommended as a new interdisciplinary opportunity. Matching will improve once embeddings are connected.";
}

function mapProject(project: NonNullable<ProjectWithRelations>): Project {
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
    matchScore: calculateMatchScore(project),
    recommendationReason: recommendationReason(project)
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
  const projects = await prisma.project.findMany({
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

  return projects.map(mapProject);
}

export async function getProjectById(id: string) {
  const project = await fetchProjectById(id);

  return project ? mapProject(project) : null;
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

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    role: mapRole(user.role),
    department: user.department ?? "",
    majorOrTitle: user.majorOrTitle ?? "",
    graduationYear: user.graduationYear,
    skills: user.skills.map((entry) => entry.skill.name),
    interests: user.interests.map((entry) => entry.interest.name),
    portfolioUrl: user.portfolioUrl,
    githubUrl: user.githubUrl
  };
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
        githubUrl: input.githubUrl
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

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    name: profile.name,
    role: mapRole(profile.role),
    department: profile.department ?? "",
    majorOrTitle: profile.majorOrTitle ?? "",
    graduationYear: profile.graduationYear,
    skills: profile.skills.map((entry) => entry.skill.name),
    interests: profile.interests.map((entry) => entry.interest.name),
    portfolioUrl: profile.portfolioUrl,
    githubUrl: profile.githubUrl
  };
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

  return projects.map(mapProject);
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

  return mapProject(createdProject);
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
    applicantName: application.applicant.name,
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
    applicantName: updatedApplication.applicant.name,
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
  const existing = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId
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
  return updated ? mapProject(updated) : null;
}
