<div align="center">

# 📊 GitHub Dashboard

**A production-ready SaaS dashboard for engineering managers to monitor team pull request activity, track velocity, and identify bottlenecks — built on Next.js 15, Supabase, and the GitHub API.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://github-dashboard-omega-six.vercel.app/)
[![GitHub](https://img.shields.io/badge/Source%20Code-GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ukazimchisom/github-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat-square&logo=playwright&logoColor=white)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Architecture Overview](#-architecture-overview)
- [Technical Decisions](#-technical-decisions)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Known Limitations and Future Work](#-known-limitations-and-future-work)
- [License](#-license)

---

## 🌟 Overview

GitHub Dashboard gives engineering managers a single place to see what their team is working on — without digging through GitHub manually. After connecting with GitHub OAuth, managers sync their repositories and immediately see:

- How many PRs are open across all their repos
- How long PRs are sitting before being merged
- Which week had the highest merge velocity
- The full list of pull requests filterable by status

The project was built as an MVP in 14 incremental steps, prioritising a working product over feature completeness. Every architectural decision was made with maintainability, security, and real-world scalability in mind.

---

## ✨ Features

### Authentication

- GitHub OAuth login via Supabase Auth
- Session management via secure HTTP-only cookies
- Protected routes enforced at the middleware layer
- GitHub access token persisted to database after OAuth exchange

### Dashboard

- **4 Metric Cards** — Total PRs, Open PRs, Average Review Time, Weekly Velocity
- **PR Activity Chart** — Grouped bar chart of PRs opened vs merged over the last 8 weeks
- **PR List Table** — All pull requests with author avatar, repository, status badge, and relative timestamp
- **Status Filtering** — Filter PRs by Open, In Review, Approved, Merged, or Closed
- **Pagination** — Client-side pagination for large PR datasets

### GitHub Integration

- Full OAuth flow requesting `repo`, `read:user`, and `read:org` scopes
- Paginated repository fetching (handles accounts with 100+ repos)
- Paginated pull request fetching per repository
- Rate limit check before every sync — warns if fewer than 100 requests remain
- Upsert logic — re-syncing never creates duplicate records
- PR status inference from GitHub's raw `open`/`closed` states

### UX

- Skeleton loading states on every data-heavy component
- Toast notifications for sync progress and errors
- Empty states with clear calls to action before first sync
- Fully responsive layout (desktop and tablet)
- Color-coded review time (green → yellow → red as time increases)

---

## 🛠 Tech Stack

| Layer             | Technology              | Why                                                           |
| ----------------- | ----------------------- | ------------------------------------------------------------- |
| Framework         | Next.js 15 (App Router) | Server Components, built-in routing, API routes, middleware   |
| Language          | TypeScript              | Type safety across the entire stack                           |
| Styling           | Tailwind CSS            | Utility-first, no CSS context switching                       |
| Database & Auth   | Supabase (PostgreSQL)   | Managed Postgres with built-in RLS and OAuth                  |
| Server State      | TanStack Query          | Caching, background refetch, loading/error states             |
| Charts            | Recharts                | React-native SVG charts, simpler API than D3                  |
| GitHub API        | Octokit REST            | Official GitHub SDK with TypeScript types and auto-pagination |
| Client State      | Zustand                 | Lightweight, no boilerplate (ready for team filter feature)   |
| Unit Testing      | Vitest                  | Fast, Vite-native, Jest-compatible API                        |
| Component Testing | React Testing Library   | Tests behaviour not implementation                            |
| E2E Testing       | Playwright              | Real browser automation, reliable selectors                   |
| Deployment        | Vercel                  | Zero-config Next.js hosting, automatic CI/CD                  |

---

## 📸 Screenshots

![]()

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│                                                     │
│  Client Components (TanStack Query + Zustand)       │
│  ├── MetricsCards                                   │
│  ├── PRChart                                        │
│  ├── PRList (with filter + pagination)              │
│  └── SyncButton                                     │
└──────────────────┬──────────────────────────────────┘
                   │ fetch / Supabase JS client
┌──────────────────▼──────────────────────────────────┐
│               Next.js Server                        │
│                                                     │
│  Server Components (no JS sent to browser)          │
│  ├── DashboardLayout (auth check)                   │
│  └── LoginPage (session redirect)                   │
│                                                     │
│  API Routes                                         │
│  └── POST /api/github/sync                          │
│      ├── Verify session                             │
│      ├── Read GitHub token from profiles table      │
│      ├── Call GitHub API (Octokit)                  │
│      └── Upsert to Supabase                         │
│                                                     │
│  Middleware (every request)                         │
│  └── Refresh session cookie + redirect if unauthed │
└──────────────────┬──────────────────────────────────┘
                   │ Supabase JS (server client)
┌──────────────────▼──────────────────────────────────┐
│              Supabase (PostgreSQL)                  │
│                                                     │
│  Tables: profiles, teams, team_members,             │
│          repositories, pull_requests                │
│                                                     │
│  RLS: every table — managers see only their data    │
└─────────────────────────────────────────────────────┘
```

### Request Flow: Sync

```
User clicks "Sync GitHub Data"
  → POST /api/github/sync
  → Server verifies session via supabase.auth.getUser()
  → Server reads GitHub token from profiles table
  → Octokit fetches repositories (paginated)
  → Supabase upserts repositories
  → Octokit fetches PRs per repo (paginated, max 10 repos for MVP)
  → Review time calculated (created_at → merged_at in hours)
  → Supabase upserts pull_requests
  → Result returned to client
  → Toast shown, page reloads with fresh data
```

---

## 🧠 Technical Decisions

### Why Three Separate Supabase Clients?

Next.js App Router runs code in three distinct environments — the browser, the Node.js server, and the Edge runtime (middleware). Each environment has different capabilities and security requirements:

| Client            | File                         | Environment    | Reason                                                             |
| ----------------- | ---------------------------- | -------------- | ------------------------------------------------------------------ |
| Browser client    | `lib/supabase/client.ts`     | Browser only   | Used in Client Components; reads session from cookie               |
| Server client     | `lib/supabase/server.ts`     | Node.js server | Used in Server Components and API routes; reads and writes cookies |
| Middleware client | `lib/supabase/middleware.ts` | Edge runtime   | Refreshes the session token on every request before the page loads |

Using a single client for all three environments causes subtle session bugs — cookies don't propagate correctly, sessions expire without being refreshed, and server renders can see stale auth state. Three separate clients with clear responsibilities eliminates this class of bugs entirely.

---

### Why Row Level Security Instead of Application-Level Auth Checks?

Most tutorials protect data by checking `user.id` inside API routes and returning early if the check fails. This works but has a critical weakness: **a bug in your application code can expose another user's data**.

RLS moves access control into the database itself. Even if the application has a bug — or someone calls the Supabase API directly with the anon key — the database refuses to return rows that don't belong to the requesting user.

```sql
-- This policy is enforced by PostgreSQL itself, not our application code
create policy "managers can view their own teams"
  on public.teams for select
  using (auth.uid() = manager_id);
```

This is defence-in-depth security: the application checks auth, and the database independently checks auth. Both must fail for a data leak to occur.

---

### Why Persist the GitHub Access Token in the Database?

During OAuth, Supabase exposes the GitHub access token as `session.provider_token`. This is only available immediately after the OAuth exchange — it is not stored in the session cookie and is lost on the next request.

The correct pattern is to capture it in the OAuth callback route (the only place it's reliably available) and store it in a profiles table protected by RLS. Subsequent API calls read the token from the database.

```ts
// app/auth/callback/route.ts
// This is the only moment provider_token exists
if (data.session?.provider_token && data.user) {
  await supabase.from("profiles").upsert({
    id: data.user.id,
    github_access_token: data.session.provider_token,
  });
}
```

For a production app with stricter security requirements, this token would be encrypted at rest using Supabase Vault. For this MVP, storing it in a RLS-protected table provides sufficient protection.

---

### Why TanStack Query Instead of `useEffect` + `fetch`?

A naive data fetching implementation requires manually managing four pieces of state for every request: the data itself, a loading boolean, an error value, and a stale/fresh flag. With four data-dependent components on the dashboard, that's 16 state variables to manage and keep consistent.

TanStack Query manages all of this automatically. More importantly, it provides:

- **Query deduplication** — if two components request the same data simultaneously, only one network request is made
- **Background refetching** — data stays fresh without user interaction
- **Cache invalidation** — after a sync, we can invalidate the cache and all components refetch automatically
- **Stale-while-revalidate** — components show cached data instantly while fresh data loads in the background

The `queryKey` pattern also makes data dependencies explicit and traceable — a significant maintainability advantage as the codebase grows.

---

### Why Upsert Instead of Insert for Syncing?

GitHub data is synced repeatedly. Using a plain `INSERT` would create duplicate pull requests every time the user clicks "Sync". Using `DELETE` + `INSERT` would wipe timestamps and break queries mid-sync.

Upsert (`INSERT ... ON CONFLICT DO UPDATE`) solves both problems: existing records are updated in place, new records are inserted, and the operation is atomic. The conflict target — `(repository_id, github_pr_id)` — guarantees uniqueness at the database level, not just in application code.

```ts
await supabase.from("pull_requests").upsert(prsToUpsert, {
  onConflict: "repository_id,github_pr_id",
});
```

---

### Why Server Components for Layouts and Client Components for Data?

Next.js App Router defaults to Server Components — they run on the server, produce HTML, and send zero JavaScript to the browser. This makes initial page loads fast and is appropriate for static structure like layouts, headers, and navigation.

Data-driven components (metric cards, charts, PR list) are Client Components because they use TanStack Query hooks, which rely on React context and browser APIs. The pattern we follow is:

```
Layout (Server Component — no JS bundle cost)
└── MetricsCards (Client Component — TanStack Query)
└── PRChart (Client Component — Recharts uses SVG/browser APIs)
└── PRList (Client Component — useState for filter/pagination)
```

This is the "Server Component with Client Islands" pattern — the recommended architecture for Next.js App Router applications.

---

### Why Separate `usePullRequests` and `useMetrics` Hooks?

All dashboard metrics derive from the same underlying pull request data. Fetching PRs once and deriving metrics, chart data, and the PR list from that single cache entry means:

- One network request instead of four
- All metrics are always consistent with each other
- Filtering the PR list doesn't trigger new database queries

```ts
// One fetch, multiple consumers
const { data: prs } = usePullRequests();         // raw data
const metrics = calculateDashboardMetrics(prs);   // derived
const chartData = buildChartData(prs);            // derived
const filtered = prs.filter(...);                 // derived
```

Pure utility functions (`calculateDashboardMetrics`, `buildChartData`) handle the derivations. These are unit tested in isolation, which is much easier than testing database-connected hooks.

---

## 📁 Project Structure

```
github-dashboard/
├── app/
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # OAuth callback — captures provider_token
│   ├── login/
│   │   ├── page.tsx              # Server Component — redirects if authed
│   │   └── login-button.tsx      # Client Component — handles OAuth click
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Server Component — auth guard + sidebar
│   │   └── page.tsx              # Dashboard page — composes all sections
│   ├── api/
│   │   └── github/sync/
│   │       └── route.ts          # POST endpoint — orchestrates sync
│   ├── layout.tsx                # Root layout — QueryProvider
│   └── globals.css
├── components/
│   ├── ui/                       # Generic primitives (no business logic)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── skeleton.tsx
│   │   ├── toast.tsx
│   │   └── status-badge.tsx
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── metrics-cards/
│   │   ├── pr-chart/
│   │   └── pr-list/
│   ├── sidebar/
│   └── shared/
│       ├── query-provider.tsx    # TanStack Query setup
│       └── sync-button.tsx
├── lib/
│   ├── supabase/                 # Three environment-specific clients
│   │   ├── client.ts             # Browser
│   │   ├── server.ts             # Node.js server
│   │   └── middleware.ts         # Edge runtime
│   ├── github/
│   │   ├── client.ts             # Octokit wrapper with pagination
│   │   └── sync.ts               # Sync orchestration logic
│   └── utils/
│       ├── cn.ts                 # clsx + tailwind-merge helper
│       ├── date-helpers.ts       # formatDate, formatReviewTime, etc.
│       └── pr-helpers.ts         # calculateMetrics, buildChartData, etc.
├── hooks/
│   ├── useAuth.ts                # Current user + sign out
│   ├── useMetrics.ts             # Team ID, PR data, derived metrics
│   └── usePullRequests.ts        # PR list with filter support
├── types/
│   ├── database.ts               # Mirrors Supabase table shapes
│   ├── github.ts                 # Raw GitHub API response shapes
│   └── dashboard.ts              # UI-specific types (MetricCard, etc.)
├── config/
│   └── constants.ts              # PR_STATUS, TABLES, page sizes, etc.
├── tests/
│   ├── setup.ts                  # jest-dom matchers
│   ├── unit/
│   │   ├── date-helpers.test.ts
│   │   └── pr-helpers.test.ts
│   └── components/
│       ├── metrics-cards.test.tsx
│       └── pr-list.test.tsx
├── e2e/
│   └── dashboard.spec.ts         # Playwright — auth flow tests
├── middleware.ts                  # Session refresh + route protection
├── vitest.config.ts
└── playwright.config.ts
```

---

## 🗄 Database Schema

```
auth.users (Supabase managed)
    │
    ├── profiles          id, github_access_token, github_username, avatar_url
    │
    └── teams             id, name, manager_id → auth.users
            │
            ├── team_members      id, team_id, github_username, display_name
            │
            └── repositories      id, team_id, github_repo_id, owner, name, full_name
                    │
                    └── pull_requests   id, repository_id, team_id, github_pr_id,
                                        number, title, author_username, status,
                                        github_created_at, github_merged_at,
                                        review_time_hours
```

**Key design decisions:**

- `pull_requests.team_id` is denormalized (also stored on the repository) to avoid a join on every dashboard query
- `review_time_hours` is calculated at sync time — not at query time — so metric aggregations are fast
- `status` uses a PostgreSQL `CHECK` constraint, not just application validation
- Every table has `created_at` and `updated_at`; an `updated_at` trigger keeps the latter accurate automatically
- Unique constraints on `(team_id, github_repo_id)` and `(repository_id, github_pr_id)` make upserts safe and idempotent

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm v9+
- A [Supabase](https://supabase.com) account (free tier)
- A [GitHub](https://github.com) account with repositories

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/github-dashboard.git
cd github-dashboard
```

**2. Install dependencies**

```bash
npm install
```

**3. Copy the environment file**

```bash
# Mac/Linux
cp .env.example .env.local

# Windows
copy .env.example .env.local
```

### Environment Variables

Fill in `.env.local` with your values:

```env
# Supabase — from Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GitHub OAuth App — from Developer Settings → OAuth Apps
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

| Variable                        | Where to Find It                                               |
| ------------------------------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Project Settings → API → Project URL                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase → Project Settings → API → service_role (keep secret) |
| `GITHUB_CLIENT_ID`              | GitHub → Settings → Developer Settings → OAuth Apps            |
| `GITHUB_CLIENT_SECRET`          | GitHub → Settings → Developer Settings → OAuth Apps            |

### Database Setup

**4. Create a Supabase project** at [supabase.com](https://supabase.com)

**5. Run the schema** in Supabase → SQL Editor → New Query:

The full schema SQL is in [`/docs/schema.sql`](docs/schema.sql). It creates all five tables, enables RLS, creates all policies, indexes, and the `updated_at` trigger.

**6. Configure GitHub OAuth**

Create a GitHub OAuth App at **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App**:

| Field                      | Value                                                                  |
| -------------------------- | ---------------------------------------------------------------------- |
| Homepage URL               | `http://localhost:3000`                                                |
| Authorization callback URL | Your Supabase callback URL: `https://xxx.supabase.co/auth/v1/callback` |

Then in **Supabase → Authentication → Providers → GitHub**, enable GitHub and paste your Client ID and Client Secret.

### Running the App

**7. Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**8. Log in and sync**

- Click "Continue with GitHub" and authorize
- Click "Sync GitHub Data" in the dashboard header
- Wait 15–30 seconds for the first sync to complete
- Metrics, chart, and PR list populate automatically

---

## 🧪 Testing

This project implements the full testing pyramid: unit tests at the base, component tests in the middle, and E2E tests at the top.

```
        /\
       /E2E\        6 tests  — Playwright (real browser)
      /------\
     / Comp.  \    10 tests  — React Testing Library
    /------------\
   /  Unit Tests  \ 24 tests — Vitest (pure functions)
  /________________\
              40 tests total
```

### Unit Tests — Pure Utility Functions

```bash
npm test
```

Tests cover date formatting, review time calculation, status color mapping, metric aggregation, and chart data building. These functions have no side effects and are completely deterministic — ideal for unit testing.

### Component Tests — UI Behaviour

Component tests use React Testing Library with mocked hooks. The principle is to test what the user sees, not implementation details:

```ts
// We don't test "did useState get called"
// We test "does the skeleton appear while loading"
vi.mocked(useMetrics).mockReturnValue({ isLoading: true, ... });
const skeletons = container.querySelectorAll('.animate-pulse');
expect(skeletons.length).toBeGreaterThan(0);
```

### E2E Tests — Full User Flows

```bash
npx playwright test
```

E2E tests run against a real browser (Chromium) and a real running Next.js server. They cover:

- Login page rendering
- GitHub button visibility and state
- Middleware redirect for unauthenticated users
- Page title metadata
- OAuth button navigation trigger

E2E tests intentionally do not test the full OAuth login (which would require a real GitHub account and token). They test everything up to the point where GitHub takes over.

To watch tests run in a real browser:

```bash
npx playwright test --headed
```

To view the HTML report after a test run:

```bash
npx playwright show-report
```

---

## 🌐 Deployment

This project is optimised for **Vercel**.

**1. Push to GitHub**

```bash
git push origin main
```

**2. Import to Vercel**

Go to [vercel.com](https://vercel.com) → New Project → Import your repository.

**3. Add environment variables**

In Vercel → Project Settings → Environment Variables, add all variables from `.env.local`, updating `NEXT_PUBLIC_APP_URL` to your production Vercel URL.

**4. Update Supabase**

In Supabase → Authentication → URL Configuration:

- Site URL: `https://your-app.vercel.app`
- Redirect URLs: add `https://your-app.vercel.app/auth/callback`

**5. Deploy**

Vercel deploys automatically. Every subsequent `git push` to `main` triggers a new deployment.

---

## 🔮 Known Limitations and Future Work

### Current MVP Limitations

| Limitation                    | Reason                             | Planned Fix                     |
| ----------------------------- | ---------------------------------- | ------------------------------- |
| Manual sync only              | Webhooks excluded from MVP scope   | GitHub Webhooks in v2           |
| First 10 repos synced         | Rate limit safety for MVP          | Repo selector UI in v2          |
| No team management UI         | Database schema ready, UI deferred | Team management in v2           |
| PR count capped at 200        | Performance safety for MVP         | Cursor-based pagination in v2   |
| GitHub token stored plaintext | MVP acceptable; RLS protects it    | Supabase Vault encryption in v2 |

### Planned Features (Post-MVP)

- **Team Management** — Create teams, add GitHub usernames as members, filter dashboard by team
- **Repository Selector** — Choose which repos to monitor instead of syncing all
- **GitHub Webhooks** — Real-time data updates instead of manual sync
- **Individual Contributor View** — Per-developer PR stats and activity
- **CSV Export** — Download PR list for reporting
- **Dark Mode** — Tailwind dark variant + next-themes
- **PR Health Score** — Composite score based on size, age, and review activity
- **Email Reports** — Weekly summary emails via Resend
- **Full Test Coverage** — Target 80%+ coverage across all components and hooks

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with Next.js 15, Supabase, and the GitHub API</sub>
</div>
