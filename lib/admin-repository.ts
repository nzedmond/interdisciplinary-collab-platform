import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session-user";

export type AdminRole = "student" | "faculty" | "admin";

const toDbRole = { student: "STUDENT", faculty: "FACULTY", admin: "ADMIN" } as const;

function fromDbRole(role: string): AdminRole {
  return role === "ADMIN" ? "admin" : role === "FACULTY" ? "faculty" : "student";
}

// Returns the signed-in user's id only if they are an admin and not suspended.
export async function getSessionAdminId() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, suspendedAt: true }
  });

  return user?.role === "ADMIN" && !user.suspendedAt ? userId : null;
}

export async function getAdminOverview() {
  const [usersByRole, suspendedUsers, projectsByStatus, unverifiedOpenProjects, applicationsByStatus] =
    await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.user.count({ where: { suspendedAt: { not: null } } }),
      prisma.project.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.project.count({ where: { verifiedAt: null, status: { not: "ARCHIVED" } } }),
      prisma.application.groupBy({ by: ["status"], _count: { _all: true } })
    ]);

  // Turns groupBy rows into { STUDENT: 4, FACULTY: 3, ... }.
  const toCounts = (rows: { key: string; count: number }[]) =>
    Object.fromEntries(rows.map(({ key, count }) => [key, count])) as Record<string, number | undefined>;
  const sum = (counts: Record<string, number | undefined>) =>
    Object.values(counts).reduce<number>((total, value) => total + (value ?? 0), 0);

  const users = toCounts(usersByRole.map((row) => ({ key: row.role, count: row._count._all })));
  const projects = toCounts(projectsByStatus.map((row) => ({ key: row.status, count: row._count._all })));
  const applications = toCounts(applicationsByStatus.map((row) => ({ key: row.status, count: row._count._all })));

  return {
    users: {
      total: sum(users),
      students: users.STUDENT ?? 0,
      faculty: users.FACULTY ?? 0,
      admins: users.ADMIN ?? 0,
      suspended: suspendedUsers
    },
    projects: {
      total: sum(projects),
      open: projects.OPEN ?? 0,
      reviewing: projects.REVIEWING ?? 0,
      filled: projects.FILLED ?? 0,
      archived: projects.ARCHIVED ?? 0,
      awaitingVerification: unverifiedOpenProjects
    },
    applications: {
      total: sum(applications),
      submitted: applications.SUBMITTED ?? 0,
      interview: applications.INTERVIEW ?? 0,
      accepted: applications.ACCEPTED ?? 0,
      declined: applications.DECLINED ?? 0
    }
  };
}

export type AdminProject = Awaited<ReturnType<typeof listProjectsForAdmin>>[number];

// Unverified projects first (they need attention), then newest.
export async function listProjectsForAdmin() {
  const projects = await prisma.project.findMany({
    include: {
      owner: { select: { id: true, name: true, email: true, suspendedAt: true } },
      _count: { select: { applications: true } }
    },
    orderBy: [{ verifiedAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }]
  });

  return projects.map((project) => ({
    id: project.id,
    title: project.title,
    category: project.category,
    departments: project.departments,
    status: project.status.toLowerCase() as "open" | "reviewing" | "filled" | "archived",
    verified: Boolean(project.verifiedAt),
    ownerId: project.owner.id,
    ownerName: project.owner.name,
    ownerEmail: project.owner.email,
    ownerSuspended: Boolean(project.owner.suspendedAt),
    applicants: project._count.applications,
    createdAt: project.createdAt.toISOString().slice(0, 10)
  }));
}

export type AdminUser = Awaited<ReturnType<typeof listUsersForAdmin>>[number];

export async function listUsersForAdmin() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      suspendedAt: true,
      passwordHash: true,
      createdAt: true,
      _count: { select: { ownedProjects: true, applications: true } }
    },
    orderBy: [{ role: "asc" }, { name: "asc" }]
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: fromDbRole(user.role),
    department: user.department ?? "",
    suspended: Boolean(user.suspendedAt),
    // Accounts without a password can't sign in until they claim the email at /signup.
    canSignIn: Boolean(user.passwordHash) && !user.suspendedAt,
    projects: user._count.ownedProjects,
    applications: user._count.applications,
    joinedAt: user.createdAt.toISOString().slice(0, 10)
  }));
}

export async function moderateProject(projectId: string, change: { verified?: boolean; archived?: boolean }) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { status: true } });

  if (!project) {
    return null;
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(change.verified === undefined ? {} : { verifiedAt: change.verified ? new Date() : null }),
      // Restoring an archived project reopens it; the owner can change status from there.
      ...(change.archived === undefined
        ? {}
        : { status: change.archived ? "ARCHIVED" : project.status === "ARCHIVED" ? "OPEN" : project.status })
    }
  });

  return (await listProjectsForAdmin()).find((item) => item.id === projectId) ?? null;
}

export async function updateUserByAdmin(userId: string, change: { role?: AdminRole; suspended?: boolean }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });

  if (!user) {
    return null;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(change.role === undefined ? {} : { role: toDbRole[change.role] }),
      ...(change.suspended === undefined ? {} : { suspendedAt: change.suspended ? new Date() : null })
    }
  });

  return (await listUsersForAdmin()).find((item) => item.id === userId) ?? null;
}
