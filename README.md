# Collab Commons

AI-assisted interdisciplinary collaboration platform for liberal arts institutions.

This MVP scaffolds the first usable slice of the product: students can browse campus projects, filter by department/category, search by keyword or skill, view recommendation explanations, save projects, and track application status from a dashboard.

## MVP Scope

- Project discovery dashboard with realistic seed data
- Search and filters for department, category, skill, and topic
- User profile snapshot with skills and interests
- Application status panel
- Recommendation explanation surface
- Prisma data model for users, profiles, skills, projects, saved projects, applications, and future pgvector embeddings
- API route stub for project listings

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

## Database Setup

Set `DATABASE_URL` in `.env`, then run:

```bash
npm run prisma:generate
npm run prisma:migrate
```

The current UI uses local seed data so the product can be reviewed before the database is connected.

## Suggested Next Milestones

1. Wire Auth.js university-email login and role-based sessions.
2. Replace mock data with Prisma queries and mutations.
3. Add project creation and application submission forms.
4. Add admin moderation and project verification.
5. Enable pgvector and store project/user embeddings for semantic matching.
6. Add analytics for recommendation quality and cross-department collaboration patterns.
