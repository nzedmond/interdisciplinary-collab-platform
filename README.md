# Collab Commons

AI-assisted interdisciplinary collaboration platform for liberal arts institutions.

This MVP scaffolds the first usable slice of the product: students can browse campus projects, filter by department/category, search by keyword or skill, view recommendation explanations, save projects, and track application status from a dashboard.

## MVP Scope

- Project discovery dashboard with realistic seed data
- Search and filters for department, category, skill, and topic
- User profile snapshot with skills and interests
- Application status panel and project-owner applicant review
- Recommendation explanation surface
- Prisma data model for users, profiles, skills, projects, saved projects, applications, and future pgvector embeddings
- Prisma-backed API routes for project listings, project creation, saved projects, applications, and owner status review

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Auth.js-ready structure

## Getting Started

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
cp .env.example .env
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Authentication

This app now uses Auth.js session-based protection for project posting, saved projects, applications, and owner-review endpoints.

- Sign in at [http://localhost:3000/api/auth/signin](http://localhost:3000/api/auth/signin)
- Use a `.edu` email address for the credentials sign-in flow
- `AUTH_SECRET` and `DATABASE_URL` are required in all environments (no development fallback sign-in)

## Database Setup

Set `DATABASE_URL` in `.env`, then run:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

The app reads and writes projects, saved projects, applications, and profile updates through Prisma. Run `npm run prisma:seed` after migrating to load sample users, profiles, projects, skills, and applications.

If you do not already have a local PostgreSQL server running, use a hosted development database such as Neon or Supabase and paste its connection string into `.env`.

## Suggested Next Milestones

1. Wire Auth.js university-email login and role-based sessions.
2. Replace dashboard profile data with the authenticated database user.
3. Add admin moderation and project verification.
4. Enable pgvector and store project/user embeddings for semantic matching.
5. Add analytics for recommendation quality and cross-department collaboration patterns.
