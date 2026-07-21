import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

type SessionRole = "student" | "faculty" | "admin";
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

function toSessionRole(role: string): SessionRole {
  if (role === "FACULTY") {
    return "faculty";
  }

  if (role === "ADMIN") {
    return "admin";
  }

  return "student";
}

export const { handlers, auth } = NextAuth({
  secret: process.env.AUTH_SECRET ?? "development-only-auth-secret",
  session: {
    strategy: "jwt"
  },
  providers: [
    Credentials({
      name: "University email",
      credentials: {
        name: {
          label: "Full name",
          type: "text"
        },
        email: {
          label: "University email",
          type: "email"
        }
      },
      async authorize(credentials) {
        const email =
          typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const name = typeof credentials.name === "string" ? credentials.name.trim() : "";

        if (!email.endsWith(".edu") || !name) {
          return null;
        }

        if (!hasDatabaseUrl) {
          return {
            id: email,
            email,
            name,
            role: "student" as const
          };
        }

        const user = await prisma.user.upsert({
          where: { email },
          update: {
            name
          },
          create: {
            email,
            name,
            role: "STUDENT"
          }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: toSessionRole(user.role)
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }

      if (token.email && hasDatabaseUrl) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: {
            id: true,
            name: true,
            role: true
          }
        });

        if (dbUser) {
          token.sub = dbUser.id;
          token.name = dbUser.name;
          token.role = toSessionRole(dbUser.role);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role === "faculty" || token.role === "admin" ? token.role : "student";
      }

      return session;
    }
  }
});
