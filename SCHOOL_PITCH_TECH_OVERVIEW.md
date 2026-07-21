# Collab Commons: Technical Overview + Production Readiness Plan

## 1) What this app is

**Collab Commons** is an interdisciplinary collaboration platform for a school campus.  
It helps students discover projects across departments, apply to them, and helps project owners review applicants and manage project status.

The current version is a **working MVP** with real backend persistence and authenticated flows.

---

## 2) Core user flows (what works now)

1. **Sign in** with a university-style email (`.edu`) using Auth.js credentials flow.
2. **Browse projects** on the dashboard with search + filters.
3. **View project details** and see recommendation-style match explanations.
4. **Save/unsave projects**.
5. **Apply to projects** with availability + interest note.
6. **Project owners** can:
   - review applicants,
   - update applicant status (submitted/interview/accepted/declined),
   - update project status (open/reviewing/filled).
7. **Users can edit profile** (name, department, title/major, graduation year, links, skills, interests).

---

## 3) Frontend architecture and technologies

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19 + TypeScript
- **Styling:** Tailwind CSS
- **Icons:** lucide-react

### Frontend structure

- `app/` contains pages and API routes.
- `components/` contains reusable UI components.
- Dashboard is client-rendered and fetches data from internal API routes.
- Dedicated pages exist for:
  - project creation,
  - my projects (owner workspace),
  - project application,
  - profile editing.

### UX behavior

- Optimistic UI updates are used for some actions (ex: status updates), with fallback rollback on failure.
- Auth-protected pages redirect unauthenticated users to sign-in.

---

## 4) Backend architecture and technologies

- **Runtime/API layer:** Next.js Route Handlers (`app/api/...`)
- **Authentication:** Auth.js (NextAuth v5 beta), credentials provider
- **Database ORM:** Prisma
- **Database:** PostgreSQL

### Backend responsibilities

- Validate request payloads with shared helpers.
- Enforce authorization rules on write operations.
- Read/write user, project, saved-project, and application data.
- Return consistent error responses (`400/401/403/404/409/429`).

### Security controls already implemented

- Session-based auth checks on protected routes.
- Owner-only controls for project/applicant management.
- Protection against applying to your own project.
- Protection against applying to non-open projects.
- Basic endpoint rate limiting on write APIs.

---

## 5) Data model (Prisma/PostgreSQL)

Main entities:

- **User** (role, profile details, links)
- **Project** (owner, description, skills, status)
- **Application** (project-applicant relation + review status)
- **SavedProject** (bookmark relation)
- **Skill / Interest** (normalized taxonomy)
- **Join tables** for user skills/interests and project skills

This supports both current MVP workflows and later recommendation expansion.

---

## 6) Recommendation layer (current vs future)

### Current MVP behavior

- Uses deterministic overlap scoring between profile signals and project signals.
- Shows human-readable recommendation reason text.

### Planned upgrade

- Enable semantic matching with embeddings + pgvector.
- Add richer explanation quality and ranking transparency.

---

## 7) What is still missing for production readiness

## A) Infrastructure + operations

1. **Hosted production database** (Neon/Supabase/AWS RDS) with backups + access controls.
2. **Environment management** in deployment platform (Vercel env vars + secret rotation policy).
3. **Monitoring + alerting** (runtime error tracking and uptime alerts).
4. **Log aggregation** for API/auth/database errors.

## B) Authentication and identity hardening

1. Move from simple credentials MVP to stronger school identity strategy:
   - campus SSO/OAuth/SAML (if available), or
   - verified institutional email onboarding with anti-abuse controls.
2. Add account lifecycle controls (suspension, role escalation approval, etc.).

## C) Security hardening

1. Expand rate limiting strategy (per-route + per-user + per-IP policies).
2. Add audit logs for sensitive owner/admin actions.
3. Add stronger abuse prevention (content/report moderation hooks).
4. Add formal security headers and threat-model review.

## D) Quality and reliability

1. Add **end-to-end browser tests** for full user flows.
2. Expand integration tests for edge/error cases and regressions.
3. Add load/performance tests for peak usage scenarios.

## E) Product completeness

1. Admin moderation tools (user/project verification and policy actions).
2. Notification system (application updates, owner actions).
3. Better profile completion UX and onboarding guidance.
4. Analytics dashboards for impact reporting to school stakeholders.

---

## 8) Suggested rollout plan for your school pitch

1. **Phase 1 (Pilot):** one department or one interdisciplinary program, limited users.
2. **Phase 2 (Cross-campus beta):** expand departments, collect engagement and match-quality data.
3. **Phase 3 (Production):** institutional auth integration, moderation tooling, reliability SLAs.

For a next-month pitch, you can position this as:

- a **live MVP already functioning end-to-end**, and
- a **clear production roadmap** with concrete security, reliability, and governance milestones.

---

## 9) Quick tech stack summary (for slides)

- **Frontend:** Next.js + React + TypeScript + Tailwind
- **Backend:** Next.js API routes + Auth.js
- **Data:** PostgreSQL + Prisma
- **Current strengths:** authenticated workflows, real persistence, owner review loop, profile editing
- **Next production steps:** hosted infra, observability, stronger identity integration, expanded testing, admin/governance tooling
