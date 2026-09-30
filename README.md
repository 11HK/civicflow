# CivicPath

### *Navigate Government. Without Getting Lost.*

A civic-services navigation platform for **Mumbai, Ahmedabad and Bengaluru** — turning
complicated government procedures into clear, step-by-step visual paths with verified
official sources.

CivicPath is a **guidance & navigation layer**. It never submits, approves, or verifies
government applications — the official portal always completes the actual transaction.

---

## 1. What was implemented

**Backend (existing Express + Supabase — reused, not replaced):**
- JWT + bcrypt auth, services/categories/cities APIs, saved services, per-step progress,
  application journeys, secure document upload/download (Supabase Storage signed URLs),
  Gemini AI chat (grounded in service data), and an admin API (verify/publish/edit).
- Server now runs on **port 5055** (macOS Control Center occupies 5000) and serves the
  built React app + `/api`.

**New React + Vite + TypeScript + Tailwind frontend (`client/`):**
- **Home** — hero, natural-language search, city selector, category grid, popular services.
- **Services** — search + category/verified filters, natural-language intent expansion with
  “Potentially relevant” labelling (never claims a service is mandatory).
- **Service detail** — quick facts (fee, time, mode, department), eligibility, document
  table, path preview, portal guidance, official sources, FAQs, verification badge,
  report-issue, and disclaimers.
- **CivicPath roadmap** — the flagship: an interactive **React Flow dependency graph** with
  a step drawer offering four completion-validation types (self-confirm, document attach,
  form checklist, application-reference), progress persistence and a live progress bar.
- **My Paths** — in-progress paths (resume), saved services, and tracked applications.
- **My Documents** — private vault with drag-&-drop upload, preview/download (signed URLs),
  rename, delete, search.
- **AI Assistant** — floating contextual widget + full page; grounded, source-citing.
- **Admin** — stats, service management (edit/publish), source verification queue, feedback.
- **Profile**, dark/light themes, mobile bottom-nav + desktop sidebar, accessible modals,
  toasts, skeletons, error/empty states.

**Data quality rule enforced everywhere:** no fabricated URLs, fees, times, eligibility or
documents. Unverified info shows “not specified / confirm on the official portal”.

## 2. Supabase tables

Defined in [`migrations/001_schema.sql`](migrations/001_schema.sql):
`states, cities, categories, authorities, document_types, services, service_documents,
service_steps, service_portal_guides, service_fees, service_processing_times,
service_sources, service_faqs, users, saved_services, progress, application_journeys,
user_documents, ai_conversations, ai_messages, service_feedback`. RLS is enabled on all
user-owned tables (the backend uses the service-role key, which bypasses RLS; policies
protect any direct client access).

Plus a **private Storage bucket** named `user-documents` (see step 5 below).

## 3. Environment variables

Create `civicflow/.env` (a placeholder file exists; it is gitignored):

```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
JWT_SECRET=<a long random string>
GEMINI_API_KEY=<optional — from aistudio.google.com; AI assistant is disabled without it>
PORT=5055
NODE_ENV=development
```

Only server-side secrets are used; no keys are exposed to the frontend.

## 4. Run locally

```bash
cd civicflow
npm install            # backend deps
npm run client:install # frontend deps
npm run client:build   # build React into ./public (served by Express)
npm run seed           # one-time: load the verified service catalogue
npm start              # http://localhost:5055
```

**Frontend dev with hot reload** (optional, two terminals):

```bash
npm run dev            # Express API on :5055
npm run client:dev     # Vite on :5173, proxies /api -> :5055
```

## 5. Deploy

- Provision the schema: run `migrations/001_schema.sql` in the Supabase SQL editor.
- In Supabase → Storage, create a **private** bucket `user-documents` (10 MB limit; allow
  `image/jpeg, image/png, image/webp, image/gif, application/pdf`).
- Host on any Node platform (Render, Railway, Fly, a VM). Build step: `npm run build`
  (installs + builds the client into `public/`). Start: `npm start`. Set all env vars, and
  `NODE_ENV=production` with `ALLOWED_ORIGIN` if the API is on a separate origin.
- To make yourself an admin: set `is_admin = true` on your row in the `users` table.

## 6. Add a new government service

Either via the **Admin dashboard** (`/admin`) or by extending
[`data/seed.js`](data/seed.js), which uses reusable templates. Each service carries a
`city_id` + `state_id`, so one logical service (e.g. Domicile Certificate) has separate,
accurate variants per city. Always attach `service_sources` and a `last_verified_at`
date. Set `published = true` only after verification.

## 7. Verify / update a source

In `/admin` → **Source verification**, mark a service **Verified** (stamps
`last_verified_at`) or set it **Outdated** via the edit dialog. Citizens see the status
and last-verified date on every service. Because government sites change, re-verify
periodically; outdated services show a warning to users.

## 8. How the Gemini integration works

`POST /api/ai/chat` (server-side, key never exposed) builds a context block from the
current service (name, city, authority, fee, processing time, documents, official URL) and
a strict system prompt that forbids inventing government facts and requires directing users
to the official portal. It keeps short conversation history in `ai_conversations` /
`ai_messages`. Without `GEMINI_API_KEY`, the assistant returns a graceful “not configured”
message and the rest of the app is unaffected. Model: `gemini-1.5-flash`.

## 9. Limitations

- CivicPath does not integrate with government submission/verification APIs; application
  numbers are self-reported records only.
- The step dependency graph is currently linear (by step order); the schema supports
  richer prerequisites (`service_steps.requires_step_id`, a `prerequisites` table) that a
  future version can render as branches.
- Full-text search is an in-memory filter; move to Postgres FTS as the catalogue grows.
- The seed covers a representative catalogue across categories/cities, not all 1,000+
  services — the architecture is built to scale to that.

## 10. Recommended next steps

1. Run the seed against your Supabase project and verify the four demo flows (domicile /
   restaurant / driving licence / birth certificate).
2. Expand the catalogue with more verified services (templates + admin).
3. Add branch-aware prerequisites to the roadmap graph.
4. Add Postgres full-text search and pagination.
5. Optional: Supabase Auth + Google sign-in, and a source-ingestion pipeline (draft →
   admin review → publish) as outlined in the build brief.

---

🤖 Frontend generated with [Claude Code](https://claude.com/claude-code)
