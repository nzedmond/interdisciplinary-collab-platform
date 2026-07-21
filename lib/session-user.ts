import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionUserId() {
  const session = await auth();

  if (session?.user?.id) {
    return session.user.id;
  }

  const email = session?.user?.email?.trim().toLowerCase();

  if (!email || !process.env.DATABASE_URL) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  return user?.id ?? null;
}
