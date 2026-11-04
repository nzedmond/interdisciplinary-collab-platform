// Opt-in SYNTHETIC demo activity so the analytics page has something to show.
// Adds demo students and faculty projects (all @demo.example.edu) plus applications.
// Analytics flags every example.edu account as synthetic: never report these numbers
// as research findings.
//
//   npm run seed:demo-activity            add / refresh demo activity (run after prisma:seed)
//   npm run seed:demo-activity -- --remove delete all @demo.example.edu accounts and their data
const { randomBytes, scryptSync } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const DEMO_DOMAIN = "demo.example.edu";
const DEMO_PASSWORD = "collab-demo";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

const faculty = [
  { key: "hollis", name: "Prof. Dana Hollis", department: "History", title: "Professor of History" },
  { key: "ruiz", name: "Dr. Marco Ruiz", department: "Biology", title: "Associate Professor of Biology" },
  { key: "adeyemi", name: "Prof. Tola Adeyemi", department: "Art", title: "Professor of Art and Art History" },
  { key: "lindqvist", name: "Dr. Sara Lindqvist", department: "Education", title: "Assistant Professor of Education" }
];

const projects = [
  {
    id: "demo-p-001",
    owner: "hollis",
    title: "Oral Histories of the Chenango Canal",
    description: "Record, transcribe, and publish oral histories from families who lived and worked along the old canal corridor.",
    category: "Archive + Storytelling",
    departments: ["History", "Media Studies"],
    required: ["Interview research", "Audio editing", "Archival research"],
    helpful: ["Web publishing"],
    goals: ["Record 20 interviews", "Publish a listening map"],
    status: "OPEN"
  },
  {
    id: "demo-p-002",
    owner: "ruiz",
    title: "Bird Migration Sensor Network",
    description: "Deploy low-cost acoustic sensors around campus wetlands and build a dashboard tracking seasonal bird migration.",
    category: "Civic Data",
    departments: ["Biology", "Computer Science", "Environmental Studies"],
    required: ["Python", "IoT", "Data visualization"],
    helpful: ["GIS", "Statistics"],
    goals: ["Install 10 sensors", "Publish a live migration dashboard"],
    status: "OPEN"
  },
  {
    id: "demo-p-003",
    owner: "adeyemi",
    title: "Community Mural Data Stories",
    description: "Co-design a public mural with local residents that visualizes neighborhood survey results about belonging.",
    category: "Creative Technology",
    departments: ["Art", "Sociology"],
    required: ["Painting", "Community outreach", "Survey analysis"],
    helpful: ["Data visualization"],
    goals: ["Run community workshops", "Paint the mural"],
    status: "REVIEWING"
  },
  {
    id: "demo-p-004",
    owner: "lindqvist",
    title: "Learning Analytics for Intro Statistics",
    description: "Study how students use practice problems in intro statistics and test redesigned feedback to close achievement gaps.",
    category: "Research + Public Scholarship",
    departments: ["Education", "Statistics"],
    required: ["Statistics", "R", "Survey analysis"],
    helpful: ["UX research"],
    goals: ["Analyze a semester of usage data", "Pilot new feedback"],
    status: "OPEN"
  }
];

const students = [
  { key: "ava", name: "Ava Chen", department: "Biology", major: "Biology major", year: 2027, skills: ["Python", "Field research", "Statistics"], interests: ["Birds", "Climate justice"], bio: "Field biologist in training who wants to put sensors and code to work for conservation." },
  { key: "ben", name: "Ben Okoro", department: "History", major: "History major", year: 2026, skills: ["Archival research", "Interview research", "Writing"], interests: ["Public humanities", "Local history"], bio: "I love finding the people behind the documents in local archives." },
  { key: "carla", name: "Carla Diaz", department: "Art", major: "Studio Art major", year: 2027, skills: ["Painting", "Graphic design", "Community outreach"], interests: ["Public art", "Social justice"], bio: "Painter interested in art that neighbors make together." },
  { key: "dev", name: "Dev Patel", department: "Computer Science", major: "Computer Science major", year: 2026, skills: ["Python", "React", "IoT", "SQL"], interests: ["Sensors", "Sustainability"], bio: "I build small hardware and software projects that measure the world." },
  { key: "ella", name: "Ella Brooks", department: "Media Studies", major: "Media Studies major", year: 2028, skills: ["Audio editing", "Video editing", "Storytelling"], interests: ["Documentary", "Community archives"], bio: "Documentary maker drawn to everyday voices." },
  { key: "felix", name: "Felix Wang", department: "Statistics", major: "Statistics major", year: 2027, skills: ["R", "Statistics", "Survey analysis"], interests: ["Education equity", "Data for good"], bio: "Statistician who wants data to make classrooms fairer." },
  { key: "grace", name: "Grace Kim", department: "Environmental Studies", major: "Environmental Studies major", year: 2026, skills: ["GIS", "Field research", "Policy writing"], interests: ["Climate justice", "Food systems"], bio: "Mapping environmental risk and turning it into policy." },
  { key: "hugo", name: "Hugo Silva", department: "Music", major: "Music and Computer Science double major", year: 2027, skills: ["Music theory", "Audio processing", "TypeScript"], interests: ["Accessible tech", "Music education"], bio: "Composer and developer making music learning accessible." },
  { key: "iris", name: "Iris Novak", department: "Sociology", major: "Sociology major", year: 2028, skills: ["Survey analysis", "Interview research", "Qualitative coding"], interests: ["Social movements", "Public art"], bio: "Studying how communities organize and tell their own stories." },
  { key: "jamal", name: "Jamal Reed", department: "Economics", major: "Economics major", year: 2026, skills: ["SQL", "Statistics", "Dashboard design"], interests: ["Food systems", "Sustainability"], bio: "Economist who likes dashboards that change decisions." },
  { key: "kai", name: "Kai Moreno", department: "Education", major: "Educational Studies major", year: 2027, skills: ["UX research", "Curriculum design", "Accessibility testing"], interests: ["Music education", "Learning science"], bio: "Designing learning experiences that work for every student." },
  { key: "lena", name: "Lena Fischer", department: "Computer Science", major: "Computer Science major, Art minor", year: 2028, skills: ["Data visualization", "D3", "Python"], interests: ["Civic tech", "Public humanities"], bio: "I make interactive graphics about places and the people in them." }
];

// [student, project id, status, days ago]
const applications = [
  ["ava", "demo-p-002", "ACCEPTED", 40], ["ava", "p-001", "SUBMITTED", 6],
  ["ben", "demo-p-001", "INTERVIEW", 21], ["ben", "p-004", "ACCEPTED", 35],
  ["carla", "demo-p-003", "ACCEPTED", 30], ["carla", "p-004", "SUBMITTED", 4],
  ["dev", "demo-p-002", "INTERVIEW", 18], ["dev", "p-003", "DECLINED", 33],
  ["ella", "demo-p-001", "ACCEPTED", 28], ["ella", "p-004", "INTERVIEW", 12],
  ["felix", "demo-p-004", "ACCEPTED", 25], ["felix", "p-003", "SUBMITTED", 3],
  ["grace", "p-001", "ACCEPTED", 38], ["grace", "p-003", "INTERVIEW", 15], ["grace", "demo-p-002", "SUBMITTED", 2],
  ["hugo", "p-002", "ACCEPTED", 29],
  ["iris", "demo-p-003", "INTERVIEW", 14], ["iris", "p-004", "SUBMITTED", 5], ["iris", "demo-p-004", "DECLINED", 22],
  ["jamal", "p-003", "ACCEPTED", 31], ["jamal", "demo-p-004", "SUBMITTED", 7],
  ["kai", "p-002", "INTERVIEW", 16], ["kai", "demo-p-004", "SUBMITTED", 8],
  ["lena", "p-001", "SUBMITTED", 9], ["lena", "demo-p-001", "DECLINED", 26], ["lena", "demo-p-003", "SUBMITTED", 1]
];

async function connectTags(userId, skills, interests) {
  for (const name of skills) {
    const skill = await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
    await prisma.userSkill.upsert({
      where: { userId_skillId: { userId, skillId: skill.id } },
      update: {},
      create: { userId, skillId: skill.id }
    });
  }
  for (const name of interests) {
    const interest = await prisma.interest.upsert({ where: { name }, update: {}, create: { name } });
    await prisma.userInterest.upsert({
      where: { userId_interestId: { userId, interestId: interest.id } },
      update: {},
      create: { userId, interestId: interest.id }
    });
  }
}

async function remove() {
  // Cascades remove their projects, applications, saved projects, and tags.
  const { count } = await prisma.user.deleteMany({ where: { email: { endsWith: `@${DEMO_DOMAIN}` } } });
  console.log(`Removed ${count} demo accounts (@${DEMO_DOMAIN}) and their projects and applications.`);
}

async function add() {
  const missing = await prisma.project.count({ where: { id: { in: ["p-001", "p-002", "p-003", "p-004"] } } });
  if (missing < 4) {
    throw new Error("Run `npm run prisma:seed` first: demo applications reference the seeded projects p-001..p-004.");
  }

  const passwordHash = hashPassword(DEMO_PASSWORD);
  const userIds = {};

  for (const person of faculty) {
    const user = await prisma.user.upsert({
      where: { email: `${person.key}@${DEMO_DOMAIN}` },
      update: { name: person.name, department: person.department, majorOrTitle: person.title },
      create: {
        email: `${person.key}@${DEMO_DOMAIN}`,
        name: person.name,
        role: "FACULTY",
        department: person.department,
        majorOrTitle: person.title,
        passwordHash
      }
    });
    userIds[person.key] = user.id;
  }

  for (const person of students) {
    const user = await prisma.user.upsert({
      where: { email: `${person.key}@${DEMO_DOMAIN}` },
      update: { name: person.name, department: person.department, majorOrTitle: person.major, bio: person.bio },
      create: {
        email: `${person.key}@${DEMO_DOMAIN}`,
        name: person.name,
        role: "STUDENT",
        department: person.department,
        majorOrTitle: person.major,
        graduationYear: person.year,
        bio: person.bio,
        passwordHash
      }
    });
    userIds[person.key] = user.id;
    await connectTags(user.id, person.skills, person.interests);
  }

  for (const project of projects) {
    const data = {
      title: project.title,
      description: project.description,
      ownerId: userIds[project.owner],
      category: project.category,
      departments: project.departments,
      commitment: "3-5 hrs/week",
      duration: "Spring semester",
      goals: project.goals,
      status: project.status,
      verifiedAt: new Date()
    };
    await prisma.project.upsert({ where: { id: project.id }, update: data, create: { id: project.id, ...data } });

    for (const [names, required] of [[project.required, true], [project.helpful, false]]) {
      for (const name of names) {
        const skill = await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
        await prisma.projectSkill.upsert({
          where: { projectId_skillId: { projectId: project.id, skillId: skill.id } },
          update: { required },
          create: { projectId: project.id, skillId: skill.id, required }
        });
      }
    }
  }

  const day = 24 * 60 * 60 * 1000;
  for (const [student, projectId, status, daysAgo] of applications) {
    const createdAt = new Date(Date.now() - daysAgo * day);
    await prisma.application.upsert({
      where: { projectId_applicantId: { projectId, applicantId: userIds[student] } },
      update: { status },
      create: {
        projectId,
        applicantId: userIds[student],
        status,
        createdAt,
        message: "Synthetic demo application."
      }
    });
  }

  console.log(
    `Demo activity ready: ${students.length} students, ${faculty.length} faculty, ${projects.length} projects, ` +
      `${applications.length} applications (all @${DEMO_DOMAIN}, password "${DEMO_PASSWORD}"). ` +
      "Remove with: npm run seed:demo-activity -- --remove"
  );
}

(process.argv.includes("--remove") ? remove() : add())
  .catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
