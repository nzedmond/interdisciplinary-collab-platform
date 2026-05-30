import { prisma } from "@/lib/prisma";
import { currentUser, projects as demoProjects } from "@/lib/data";
import type { Application, Project } from "@/lib/types";

const demoUserEmail = "maya.johnson@example.edu";

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

export async function ensureCurrentUser() {
  return prisma.user.upsert({
    where: { email: demoUserEmail },
    update: {
      name: currentUser.name,
      department: currentUser.department,
      majorOrTitle: currentUser.majorOrTitle,
      graduationYear: currentUser.graduationYear,
      portfolioUrl: currentUser.portfolioUrl,
      githubUrl: currentUser.githubUrl
    },
    create: {
      id: currentUser.id,
      email: demoUserEmail,
      name: currentUser.name,
      role: "STUDENT",
      department: currentUser.department,
      majorOrTitle: currentUser.majorOrTitle,
      graduationYear: currentUser.graduationYear,
      portfolioUrl: currentUser.portfolioUrl,
      githubUrl: currentUser.githubUrl
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

export async function ensureDemoProjects() {
  const user = await ensureCurrentUser();

  for (const project of demoProjects) {
    const owner = await prisma.user.upsert({
      where: { email: `${project.id}@example.edu` },
      update: {},
      create: {
        email: `${project.id}@example.edu`,
        name: project.owner,
        role: project.ownerRole === "Student" ? "STUDENT" : "FACULTY",
        department: project.departments[0],
        majorOrTitle: project.ownerRole
      }
    });

    await prisma.project.upsert({
      where: {
        id: project.id
      },
      update: {
        title: project.title,
        description: project.description,
        ownerId: owner.id,
        category: project.category,
        departments: project.departments,
        commitment: project.commitment,
        duration: project.duration,
        goals: project.goals,
        status: project.status.toUpperCase() as "OPEN" | "REVIEWING" | "FILLED"
      },
      create: {
        id: project.id,
        title: project.title,
        description: project.description,
        ownerId: owner.id,
        category: project.category,
        departments: project.departments,
        commitment: project.commitment,
        duration: project.duration,
        goals: project.goals,
        status: project.status.toUpperCase() as "OPEN" | "REVIEWING" | "FILLED"
      }
    });

    await createProjectSkills(project.id, project.requiredSkills, true);
    await createProjectSkills(project.id, project.helpfulSkills, false);
  }

  await prisma.application.upsert({
    where: {
      projectId_applicantId: {
        projectId: "p-001",
        applicantId: user.id
      }
    },
    update: {},
    create: {
      projectId: "p-001",
      applicantId: user.id,
      message: "I would like to contribute data visualization and community research support.",
      status: "INTERVIEW"
    }
  });

  await prisma.application.upsert({
    where: {
      projectId_applicantId: {
        projectId: "p-004",
        applicantId: user.id
      }
    },
    update: {},
    create: {
      projectId: "p-004",
      applicantId: user.id,
      message: "I am interested in archive storytelling and consent-centered collection workflows.",
      status: "SUBMITTED"
    }
  });
}

export async function getProjects() {
  await ensureDemoProjects();

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
  await ensureDemoProjects();
  const project = await fetchProjectById(id);

  return project ? mapProject(project) : null;
}

export async function getOwnedProjects() {
  await ensureDemoProjects();
  const user = await ensureCurrentUser();

  const projects = await prisma.project.findMany({
    where: {
      ownerId: user.id
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
}) {
  await ensureDemoProjects();
  const user = await ensureCurrentUser();

  const project = await prisma.project.create({
    data: {
      title: input.title,
      description: input.description,
      ownerId: user.id,
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

export async function getSavedProjectIds() {
  await ensureDemoProjects();
  const user = await ensureCurrentUser();

  const savedProjects = await prisma.savedProject.findMany({
    where: {
      userId: user.id
    },
    select: {
      projectId: true
    }
  });

  return savedProjects.map((savedProject) => savedProject.projectId);
}

export async function setSavedProject(projectId: string, isSaved: boolean) {
  await ensureDemoProjects();
  const user = await ensureCurrentUser();
  const project = await fetchProjectById(projectId);

  if (!project) {
    return null;
  }

  if (isSaved) {
    await prisma.savedProject.upsert({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId
        }
      },
      update: {},
      create: {
        userId: user.id,
        projectId
      }
    });
  } else {
    await prisma.savedProject.deleteMany({
      where: {
        userId: user.id,
        projectId
      }
    });
  }

  return getSavedProjectIds();
}

export async function createApplication(input: {
  projectId: string;
  message: string;
  availability: string;
}) {
  await ensureDemoProjects();
  const user = await ensureCurrentUser();
  const project = await fetchProjectById(input.projectId);

  if (!project) {
    return null;
  }

  const messageWithAvailability = `${input.message.trim()}\n\nAvailability: ${input.availability}`;

  return prisma.application.upsert({
    where: {
      projectId_applicantId: {
        projectId: input.projectId,
        applicantId: user.id
      }
    },
    update: {
      message: messageWithAvailability,
      status: "SUBMITTED"
    },
    create: {
      projectId: input.projectId,
      applicantId: user.id,
      message: messageWithAvailability
    }
  });
}

export async function getApplicationsForCurrentUser() {
  await ensureDemoProjects();
  const user = await ensureCurrentUser();

  const applications = await prisma.application.findMany({
    where: {
      applicantId: user.id
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
