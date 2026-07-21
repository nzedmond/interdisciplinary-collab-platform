import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

type SessionRole = "student" | "faculty" | "admin";
const authSecret = process.env.AUTH_SECRET;
const databaseUrl = process.env.DATABASE_URL;

if (!authSecret) {
  throw new Error("AUTH_SECRET is required. Set AUTH_SECRET in your environment.");
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Set DATABASE_URL in your environment.");
}

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
  secret: authSecret,
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

      if (token.email) {
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
