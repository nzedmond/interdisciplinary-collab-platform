import NextAuth from "next-auth";

// Page-level guard: every page except /login and /signup needs a session.
// API routes are excluded here because each one checks the session itself and
// returns a JSON 401 (covered by the route tests).
// This instance only decodes the session cookie; it must stay edge-safe, so it
// does not import auth.ts (Prisma) or define providers.
const { auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth?.user);
    }
  }
});

export default auth;

export const config = {
  matcher: ["/((?!api|login|signup|verify-email|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"]
};
