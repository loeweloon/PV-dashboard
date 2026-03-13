# PV Executive Dashboard — Next.js + Supabase

Production-grade migration of the HTML dashboard.  
Stack: **Next.js 14** · **TypeScript** · **Tailwind CSS** · **Supabase** · **Recharts** · **Vercel**

---

## What's in this repo

```
src/
├── app/
│   ├── layout.tsx          ← Root layout, fonts, providers
│   ├── page.tsx            ← Main dashboard page (tab router)
│   └── globals.css         ← Design tokens + base styles
├── components/
│   ├── shared/
│   │   ├── ui.tsx          ← Button, Modal, Card, Toast, KpiCard, etc.
│   │   └── Header.tsx      ← Tab nav + edit mode + sync indicator
│   ├── projects/
│   │   └── ProjectsTab.tsx ← Full projects table with CRUD
│   ├── marketing/
│   │   └── MarketingTab.tsx← Ads, events, lead campaigns, platform stats
│   └── sales/
│       └── SalesTab.tsx    ← Donut charts, drag-reorder, tables
├── hooks/
│   ├── useDashboardStore.ts← All state + Supabase operations
│   └── DashboardContext.tsx← React context wrapping the store
├── lib/
│   ├── supabase.ts         ← Supabase client + typed query helpers
│   └── utils.ts            ← Formatters, data helpers, CSV parser
└── types/
    └── index.ts            ← All TypeScript interfaces
```

---

## Setup (step by step)

### 1. Clone and install

```bash
git clone https://github.com/loeweloon/pv-dashboard.git
cd pv-dashboard
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. **SQL Editor → New query** → paste the entire contents of `supabase-schema.sql` → Run
3. Copy your **Project URL** and **anon key** from Settings → API

### 3. Configure environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and anon key
```

### 4. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

### 5. Deploy to Vercel

```bash
npm install -g vercel
vercel
# Follow prompts — add your env vars in Vercel dashboard
```

Or connect your GitHub repo to Vercel for automatic deploys on every push.

---

## Key differences from the HTML dashboard

| Feature | HTML v6 | Next.js app |
|---|---|---|
| Data persistence | localStorage | Supabase (Postgres) |
| Real-time sync | None | Supabase Realtime subscriptions |
| Multi-user | No | Yes — all users see same data |
| Charts | Hand-drawn SVG | Recharts (proper library) |
| Drag-reorder | Custom JS | react-beautiful-dnd |
| TypeScript | No | Full strict TypeScript |
| Deployable | File only | Vercel URL, shareable |
| Auth (optional) | None | Supabase Auth (add later) |

---

## Data flow

```
Projects Tab → upsert project (Supabase)
                 ↓
             Realtime subscription fires
                 ↓
             useDashboardStore re-fetches
                 ↓
             mergedSales recomputed (mergeWithProjects)
                 ↓
             SalesTab donuts + charts update automatically
```

All three tabs share the same `DashboardContext` so changing a project
status in the Projects tab immediately reflects in the Sales tab's donuts
and KPIs — no page refresh needed.

---

## Adding auth later (Supabase Auth)

1. Enable Auth in Supabase dashboard → Email provider
2. Uncomment the RLS policies in `supabase-schema.sql`
3. Add a login page at `src/app/login/page.tsx`
4. Wrap `DashboardProvider` with a session check

---

## Seeding from the HTML dashboard's data

Your existing data is embedded in the HTML file. To migrate it:

1. Open `PV_Executive_Dashboard_v6.html` in Chrome
2. Open DevTools Console
3. Run: `copy(JSON.stringify({projects, salesData, adsData, eventsData, leadsData, platformStats, salespersonData}))`
4. This copies all data to clipboard as JSON
5. Use Supabase Table Editor to paste/import, or write a one-time migration script

---

## Roadmap (next steps)

- [ ] Auth — Supabase Auth with role-based views (exec vs. data-entry)
- [ ] Monthly trend charts — Recharts LineChart with time-series data
- [ ] PDF export — react-pdf or Puppeteer serverless function
- [ ] ESG tab — PV Loop recycling tracker
- [ ] Push notifications — Supabase edge functions on milestone events
