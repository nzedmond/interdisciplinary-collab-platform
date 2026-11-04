import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/password";
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  },
  providers: [
    Credentials({
      name: "University email",
      credentials: {
        email: {
          label: "University email",
          type: "email"
        },
        password: {
          label: "Password",
          type: "password"
        }
      },
      // Accounts are created at /signup; sign-in only checks an existing email + password.
      async authorize(credentials) {
        const email =
          typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
          return null;
        }

        if (user.suspendedAt) {
          return null;
        }

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
            role: true,
            suspendedAt: true
          }
        });

        // Ends the session (the user is signed out) once an admin suspends them.
        if (dbUser?.suspendedAt) {
          return null;
        }

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
