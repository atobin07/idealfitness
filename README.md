# IdealFitness Hub

An operations, scheduling, and communication hub for a gym's trainers and clients.

Built with **Next.js (App Router)**, **Supabase** (Postgres + Auth + Row-Level Security), **Tailwind CSS**, and deployed on **Vercel**.

## Features

- **Auth & roles** — email/password sign-in with two roles: **trainer** and **client**. Trainers get the operations surface (roster, gym-wide announcements, dashboard).
- **Dashboard** — role-aware overview of upcoming sessions, unread messages, active clients, and the latest announcements.
- **Calendar & booking** — book, view, and manage training sessions. Trainers can mark sessions completed / no-show / cancelled; clients can cancel. Upcoming and past views.
- **Client management** — trainers keep a roster, open a client profile, review session history, and log progress (weight, body-fat, notes). Clients see and connect with their trainer.
- **Messaging** — 1:1 direct messages between trainers and clients, with unread badges.
- **Announcements** — gym-wide posts authored by trainers, visible to everyone.
- **Settings** — edit your profile, bio/specialties, and goals.

## Data model

| Table | Purpose |
|-------|---------|
| `profiles` | One row per auth user (role, name, contact, bio, goals). |
| `trainer_clients` | Links clients to trainers. |
| `availability` | Recurring weekly availability windows for trainers. |
| `sessions` | Calendar bookings between a trainer and a client. |
| `messages` | 1:1 direct messages. |
| `announcements` | Gym-wide posts (trainer-authored). |
| `client_progress` | Measurement / progress log per client. |

Every table is protected by **Row-Level Security** — users only ever see and modify their own data. See `supabase/migrations/0001_init.sql`.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

Environment variables:

| Variable | Where to find it |
|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API (publishable/anon key) |

## Database setup

Apply the migration in `supabase/migrations/0001_init.sql` to a Supabase project
(via the Supabase SQL editor, the CLI, or the dashboard). It creates all tables,
the `handle_new_user` trigger that provisions a profile on signup, and the
row-level-security policies.

## Deployment

Deployed on Vercel. Set the two environment variables above in the Vercel
project settings, then push to deploy.
