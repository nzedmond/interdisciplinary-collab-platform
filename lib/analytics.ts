import { createHash } from "node:crypto";
import { averageRank, isCrossDepartment, percentileRank, summarizeRanks, type RankObservation } from "@/lib/analytics-metrics";
import { scoreProjectsForProfile } from "@/lib/match-service";
import type { MatchableProject } from "@/lib/matching";
import { prisma } from "@/lib/prisma";

// Seed and demo accounts use example.edu addresses. They are synthetic, so analytics
// flags them and they must not be reported as research findings.
export function isSyntheticEmail(email: string) {
  return /@([a-z0-9-]+\.)*example\.edu$/i.test(email);
}

type Method = "semantic" | "keyword" | "hybrid";
const methods: Method[] = ["semantic", "keyword", "hybrid"];

export type ApplicationRow = {
  applicationKey: string;
  applicantKey: string;
  applicantRole: string;
  applicantDepartment: string | null;
  projectDepartments: string[];
  crossDepartment: boolean | null;
  status: string;
  appliedAt: string;
  candidateCount: number;
  semanticScore: number | null;
  keywordScore: number;
  hybridScore: number;
  semanticPercentile: number | null;
  keywordPercentile: number | null;
  hybridPercentile: number | null;
  synthetic: boolean;
};

// Short, stable, non-reversible key so rows can be grouped by person without identifying them.
function anonymousKey(id: string) {
  return createHash("sha256").update(`collab-commons:${id}`).digest("hex").slice(0, 10);
}

function rate(numerator: number, denominator: number) {
  return denominator === 0 ? null : numerator / denominator;
}

export async function getAnalytics() {
  const [users, projects, applications] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        department: true,
        majorOrTitle: true,
        bio: true,
        experience: true,
        coursework: true,
        suspendedAt: true,
        skills: { select: { skill: { select: { name: true } } } },
        interests: { select: { interest: { select: { name: true } } } }
      }
    }),
    prisma.project.findMany({
      where: { status: { not: "ARCHIVED" } },
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        category: true,
        departments: true,
        goals: true,
        status: true,
        skills: { select: { required: true, skill: { select: { name: true } } } }
      }
    }),
    prisma.application.findMany({
      where: { project: { status: { not: "ARCHIVED" } } },
      select: { id: true, applicantId: true, projectId: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" }
    })
  ]);

  const usersById = new Map(users.map((user) => [user.id, user]));
  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const matchable = new Map<string, MatchableProject>(
    projects.map((project) => [
      project.id,
      {
        title: project.title,
        description: project.description,
        category: project.category,
        departments: project.departments,
        goals: project.goals,
        requiredSkills: project.skills.filter((entry) => entry.required).map((entry) => entry.skill.name),
        helpfulSkills: project.skills.filter((entry) => !entry.required).map((entry) => entry.skill.name)
      }
    ])
  );

  // ---- Recommendation quality: rank each applied project among that applicant's candidates.
  const applicationsByApplicant = new Map<string, typeof applications>();
  for (const application of applications) {
    const list = applicationsByApplicant.get(application.applicantId) ?? [];
    list.push(application);
    applicationsByApplicant.set(application.applicantId, list);
  }

  const rows: ApplicationRow[] = [];
  const observations: Record<Method, RankObservation[]> = { semantic: [], keyword: [], hybrid: [] };
  let usedEmbeddings = false;

  for (const [applicantId, applicantApplications] of applicationsByApplicant) {
    const applicant = usersById.get(applicantId);
    if (!applicant) continue;

    // Candidates: every active project the applicant could have applied to (not their own).
    const candidates = projects.filter((project) => project.ownerId !== applicantId);
    const results = await scoreProjectsForProfile(
      {
        majorOrTitle: applicant.majorOrTitle,
        department: applicant.department,
        bio: applicant.bio,
        experience: applicant.experience,
        coursework: applicant.coursework,
        skills: applicant.skills.map((entry) => entry.skill.name),
        interests: applicant.interests.map((entry) => entry.interest.name)
      },
      candidates.map((project) => matchable.get(project.id)!)
    );
    const scores: Record<Method, number[] | null> = {
      semantic: results.every((result) => result.semanticScore !== null)
        ? results.map((result) => result.semanticScore as number)
        : null,
      keyword: results.map((result) => result.keywordScore),
      hybrid: results.map((result) => result.matchScore)
    };
    usedEmbeddings ||= scores.semantic !== null;

    for (const application of applicantApplications) {
      const index = candidates.findIndex((project) => project.id === application.projectId);
      const project = projectsById.get(application.projectId);
      if (index === -1 || !project) continue;

      const percentiles = {} as Record<Method, number | null>;
      for (const method of methods) {
        const methodScores = scores[method];
        const percentile = methodScores ? percentileRank(methodScores, index) : null;
        percentiles[method] = percentile;
        if (methodScores && percentile !== null) {
          observations[method].push({ percentile, rank: averageRank(methodScores, index) });
        }
      }

      rows.push({
        applicationKey: anonymousKey(application.id),
        applicantKey: anonymousKey(applicantId),
        applicantRole: applicant.role.toLowerCase(),
        applicantDepartment: applicant.department,
        projectDepartments: project.departments,
        crossDepartment: isCrossDepartment(applicant.department, project.departments),
        status: application.status.toLowerCase(),
        appliedAt: application.createdAt.toISOString().slice(0, 10),
        candidateCount: candidates.length,
        semanticScore: results[index].semanticScore,
        keywordScore: results[index].keywordScore,
        hybridScore: results[index].matchScore,
        semanticPercentile: percentiles.semantic,
        keywordPercentile: percentiles.keyword,
        hybridPercentile: percentiles.hybrid,
        synthetic: isSyntheticEmail(applicant.email)
      });
    }
  }

  // ---- Interdisciplinary participation
  const knownDepartmentRows = rows.filter((row) => row.crossDepartment !== null);
  const acceptedKnown = knownDepartmentRows.filter((row) => row.status === "accepted");
  const students = users.filter((user) => user.role === "STUDENT" && !user.suspendedAt);
  const applicantIds = new Set(applications.map((application) => application.applicantId));
  const projectsWithApplicants = new Set(applications.map((application) => application.projectId));
  const decided = applications.filter((application) => application.status === "ACCEPTED" || application.status === "DECLINED");

  const participation = {
    applications: applications.length,
    crossDepartmentRate: rate(knownDepartmentRows.filter((row) => row.crossDepartment).length, knownDepartmentRows.length),
    crossDepartmentAcceptedRate: rate(acceptedKnown.filter((row) => row.crossDepartment).length, acceptedKnown.length),
    acceptedCount: acceptedKnown.length,
    studentsWhoApplied: students.filter((student) => applicantIds.has(student.id)).length,
    students: students.length,
    projectsWithApplicants: projects.filter((project) => projectsWithApplicants.has(project.id)).length,
    projects: projects.length,
    acceptanceRate: rate(decided.filter((application) => application.status === "ACCEPTED").length, decided.length),
    decidedCount: decided.length
  };

  // ---- Department network: applicant department -> each of the project's departments.
  const matrixCounts = new Map<string, number>();
  const fromDepartments = new Set<string>();
  const toDepartments = new Set<string>();
  for (const row of rows) {
    if (!row.applicantDepartment) continue;
    fromDepartments.add(row.applicantDepartment);
    for (const department of row.projectDepartments) {
      toDepartments.add(department);
      const key = `${row.applicantDepartment}\u0000${department}`;
      matrixCounts.set(key, (matrixCounts.get(key) ?? 0) + 1);
    }
  }
  const sortedFrom = Array.from(fromDepartments).sort();
  const sortedTo = Array.from(toDepartments).sort();
  const departmentNetwork = {
    from: sortedFrom,
    to: sortedTo,
    counts: sortedFrom.map((from) => sortedTo.map((to) => matrixCounts.get(`${from}\u0000${to}`) ?? 0))
  };

  // ---- Skill demand (active projects needing it) vs supply (users listing it).
  const demand = new Map<string, number>();
  for (const project of projects.filter((item) => item.status === "OPEN" || item.status === "REVIEWING")) {
    for (const entry of project.skills) {
      demand.set(entry.skill.name, (demand.get(entry.skill.name) ?? 0) + 1);
    }
  }
  const supply = new Map<string, number>();
  for (const user of users) {
    for (const entry of user.skills) {
      const key = entry.skill.name.toLowerCase();
      supply.set(key, (supply.get(key) ?? 0) + 1);
    }
  }
  const skillDemand = Array.from(demand, ([skill, projectsNeeding]) => ({
    skill,
    projectsNeeding,
    peopleWithSkill: supply.get(skill.toLowerCase()) ?? 0
  }))
    .sort((a, b) => b.projectsNeeding - a.projectsNeeding || a.peopleWithSkill - b.peopleWithSkill || a.skill.localeCompare(b.skill))
    .slice(0, 10);

  // ---- Application funnel
  const statusCount = (status: string) => applications.filter((application) => application.status === status).length;
  const funnel = [
    { status: "submitted", label: "Submitted (awaiting review)", count: statusCount("SUBMITTED") },
    { status: "interview", label: "Interviewing", count: statusCount("INTERVIEW") },
    { status: "accepted", label: "Accepted", count: statusCount("ACCEPTED") },
    { status: "declined", label: "Declined", count: statusCount("DECLINED") }
  ];

  return {
    generatedAt: new Date().toISOString(),
    syntheticAccounts: users.filter((user) => isSyntheticEmail(user.email)).length,
    totalAccounts: users.length,
    syntheticApplications: rows.filter((row) => row.synthetic).length,
    participation,
    departmentNetwork,
    skillDemand,
    funnel,
    recommendationQuality: {
      usedEmbeddings,
      methods: methods.map((method) => ({ method, ...summarizeRanks(observations[method]) }))
    },
    rows
  };
}

export type Analytics = Awaited<ReturnType<typeof getAnalytics>>;
