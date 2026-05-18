# BUILD: AtomQuest Goal Setting & Tracking Portal

You are building a complete, production-quality web app for a hackathon. I am solo, working in 24-48 hours. Your job is to build the whole thing end-to-end. Work autonomously through every phase below. Do not stop to ask me questions unless something is truly blocking — make smart defaults and proceed. After each phase, run the dev server briefly to verify it compiles, fix any errors, then move on.

═══════════════════════════════════════════════════════════════
PROJECT BRIEF
═══════════════════════════════════════════════════════════════

Build "AtomQuest Goals" — an internal Goal Setting & Tracking Portal with three roles (Employee, Manager, Admin) supporting the full annual goal lifecycle: creation → approval → quarterly check-ins → reporting → audit.

THREE NON-NEGOTIABLE DIFFERENTIATORS:
1. **AI Goal Coach** — a button that uses Claude API to rewrite vague goals into SMART goals
2. **Time-Travel demo mode** — admin can jump the system clock to any quarter for live demos
3. **Live Weightage Validator** — animated bar that turns green at exactly 100%

═══════════════════════════════════════════════════════════════
STACK (use exactly this)
═══════════════════════════════════════════════════════════════

- Next.js 14 (App Router) + TypeScript + React Server Components
- Tailwind CSS + shadcn/ui (slate base, CSS variables, RSC mode)
- Supabase (Postgres + Auth + Row Level Security) via @supabase/ssr
- Anthropic SDK (@anthropic-ai/sdk) for AI Coach
- react-hook-form + zod for forms
- recharts for charts
- lucide-react for icons
- sonner for toasts
- date-fns for dates

BRAND: "AtomQuest" — clean, professional.
Colors: primary navy #0F1E3D, accent blue #2563EB, success #10B981, warning #F59E0B, danger #E11D48.
Font: Inter. Logo: simple SVG atom icon + "AtomQuest" wordmark.

═══════════════════════════════════════════════════════════════
EXECUTION PLAN — DO ALL 10 PHASES IN ORDER
═══════════════════════════════════════════════════════════════

──────────────────────────────────────────────
PHASE 1 — PROJECT SETUP
──────────────────────────────────────────────

1. `npx create-next-app@latest .` with TypeScript, Tailwind, App Router, ESLint, src/ NO, import alias `@/*`
2. `npx shadcn@latest init` — slate, CSS variables, yes RSC
3. Add shadcn components: button card input label textarea select table dialog badge alert tabs dropdown-menu progress sonner form separator tooltip sheet skeleton avatar
4. Install: `@supabase/ssr @supabase/supabase-js @anthropic-ai/sdk lucide-react recharts react-hook-form zod @hookform/resolvers date-fns`
5. Configure brand colors in `tailwind.config.ts` and `app/globals.css` (CSS vars)
6. Set Inter font in `app/layout.tsx`
7. Create `.env.local.example` with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ANTHROPIC_API_KEY=
   ```
8. STOP and tell me: "Paste your Supabase URL, anon key, service role key, and Anthropic API key now." Then write them into `.env.local`.

──────────────────────────────────────────────
PHASE 2 — FOLDER STRUCTURE + LOGO
──────────────────────────────────────────────

Create this exact tree:
```
app/
├── (auth)/login/page.tsx
├── (employee)/employee/goals/page.tsx
├── (employee)/employee/checkin/page.tsx
├── (employee)/layout.tsx
├── (manager)/manager/approvals/page.tsx
├── (manager)/manager/team/page.tsx
├── (manager)/manager/checkin/[employeeId]/page.tsx
├── (manager)/layout.tsx
├── (admin)/admin/cycles/page.tsx
├── (admin)/admin/users/page.tsx
├── (admin)/admin/audit/page.tsx
├── (admin)/admin/reports/page.tsx
├── (admin)/layout.tsx
├── api/ai-coach/route.ts
├── api/export/route.ts
├── api/time-travel/route.ts
├── demo/page.tsx
├── page.tsx              (landing)
├── layout.tsx
└── globals.css
components/
├── ui/                   (shadcn)
├── logo.tsx
├── top-bar.tsx
├── goal-form.tsx
├── weightage-bar.tsx     ⭐
├── ai-coach-button.tsx   ⭐
├── time-travel-panel.tsx ⭐
├── audit-timeline.tsx
└── notification-bell.tsx
lib/
├── supabase/client.ts
├── supabase/server.ts
├── uom-engine.ts         ⭐ I will paste
├── cycle-clock.ts        ⭐ I will paste
├── audit.ts
└── auth-guard.ts
supabase/
├── schema.sql            ⭐ I will paste
└── seed.sql              ⭐ I will paste
middleware.ts
```

Create `components/logo.tsx` with an SVG atom (3 ellipses + center dot) and "AtomQuest" wordmark.

──────────────────────────────────────────────
PHASE 3 — PASTE MY 5 FILES
──────────────────────────────────────────────

STOP and tell me: "Paste these 5 files now: schema.sql, seed.sql, uom-engine.ts, cycle-clock.ts, ai-coach-route.ts."

When I paste them, place them at:
- `supabase/schema.sql`
- `supabase/seed.sql`
- `lib/uom-engine.ts`
- `lib/cycle-clock.ts`
- `app/api/ai-coach/route.ts`

DO NOT modify these files. They are correct.

Then tell me: "Now go to your Supabase project → SQL Editor → paste and run schema.sql. Then create these 7 auth users with password Atom@123: admin@atomquest.com, priya.manager@atomquest.com, ravi.manager@atomquest.com, arjun.emp@atomquest.com, sneha.emp@atomquest.com, karan.emp@atomquest.com, meera.emp@atomquest.com. Then copy each UUID from the Auth dashboard, paste them into seed.sql in the INSERT block (uncomment it), and run seed.sql. Tell me when done."

Wait for my confirmation before proceeding.

──────────────────────────────────────────────
PHASE 4 — SUPABASE CLIENTS + AUTH + MIDDLEWARE
──────────────────────────────────────────────

Build:

1. `lib/supabase/client.ts` — `createBrowserClient` for browser components
2. `lib/supabase/server.ts` — `createServerClient` using `cookies()` from next/headers
3. `middleware.ts` — refresh session on every request; redirect unauthed users from `/employee/*`, `/manager/*`, `/admin/*` to `/login`
4. `lib/auth-guard.ts`:
   - `getCurrentUser()` — returns user row from `users` table joined with auth user
   - `requireRole(['admin'|'manager'|'employee'])` — call in server components, redirect on mismatch
5. `app/(auth)/login/page.tsx` — email + password form (shadcn), uses sonner for errors. On success, look up user role and redirect:
   - admin → `/admin/cycles`
   - manager → `/manager/approvals`
   - employee → `/employee/goals`
6. `components/top-bar.tsx` — sticky header with logo, user name, role badge (colored), and sign-out dropdown. Include `NotificationBell` (stub for now).
7. Each role layout calls `requireRole` and renders `<TopBar />` + children.

──────────────────────────────────────────────
PHASE 5 — EMPLOYEE GOAL SHEET (CORE) ⭐
──────────────────────────────────────────────

Build `app/(employee)/employee/goals/page.tsx`:

- Server component: fetch cycle clock (`getCycleClock`), fetch user's goals + thrust areas
- If `currentPhase !== 'phase1_setup'` show a yellow banner explaining goals can't be created right now
- Render a client component `GoalSheetClient` with hydrated data

Build `components/goal-sheet-client.tsx`:
- ⭐ `WeightageBar` at top — horizontal progress bar:
  - Computes live total weightage across all goals
  - Red fill if 0-99 or 101+, green at exactly 100
  - Big number "73 / 100%" with delta hint
  - Smoothly animates with Tailwind transitions
- Goals table with columns: Title, Thrust Area, UoM, Target, Weightage, Status, Actions
- "Add Goal" button → opens `<GoalFormDialog />`
- "Submit Goal Sheet" button — disabled unless `validateGoalSheet().ok === true`. Shows validation issues as alerts.
- On submit, update all draft goals to status='submitted'.

Build `components/goal-form.tsx` (used in dialog):
- react-hook-form + zod schema
- Fields: Title, Description (textarea), Thrust Area (select), UoM Type (select), UoM Direction (radio, only shown for numeric/percentage), Target (number) OR Target Date (date for timeline; hidden for zero_based), Weightage (number 10-100)
- ⭐ **AI Coach button** next to Description:
  - On click, calls `POST /api/ai-coach` with `{ rawGoal: title + ' — ' + description, thrustArea }`
  - Shows a dialog with: improved_title, improved_description, suggested UoM, suggested target, rationale, smart_score badge
  - "Apply suggestion" button fills all matching form fields

Use sonner toasts for every success/error.

──────────────────────────────────────────────
PHASE 6 — MANAGER APPROVAL + TEAM
──────────────────────────────────────────────

Build `app/(manager)/manager/approvals/page.tsx`:
- Server: fetch goals where status='submitted' and employee.manager_id = current user
- Group by employee; one card per employee
- Each card: employee name + dept, mini weightage bar, inline-editable table of goals (target + weightage editable, others read-only)
- "Approve All" button: sets all goals status='approved', locked=true, approved_at=now(), approved_by=manager_id
- "Return for Rework" dialog → sets all status='returned' with a comment stored in checkins or a returns table (create a simple `returns` table or reuse checkins with quarter='RETURN')
- Audit trigger fires automatically on approval

Build `app/(manager)/manager/team/page.tsx`:
- List direct reports as cards
- Each card: name, # goals, weighted progress score (use `computeGoalScore` + `computeWeightedScore`) for active quarter, status counts (Not Started / On Track / Completed)
- Click → `/manager/checkin/[employeeId]`

Build `app/(manager)/manager/checkin/[employeeId]/page.tsx`:
- Fetch employee's approved goals + achievements for active quarter
- Read-only: Planned (target) vs Achievement (actual) vs Score columns
- Per goal: "Check-in Comment" textarea, saves to `checkins` table on click
- "Mark Check-in Complete" button

──────────────────────────────────────────────
PHASE 7 — EMPLOYEE CHECK-IN
──────────────────────────────────────────────

Build `app/(employee)/employee/checkin/page.tsx`:
- If `canUpdateAchievements === false`, show big banner with current phase
- Otherwise, render cards for each approved goal
- Per goal form:
  - Actual Value (for numeric/percentage) OR Actual Date (for timeline) OR Incident Count (for zero_based)
  - Status select: not_started / on_track / completed
  - Notes textarea
  - Live score preview using `computeGoalScore` — updates as user types
- Upsert to achievements (unique on goal_id + quarter)
- One "Save Q{n} Check-in" button at the bottom

──────────────────────────────────────────────
PHASE 8 — ADMIN: CYCLES + TIME-TRAVEL + AUDIT + USERS ⭐
──────────────────────────────────────────────

Build `app/(admin)/admin/cycles/page.tsx`:
- Show active cycle with editable date fields (Phase 1, Q1, Q2, Q3, Q4, Close)
- ⭐ Prominent `<TimeTravelPanel />` card at top:
  - Big title "🕰️ Demo Time-Travel"
  - Shows current effective date + phase badge (color-coded)
  - 5 buttons: "Phase 1 Setup" "Q1" "Q2" "Q3" "Q4 Annual"
  - Each posts to `/api/time-travel` with the relevant date (e.g., q1_open + 7 days)
  - "Return to Real Time" button → sets simulated_date=null
  - Toast confirms the jump
  - Auto-refresh data after travel (router.refresh())

Build `app/api/time-travel/route.ts` (POST):
- Verify admin via auth-guard
- Body: `{ targetPhase: 'phase1_setup'|'q1'|'q2'|'q3'|'q4'|'real' }`
- Compute target date from active cycle's dates
- Update `cycles.simulated_date` (or null for 'real')
- Return updated clock

Build `app/(admin)/admin/users/page.tsx`:
- Table: name, email, role, department, manager (joined). Read-only for hackathon.

Build `app/(admin)/admin/audit/page.tsx`:
- Fetch `audit_log` ordered by timestamp DESC, limit 200
- ⭐ Render as a **vertical timeline** (not a table):
  - Each entry: timestamp pill, user email, action verb, entity type chip
  - Expandable "Show diff" reveals pretty-printed JSON of old → new
  - Filter chips at top: All / Goals / Achievements / Cycles
  - Use lucide icons for each action type

──────────────────────────────────────────────
PHASE 9 — REPORTS + CSV EXPORT
──────────────────────────────────────────────

Build `app/(admin)/admin/reports/page.tsx`:

Section 1 — Completion Dashboard:
- Table: each employee, # goals, # with achievement logged for active quarter, # check-ins by manager, % complete
- Color-coded badges (green 100%, amber 50-99%, red <50%)
- Recharts bar chart: completion rate by department

Section 2 — Achievement Report:
- "Export Achievement Report (CSV)" button → `/api/export?type=achievement`

Build `app/api/export/route.ts` (GET):
- Verify admin
- Fetch all goals + achievements for active cycle joined with users + thrust areas
- Build CSV string manually (no external lib) with columns:
  Employee Name, Department, Thrust Area, Goal Title, UoM, Target, Q1 Actual, Q2 Actual, Q3 Actual, Q4 Actual, Weighted Score, Status
- Compute weighted score per employee using `computeGoalScore` + `computeWeightedScore`
- Return with `Content-Type: text/csv` and `Content-Disposition: attachment; filename="atomquest-achievement-{cycleName}.csv"`

──────────────────────────────────────────────
PHASE 10 — POLISH + LANDING + DEMO MODE + README
──────────────────────────────────────────────

1. **Landing page** `app/page.tsx`:
   - Hero with logo, tagline "Goal Setting & Tracking Portal"
   - 3 role cards explaining capabilities
   - "Sign In" CTA → /login
   - "Try Demo" CTA → /demo
   - Footer mentioning AtomQuest Hackathon 1.0

2. **Demo launcher** `app/demo/page.tsx`:
   - 7 buttons, one per seed user, labeled with role + dept
   - Each button signs them in via password and redirects to their home

3. **Empty states** for every list view (no goals / no approvals / no audit entries / no notifications) with friendly icons and CTAs

4. **Loading skeletons** for all server-fetched data (using shadcn `Skeleton`)

5. **Error boundaries** (`error.tsx`) in each route segment

6. **Confirm dialogs** for: Approve All, Return for Rework, Time-Travel jumps

7. **NotificationBell** in TopBar:
   - Fetches unread notifications count
   - Click opens sheet with list
   - Mark as read on click

8. **Architecture diagram** `public/architecture.svg`:
   - Hand-craft an SVG showing: Browser → Vercel/Next.js → Supabase (Auth + Postgres + RLS + Triggers) + Anthropic API
   - Label every arrow with what it does
   - Clean, professional, single-color (navy + accent)

9. **README.md** with:
   - Project name + tagline
   - Live demo URL (placeholder for now)
   - Tech stack table
   - **Cost breakdown table** (Vercel $0 + Supabase $0 + Anthropic ~$15 = $15/mo for 500 users)
   - 7 demo credentials
   - Local setup steps
   - Implemented features checklist (Phase 1 ✅, Phase 2 ✅, AI Coach ✅, Time-Travel ✅, Audit ✅, CSV ✅)
   - Architecture diagram embed

10. **Final QA pass** — open each role and verify:
    - Employee creates 3 goals, weightage bar lives, AI Coach works, submits
    - Manager sees approval queue, inline-edits, approves
    - Admin time-travels to Q1, employee logs actuals, scores compute, manager comments
    - Admin views audit log timeline, downloads CSV
    - Time-travel back to real time works

Fix any console errors. Ensure no broken links. Run `npm run build` to catch type errors.

═══════════════════════════════════════════════════════════════
GROUND RULES
═══════════════════════════════════════════════════════════════

- TypeScript strict mode throughout
- All formulas use my `uom-engine.ts` — never reimplement them
- All date logic uses my `cycle-clock.ts` — never call `new Date()` directly for "today"
- Every page that fetches data must have a loading skeleton
- Every form must have validation and toast feedback
- Use Server Components by default, Client Components only when needed (forms, interactivity)
- Tailwind classes only — no custom CSS files
- Commit after each phase with a clean message

═══════════════════════════════════════════════════════════════
START NOW WITH PHASE 1
═══════════════════════════════════════════════════════════════

Begin Phase 1 now. After completing each phase, briefly summarize what you built, then move to the next phase. The only times you stop for me are:
- End of Phase 1 (asking for env keys)
- End of Phase 3 (asking me to paste the 5 files and run Supabase setup)

Otherwise, work straight through to Phase 10. Go.
