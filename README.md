# Tutor Site — Study Accountability Portal

A production-ready MVP for tutoring accountability: daily study logs, weekly streaks, homework tracking, mistake reflection, AI pattern analysis, and parent-friendly progress summaries.

Built with **Next.js App Router**, **TypeScript**, **Tailwind CSS**, and **Supabase** (Auth + Postgres + RLS).

## Features

- **Google OAuth** via Supabase Auth
- **Roles:** admin/tutor, student, parent with row-level security
- **Student dashboard:** daily logs, streaks, homework, mistakes, AI insights
- **Admin dashboard:** student overview, detail analytics, homework, comments, streak freezes, parent links, export
- **Parent dashboard:** linked students only — progress, homework, shared comments
- **AI mistake analysis:** server-side OpenAI grouping (manual tags preserved)

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- Google OAuth credentials (configured in Supabase Auth)
- OpenAI API key (optional, for AI summaries)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/westonmbenner-tech/tutor-site.git
cd tutor-site
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only; optional for MVP) |
| `OPENAI_API_KEY` | OpenAI key for mistake summaries |
| `NEXT_PUBLIC_SITE_URL` | e.g. `http://localhost:3000` |

### 3. Supabase database

Apply the migration in `supabase/migrations/20250608000000_initial_schema.sql`:

- **Supabase Dashboard:** SQL Editor → paste and run
- **Or Supabase CLI:** `supabase db push` (if linked)

This creates all tables, RLS policies, auth trigger, and helper functions.

### 4. Google Auth in Supabase

1. Supabase Dashboard → **Authentication** → **Providers** → enable **Google**
2. Add authorized redirect URL: `http://localhost:3000/auth/callback`
3. For production, add your Vercel URL: `https://your-domain.vercel.app/auth/callback`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Creating the first admin user

1. Sign in with Google at `/login` (creates a `profiles` row with role `student` by default)
2. In Supabase SQL Editor, promote your account:

```sql
UPDATE public.profiles
SET role = 'admin', full_name = 'Your Name'
WHERE email = 'your@gmail.com';
```

3. Sign out and back in — you will land on `/admin`

## Adding students and parents

1. **Student:** Have them sign in with Google first, then in **Admin → Students** add their display name and email to link their profile
2. **Parent:** Same flow under **Admin → Parents**
3. **Link parent to student:** Open **Admin → Students → [student]** → Parent links

## Deploy to Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables from `.env.example`
4. Set `NEXT_PUBLIC_SITE_URL` to your production URL
5. Add production callback URL in Supabase Auth settings

## Project structure

```
src/
  app/              # Routes (dashboard, admin, parent, API)
  components/       # Reusable UI (forms, charts, cards)
  lib/              # Auth, streak logic, analytics, Supabase clients
supabase/
  migrations/       # SQL schema + RLS
```

## Routes

| Route | Role |
|-------|------|
| `/login` | Public |
| `/dashboard` | Student |
| `/dashboard/homework` | Student |
| `/dashboard/mistakes` | Student |
| `/dashboard/ai-summary` | Student |
| `/admin` | Admin |
| `/admin/students` | Admin |
| `/admin/students/[studentId]` | Admin |
| `/admin/homework` | Admin |
| `/admin/parents` | Admin |
| `/parent` | Parent |

## Streak logic

- Streaks are based on **posting a study log**, not question count
- A successful week = activity logged on **5 of 7 days** (Monday–Sunday)
- **Streak freezes** (admin-applied) count as excused days toward the 5-day target
- **Weekly streak** = consecutive successful weeks

## Security notes

- OpenAI key is server-only (`/api/ai/mistake-summary`)
- RLS enforces student/parent data isolation
- Never commit `.env.local`

## License

MIT
