# Deploying Collab Commons

Hosting: **Vercel** (app) + **Neon** (PostgreSQL) + an **SMTP** provider (verification email).
All three have free tiers that cover a campus demo. Plan on about 30 minutes.

The repo is already set up for this: Vercel runs `npm run vercel-build`, which applies database
migrations, downloads the embedding model, and builds the app. Server functions are ~115 MB
(Vercel's limit is 250 MB).

## 1. Database: Neon

1. Create a free account at [neon.tech](https://neon.tech) and a new project. Pick the region
   closest to your users (e.g. `US East (Ohio)` for upstate New York).
2. On the project dashboard, open **Connect** and copy two connection strings:
   - **Pooled** (the host contains `-pooler`) → this is `DATABASE_URL`.
   - **Direct** (turn off "Connection pooling") → this is `DIRECT_URL`. Migrations need it.

## 2. Email: an SMTP provider

Pick one. You need a host, port, username, password, and a "from" address.

| Provider | Free tier | Setup | Notes |
|---|---|---|---|
| **Brevo** | 300 emails/day | Verify a single sender email address | Easiest without owning a domain. SMTP host `smtp-relay.brevo.com`, port `587`; the SMTP key is the password. |
| **Gmail** | ~500/day | Turn on 2-Step Verification, then create an **App password** | Host `smtp.gmail.com`, port `587`, user = your Gmail address, password = the 16-character app password. Mail comes from your Gmail. |
| **Your college** | varies | Ask IT for SMTP relay access | Most trustworthy "from" address (`@colgate.edu`), but needs IT approval. |
| Resend / Mailgun | 3,000/month+ | Verify a domain you own (DNS records) | Best deliverability, but you need a domain. |

Campus mail filters can be strict. After deploying, send yourself a test sign-up and check spam.

## 3. App: Vercel

1. Create a free account at [vercel.com](https://vercel.com) (sign in with GitHub).
2. **Add New → Project → Import** `nzedmond/interdisciplinary-collab-platform`. Framework: Next.js (auto-detected). Leave the build settings at their defaults.
3. Before deploying, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | Neon pooled connection string |
   | `DIRECT_URL` | Neon direct connection string |
   | `AUTH_SECRET` | A new secret: run `openssl rand -base64 32`. Don't reuse your local one. |
   | `AUTH_URL` | Your production URL, e.g. `https://collab-commons.vercel.app` (fill in after the first deploy if you don't know it yet, then redeploy) |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | From step 2 |
   | `EMAIL_FROM` | e.g. `Collab Commons <you@your-sender-address>` (must be the sender your provider verified) |

4. **Deploy.** The first build applies all migrations to the empty Neon database.
5. Under **Settings → Functions**, set the function region to match Neon's region (fewer round trips).

## 4. First admin

Don't run `npm run prisma:seed` against production: its demo accounts share the published
password `collab-demo`. Instead:

1. Open the live site, sign up with your own `.edu` email, and confirm it from your inbox.
2. On your computer, promote that account using the Neon **direct** connection string:

   ```bash
   DATABASE_URL="<neon direct url>" DIRECT_URL="<neon direct url>" npm run make-admin -- you@colgate.edu
   ```

3. Reload the site: the Admin button appears.

If you want sample projects on the live site for a presentation, create them through the app, or
seed a separate preview database, not the one real users will join.

## 5. Check it

```bash
BASE_URL=https://your-app.vercel.app npm run smoke:api
```

Then, in the browser:
- Sign up with a second address → the confirmation email arrives → confirm → sign in.
- Open a project: the score breakdown should say "meaning similarity". If it only mentions
  skill overlap, the embedding model didn't load; check the function logs for `[matching]`.
- Admin → Analytics loads, and **Export CSV** downloads.

## Known limits on the free tiers

- **Cold starts**: the first request after idle time loads the model (~1 s). Later requests are fast,
  and embeddings are cached in the database.
- **Rate limiting** of sign-ups by IP is in memory, so it's per server instance. The per-address
  email limit (3 per 15 minutes) is stored in the database and holds across instances.
- **Vercel Hobby** is for non-commercial use, which fits a thesis project.
