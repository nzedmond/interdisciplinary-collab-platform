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
- Auth.js (email + password, JWT sessions)

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

- Every page requires sign-in. Sign in at [http://localhost:3000/login](http://localhost:3000/login) with email and password.
- New users create an account at `/signup` with a `.edu` email, choosing student or faculty. Passwords are hashed with scrypt.
- API routes check the session themselves and return `401` when signed out.
- **Email verification**: sign-up emails a confirmation link (valid 24 hours). The account
  isn't created, or an existing passwordless account claimed, until the link is confirmed, and
  unverified people can't sign in. Signing in with the right password before confirming sends a
  fresh link. At most 3 emails per address per 15 minutes. Only a hash of each link's token is stored.
- **Sending email**: set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `EMAIL_FROM`
  (any SMTP provider: your college's server, Gmail with an app password, Resend, Mailgun...).
  In `npm run dev` without SMTP, the link is printed in the server log and shown on screen
  instead. In production without SMTP, sign-up is refused rather than skipping verification.
- Students and faculty choose their own role at sign-up; admins can correct roles in Admin tools.

`npm run prisma:seed` creates these demo accounts, all with the password `collab-demo`:

| Email | Role | Useful for |
|---|---|---|
| `maya.johnson@example.edu` | Student | Browsing, saving, and applying; has two applications |
| `p-001@example.edu` | Faculty (Prof. Amina Okafor) | Reviewing applicants on an owned project |
| `p-004@example.edu` | Student (Rina Patel) | A student who owns a project |
| `admin@example.edu` | Admin | Admin tools at `/admin` |

- `AUTH_SECRET` and `DATABASE_URL` are required in all environments (no development fallback sign-in)

## Project owner tools

- **My projects** (`/projects/mine`) lists each project you own with its applicants, per-status counts, and one-click Interview / Accept / Decline (with Undo).
- **Applicant profiles** (`/people/[id]`) show an applicant's full profile and their applications to your projects. A profile is visible only to its owner, admins, and owners of projects the person applied to; anyone else gets a 404.
- **Contact**: an Email button opens a pre-addressed message to the applicant.
- Owners see "Manage applicants" instead of "Apply" on their own projects; applicants see their application status; closed projects show "Applications closed".

## Semantic matching (local, open-source)

Match scores compare each project with the signed-in user's profile using
[`all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2), a small open-source
sentence-embedding model that runs inside Node via `@huggingface/transformers`. No API key or
external service is used at runtime.

- Run `npm run embeddings:warm` once after `npm install` to download the model (~23 MB) into
  `.cache/models`. After that, matching works offline.
- **Score** = 70% meaning similarity (profile text vs. project text) + 30% exact skill overlap.
  Both parts are returned by the API (`semanticScore`, `keywordScore`, `matchMethod`) so semantic
  and keyword matching can be compared.
- **Explanations** name the user's exact matching skills plus the skills/interests closest in
  meaning to the project (e.g. "relates to your interest in Community archives").
- Embeddings are cached in the `TextEmbedding` table by a hash of the text, so each project,
  profile, and skill is embedded once and re-embedded only when it changes.
- If the model can't load, scoring falls back to keyword matching and logs a warning.
- Vectors are stored as JSON and compared in Node, which is fast at campus scale. Moving them
  to pgvector is the path if the dataset grows to many thousands of projects.

## Admin tools

Sign in as `admin@example.edu` and open `/admin` (also linked from the dashboard). Non-admins get a 404 there and a 403 from the admin API.

- **Overview**: counts of users by role, projects by status, projects awaiting verification, and applications by status.
- **Project verification**: Verify / Unverify. Verified projects show a "Verified" badge everywhere.
- **Moderation**: Archive hides a project from browsing and closes it; only its owner and admins can still open it, and only an admin can Restore it.
- **User management**: change roles and Suspend / Reinstate. Suspended users can't sign in and their current session ends. Admins can't demote or suspend themselves.

The seed marks faculty and staff projects as verified and leaves the student project for an admin to review.

## Research analytics

Admins open **Admin tools → Analytics** (`/admin/analytics`).

- **Interdisciplinary participation**: cross-department application and acceptance rates,
  students who applied, acceptance rate.
- **Recommendation quality**: for every application, the chosen project is ranked among all
  active projects the applicant could have picked, separately by semantic, keyword, and hybrid
  scores. Reports mean rank percentile (50% = random) and top-1 / top-3 hit rates. Ties count
  half, so keyword matching's many zero scores neither help nor hurt it.
- **Department collaboration network**: heatmap of applicant department → project department.
- **Skill demand vs supply** and the **application funnel**.
- **Export CSV** (`/api/admin/analytics/export`): one anonymized row per application (hashed
  keys; no names, emails, or messages), including each method's score and percentile and a
  `synthetic` flag.

### Demo activity (synthetic)

`npm run seed:demo-activity` adds 12 demo students, 4 demo faculty projects, and 26
applications (all `@demo.example.edu`, password `collab-demo`) so the analytics page has data.
Every `example.edu` account is treated as synthetic: the analytics page shows a warning and the
CSV flags those rows. Remove the demo activity with
`npm run seed:demo-activity -- --remove` before collecting real data.

## Deployment

See **[DEPLOY.md](DEPLOY.md)** for step-by-step setup on Vercel + Neon with an SMTP provider,
creating the first admin (`npm run make-admin -- you@college.edu`), and post-deploy checks
(`BASE_URL=https://your-app npm run smoke:api`).

## Database Setup

Set `DATABASE_URL` in `.env`, then run:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

The app reads and writes projects, saved projects, applications, and profile updates through Prisma. Run `npm run prisma:seed` after migrating to load sample users, profiles, projects, skills, and applications.

If you do not already have a local PostgreSQL server running, use a hosted development database such as Neon or Supabase and paste its connection string into `.env`.

## Runtime guardrails

- Auth-protected write endpoints enforce rate limits and return HTTP `429` when thresholds are exceeded.
- Security-relevant rate-limit blocks are logged server-side for operational visibility.

## Suggested Next Milestones

1. Deploy following DEPLOY.md (Vercel + Neon + SMTP).
2. Collect real usage and evaluate semantic vs keyword matching with the analytics export.
