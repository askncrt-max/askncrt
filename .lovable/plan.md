
# AskNCERT Premium Upgrade Plan

Ye plan 7 areas ko 3 phases mein ship karta hai — har phase independently useful hai, aap beech mein pause / re-prioritize kar sakte ho.

---

## Phase 1 — Chat Quality (Markdown, Citations, Memory notice)

**1. Rich Markdown rendering (chat + notes)**
- Upgrade ReactMarkdown pipeline: `remark-gfm`, `remark-math`, `rehype-katex`, `rehype-highlight`.
- Custom renderers for h1–h4, tables, blockquotes, inline code, code blocks with **copy button** and language label.
- KaTeX CSS import in `styles.css`.
- Clickable, safe external links (`target=_blank`, `rel=noopener`).
- Responsive tables (horizontal scroll on mobile).

**2. Source citations for web answers**
- The `web_search` tool (Firecrawl, already wired) will return `{title, url, snippet, source}`. Server-side we'll persist tool results into the streamed message parts.
- New `<Sources>` component below assistant message: favicon (via `https://www.google.com/s2/favicons?domain=…`), site name, title. Click opens original.
- Two labelled groups: **NCERT sources** (askncert / ncert.nic.in / cbse.gov.in matches) vs **Web sources**.
- System prompt updated: "Never fabricate citations. Only cite URLs returned by `web_search`."

**3. Memory-in-use notice**
- When personalization is applied to an answer, show a subtle pill above assistant message: "✨ Personalized using your memory".

---

## Phase 2 — AI Memory + Manage Memory page

**Schema** (new migration):
```
public.user_memory
  id, user_id, key (text), value (text), category (enum: profile|preference|goal|fact),
  source (enum: manual|inferred), created_at, updated_at
```
- RLS: users manage own rows. GRANTs for `authenticated` + `service_role`.
- Extend `profiles` with `board`, `subjects text[]`, `learning_style`, `goals text`.

**Server**:
- `getMemory` / `upsertMemory` / `deleteMemory` server fns (`requireSupabaseAuth`).
- Chat route loads memory + profile into system prompt (compact bullet list, capped ~1KB).
- Passive memory extraction: after each assistant turn, a small follow-up call asks Gemini "Any new lasting fact worth remembering? JSON or null." Extracted facts stored with `source=inferred` for user to approve/edit.

**UI**:
- New route `/settings/memory` — list, edit inline, delete, add manual. Group by category.
- Settings page gets extended profile fields (board / subjects / learning style / goals).

---

## Phase 3 — Dashboard, Planner, Reminders, UI polish

**4. Progress Dashboard** (`/dashboard`)
- Schema additions:
  ```
  study_sessions (id, user_id, started_at, ended_at, duration_min, subject, kind)
  achievements (id, user_id, code, earned_at)
  goals (id, user_id, kind: weekly|monthly, target_min, subject, period_start)
  ```
- Study time is auto-logged when user sends chat messages (heuristic: active window while chatting) + explicit "Start study session" button.
- Widgets: daily/weekly/monthly study time (Recharts area chart), streak, XP + level (XP = f(minutes + tasks + quiz)), subject-wise donut, badges grid, weekly/monthly goal progress bars.
- Chapters/homework/quiz/flashcard stats read from existing + new tables (see below).

**5. Study Planner** (rewrite `/planner`)
- Schema:
  ```
  planner_tasks (id, user_id, title, subject, priority: low|med|high,
                 scheduled_for date, scheduled_time time?, duration_min,
                 status: pending|done|missed, exam_id?, is_revision bool)
  exams (id, user_id, name, subject, date)
  ```
- Views: **Calendar (month)**, **Week**, **Day**. Toggle at top.
- Drag-and-drop rescheduling (`@dnd-kit/core` — already common; will `bun add`).
- Subject color chips. Priority icons. Per-task progress bar (if `duration_min` + logged study).
- One-click "Mark done". Automatic reschedule: missed tasks flow to today at bottom.
- **AI Generate Timetable** button: sends user's subjects, exams, goals, free-time preference to model → returns week of tasks → inserted into `planner_tasks`.
- **Exam countdown** widget + **Revision planner** (auto-schedules revision blocks 7d / 3d / 1d before exam).

**6. Homework Reminders** (upgrade `reminders`)
- Extend schema: `repeat` (none|daily|weekly), `push_enabled`, `notify_at`.
- Beautiful cards with subject color, due-in badge, status chip (upcoming / due today / missed / done).
- Web Push via Notification API + Service Worker (opt-in prompt). No paid infra — browser-local scheduling for daily reminder; server-side push deferred (would need VAPID keys — will call out).
- Homepage widget: "Upcoming this week" (top 3 cards).
- Calendar integration: `.ics` download per reminder + "Add to Google Calendar" link.

**7. UI Polish (throughout)**
- Design tokens tightened in `styles.css` (spacing scale, typography scale, glass surface token).
- Global skeletons (`components/ui/skeleton` already exists — apply to chat list, notes, dashboard, planner).
- Empty states with illustration + CTA in every list.
- Framer Motion for page transitions + card hover/tap micro-interactions (`bun add framer-motion`).
- Glassmorphism only on top bars / floating composer / modals (not on content — protects readability).
- Mobile-first pass: sticky bottom nav, thumb-friendly hit targets, safe-area padding.

---

## Technical notes

- **Dependencies to add**: `remark-math`, `rehype-katex`, `rehype-highlight`, `katex`, `highlight.js`, `framer-motion`, `@dnd-kit/core`, `date-fns` (already in), `recharts` (already in).
- **Migrations**: 3 total (memory, planner+exams, study_sessions/achievements/goals). All with GRANTs + RLS.
- **AI cost**: passive memory extraction runs on `gemini-3.1-flash-lite` (cheapest) to keep cost low.
- **Push notifications**: browser-side scheduling only in Phase 3. True server-side push (device offline delivery) needs VAPID keys — I'll note if you want that added.
- **Auto study-time logging**: heuristic (session = active chat window >2min, ends after 10min idle). Not perfect but zero-friction. Manual timer also available.

---

## Suggested order of shipping

1. **Phase 1** — biggest visible quality jump, no schema changes. ~1 turn.
2. **Phase 2** — enables personalization. 1 migration. ~1 turn.
3. **Phase 3** — largest; can further split into 3a Dashboard, 3b Planner, 3c Reminders + polish if you want smaller reviewable chunks.

**Reply "go" to start Phase 1**, or tell me to reorder / drop anything (e.g. skip web push, skip AI timetable, etc.).
