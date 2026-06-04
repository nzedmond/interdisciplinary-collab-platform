const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const currentUser = {
  id: "user-1",
  email: "maya.johnson@example.edu",
  name: "Maya Johnson",
  department: "Computer Science",
  majorOrTitle: "Data Science major, Studio Art minor",
  graduationYear: 2027,
  skills: ["Python", "Data visualization", "Interview research", "React", "Storytelling"],
  interests: ["Climate justice", "Public humanities", "Creative coding", "Community archives"],
  portfolioUrl: "https://example.edu/maya",
  githubUrl: "https://github.com/example"
};

const projects = [
  {
    id: "p-001",
    title: "Mapping Urban Heat and Community Memory",
    owner: "Prof. Amina Okafor",
    ownerRole: "Faculty",
    departments: ["Environmental Studies", "History", "Computer Science"],
    category: "Research + Public Scholarship",
    description:
      "Build an interactive map that pairs neighborhood heat-island data with oral histories from residents.",
    requiredSkills: ["GIS", "Python", "Interview research"],
    helpfulSkills: ["Data visualization", "Public history", "Web design"],
    commitment: "5-7 hrs/week",
    duration: "Spring semester",
    goals: ["Prototype public map", "Analyze sensor data", "Publish community-facing exhibit"],
    status: "OPEN"
  },
  {
    id: "p-002",
    title: "AI Studio for Accessible Music Pedagogy",
    owner: "Dr. Leo Marin",
    ownerRole: "Faculty",
    departments: ["Music", "Education", "Computer Science"],
    category: "Creative Technology",
    description:
      "Design assistive tools that help beginning musicians practice rhythm, notation, and ear training.",
    requiredSkills: ["React", "UX research", "Music theory"],
    helpfulSkills: ["Audio processing", "Accessibility testing", "TypeScript"],
    commitment: "3-5 hrs/week",
    duration: "10 weeks",
    goals: ["Run student interviews", "Build accessible prototype", "Evaluate learning outcomes"],
    status: "REVIEWING"
  },
  {
    id: "p-003",
    title: "Food Systems Dashboard for Campus Dining",
    owner: "Campus Sustainability Lab",
    ownerRole: "Staff",
    departments: ["Economics", "Environmental Studies", "Statistics"],
    category: "Civic Data",
    description:
      "Create a dashboard that tracks food sourcing, waste, cost, and student feedback across dining halls.",
    requiredSkills: ["Statistics", "Dashboard design", "Survey analysis"],
    helpfulSkills: ["SQL", "Data storytelling", "Policy writing"],
    commitment: "4 hrs/week",
    duration: "Academic year",
    goals: ["Model waste patterns", "Visualize sourcing data", "Recommend procurement changes"],
    status: "OPEN"
  },
  {
    id: "p-004",
    title: "Digital Archive of Student Activism",
    owner: "Rina Patel",
    ownerRole: "Student",
    departments: ["Sociology", "Library", "Media Studies"],
    category: "Archive + Storytelling",
    description:
      "Collect, preserve, and present student-led movements through a searchable multimedia archive.",
    requiredSkills: ["Archival research", "Content strategy", "Consent workflows"],
    helpfulSkills: ["Web publishing", "Audio editing", "Metadata design"],
    commitment: "2-4 hrs/week",
    duration: "Rolling",
    goals: ["Design intake process", "Catalog submissions", "Launch public collection"],
    status: "OPEN"
  }
];

async function findOrCreateSkill(name) {
  return prisma.skill.upsert({
    where: { name },
    update: {},
    create: { name }
  });
}

async function linkProjectSkills(projectId, skills, required) {
  for (const name of skills) {
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
  }
}

async function seedUserProfile(user) {
  const dbUser = await prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      department: user.department,
      majorOrTitle: user.majorOrTitle,
      graduationYear: user.graduationYear,
      portfolioUrl: user.portfolioUrl,
      githubUrl: user.githubUrl
    },
    create: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: "STUDENT",
      department: user.department,
      majorOrTitle: user.majorOrTitle,
      graduationYear: user.graduationYear,
      portfolioUrl: user.portfolioUrl,
      githubUrl: user.githubUrl
    }
  });

  for (const name of user.skills) {
    const skill = await findOrCreateSkill(name);

    await prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId: dbUser.id,
          skillId: skill.id
        }
      },
      update: {},
      create: {
        userId: dbUser.id,
        skillId: skill.id
      }
    });
  }

  for (const name of user.interests) {
    const interest = await prisma.interest.upsert({
      where: { name },
      update: {},
      create: { name }
    });

    await prisma.userInterest.upsert({
      where: {
        userId_interestId: {
          userId: dbUser.id,
          interestId: interest.id
        }
      },
      update: {},
      create: {
        userId: dbUser.id,
        interestId: interest.id
      }
    });
  }

  return dbUser;
}

async function main() {
  const demoUser = await seedUserProfile(currentUser);

  for (const project of projects) {
    const owner = await prisma.user.upsert({
      where: { email: `${project.id}@example.edu` },
      update: {
        name: project.owner,
        department: project.departments[0],
        majorOrTitle: project.ownerRole
      },
      create: {
        email: `${project.id}@example.edu`,
        name: project.owner,
        role: project.ownerRole === "Student" ? "STUDENT" : "FACULTY",
        department: project.departments[0],
        majorOrTitle: project.ownerRole
      }
    });

    await prisma.project.upsert({
      where: { id: project.id },
      update: {
        title: project.title,
        description: project.description,
        ownerId: owner.id,
        category: project.category,
        departments: project.departments,
        commitment: project.commitment,
        duration: project.duration,
        goals: project.goals,
        status: project.status
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
        status: project.status
      }
    });

    await linkProjectSkills(project.id, project.requiredSkills, true);
    await linkProjectSkills(project.id, project.helpfulSkills, false);
  }

  await prisma.application.upsert({
    where: {
      projectId_applicantId: {
        projectId: "p-001",
        applicantId: demoUser.id
      }
    },
    update: {},
    create: {
      projectId: "p-001",
      applicantId: demoUser.id,
      message: "I would like to contribute data visualization and community research support.",
      status: "INTERVIEW"
    }
  });

  await prisma.application.upsert({
    where: {
      projectId_applicantId: {
        projectId: "p-004",
        applicantId: demoUser.id
      }
    },
    update: {},
    create: {
      projectId: "p-004",
      applicantId: demoUser.id,
      message: "I am interested in archive storytelling and consent-centered collection workflows.",
      status: "SUBMITTED"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
