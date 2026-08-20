# Contact Management System — Missing Features Implementation Plan

## Context
Current state: Single-user contact manager with localStorage + optional Vercel Postgres/KV sync. No authentication, no per-user data isolation, no advanced CRM features.

Goal: Add session-based auth with per-user contact isolation and implement all missing CRM features from industry research.

---

## Phase 1: Auth Foundation & Per-User Data Isolation

### Database Schema Changes (Postgres)
- Create `users` table: `id (uuid)`, `email (unique)`, `password_hash`, `name`, `created_at`, `updated_at`
- Add `user_id (uuid)` column to existing `vercel_contacts` table
- Create RLS policies:
  - `FOR SELECT`: Users can only SELECT rows where `user_id = auth.uid()`
  - `FOR INSERT`: Users can only INSERT with `user_id = auth.uid()`
  - `FOR UPDATE/DELETE`: Users can only modify their own rows
- Note: RLS requires `SET LOCAL app.current_user_id = '<userId>'` before queries. With Vercel Postgres connection pooling, implement a query wrapper that sets the role on every request.

### Session Store (Vercel KV)
- Session key pattern: `session:<sessionId>`
- Session value: `{ userId, email, name, createdAt, userAgent }`
- TTL: 7 days (configurable)
- Cookie: `session_id` — HTTP-only, Secure (prod), SameSite=Lax, MaxAge=7d

### Backend Routes (Express)
New endpoints:
- `POST /api/auth/register` — validate email/password, hash password (bcrypt, rounds=12), create user, create session
- `POST /api/auth/login` — find user by email, compare password hash, create session, set cookie
- `POST /api/auth/logout` — delete session from KV, clear cookie
- `GET /api/auth/me` — return current user from session
- Middleware `requireAuth` — validates session cookie, looks up session in KV, attaches `req.user`, rejects if missing/invalid

Modified endpoints:
- `GET /api/contacts` — replace bare `SELECT` with `SELECT ... WHERE user_id = req.user.id`
- `POST /api/contacts` — upsert with `user_id = req.user.id`
- Add `DELETE /api/contacts/:id` — delete single contact by id + user_id

### Frontend Auth UI
- Login/Register modals or pages
- Auth context/provider to track current user
- Navbar: show user name/email + logout button when authenticated
- Protected UI: hide add/edit/delete controls when not logged in (show login prompt)
- Persist auth state: check `/api/auth/me` on app load

### Migration Path for Existing Data
- On first login after migration: prompt user to import existing localStorage contacts into their new account
- Option: auto-merge or manual review via import modal

---

## Phase 2: Core Enhanced Features

### 1. Tasks / To-Dos
- New table or JSONB column: `tasks` on contacts or standalone `tasks` table
- Task fields: `id`, `user_id`, `contact_id (nullable)`, `title`, `description`, `due_date`, `status (pending/completed)`, `priority (low/medium/high)`, `created_at`, `completed_at`
- UI: Task list in contact detail modal, standalone Tasks page/section
- Filter: by status, priority, due date, contact

### 2. Deals / Opportunities Pipeline
- New table: `deals`
- Fields: `id`, `user_id`, `contact_id`, `title`, `value`, `stage (lead/qualified/proposal/negotiation/won/lost)`, `probability`, `expected_close_date`, `notes`, `created_at`, `updated_at`
- UI: Kanban board or pipeline view, drag-and-drop between stages
- Integrate with contact detail (show associated deals)
- Dashboard widget: total pipeline value, won deals count

### 3. Companies / Accounts
- New table: `companies`
- Fields: `id`, `user_id`, `name`, `industry`, `size`, `website`, `address`, `notes`, `created_at`
- Add `company_id` to contacts (many contacts per company)
- UI: Company directory, company detail page, contact list per company
- Contact form: company search/select or create new

### 4. Lead Scoring
- Compute score based on: interaction recency, interaction frequency, deal stage, tags (e.g., "VIP", "Investor"), custom field weights
- Store as computed field `lead_score` (0-100) on contacts, recalculated on interaction/deal changes
- UI: Score badge on contact cards, sort/filter by score
- Backend: `/api/contacts/score` endpoint or client-side computation

### 5. Automated Reminders & Follow-ups
- New table: `reminders`
- Fields: `id`, `user_id`, `contact_id`, `type (follow_up/birthday/anniversary/custom)`, `message`, `remind_at`, `recurrence (none/daily/weekly/monthly/yearly)`, `status (active/completed/snoozed)`, `created_at`
- Backend: Cron job or on-login check to surface due reminders
- UI: Reminders center, badge on navbar, snooze/complete actions
- Push notifications via browser Notification API (optional)

---

## Phase 3: Advanced Features

### 6. Advanced Reporting & Analytics
- Backend aggregation queries: contact growth over time, interaction frequency, category breakdown, deal conversion rates, average deal value, top contacts by score
- Frontend: Dashboard page with charts (use Chart.js or Recharts)
- Metrics: total contacts, new this month, interactions this week, pipeline value, win rate

### 7. Email Integration
- Outbound: Compose email via `mailto:` (already exists) or SMTP integration for sending directly
- Inbound: Email parsing to auto-log interactions (requires email forwarding service or IMAP polling)
- Email templates: New table `email_templates` — user-defined templates with merge fields (`{{firstName}}`, `{{company}}`)
- UI: Template manager, use template when composing emails

### 8. Calendar & Scheduling
- Simple event model: `events` table with `contact_id`, `title`, `start_time`, `end_time`, `location`, `notes`
- Calendar view: monthly/weekly grid in frontend
- iCal export for events
- Meeting scheduler link (shareable booking page) — optional V2

### 9. Duplicate Detection & Merging
- Existing `findDuplicateContact` in validation.ts — expand to run as background job
- Duplicate detection job: scan contacts by email similarity, name+phone, name+company
- UI: Duplicates page with suggested pairs, merge action that combines fields and interactions
- Backend: `/api/contacts/duplicates` endpoint

### 10. Bulk Actions
- Select multiple contacts via checkboxes in grid/table view
- Actions: add/remove tags, change category, delete, export selected, assign to company
- Backend: bulk update endpoints

### 11. CSV Import
- Already have CSV export in `contactUtils.ts`
- Add CSV import: parse CSV, map columns to contact fields, validate, preview, import with merge strategy
- Backend: `/api/contacts/import-csv` endpoint

### 12. Visual Activity Timeline
- Already have interaction list in ContactDetailModal
- Enhance to visual timeline with date-axis, color-coded interaction types, expandable details
- Filter timeline by type, date range

### 13. Social Enrichment
- LinkedIn profile fetch via URL (scrape public profile or use enrichment API like Clearbit/Snovio)
- Auto-fill company, job title, profile image from LinkedIn URL
- Store enriched data in contact fields, flag as "enriched"

### 14. Map Integration
- Use address field to plot contacts on map
- Frontend: Leaflet or Mapbox integration in a "Map View"
- Cluster contacts by proximity, click to open contact detail

### 15. API & Webhooks
- REST API with auth for programmatic access
- Webhooks: user-defined URLs to POST on events (contact created, deal won, interaction logged)
- Webhook table: `webhooks` with `user_id`, `url`, `events`, `secret`, `active`
- Background worker to deliver webhooks with retry logic

### 16. Mobile App (PWA)
- Add PWA manifest and service worker
- Offline-first: service worker caches app shell, localStorage syncs when online
- Install prompt, push notifications for reminders

---

## Phase 4: Infrastructure & DevOps

### Environment Variables
New vars:
- `SESSION_SECRET` — secret for signing session cookies
- `BCRYPT_ROUNDS` — default 12
- `SESSION_TTL_DAYS` — default 7

### Server Changes
- Add `cookie-parser` middleware
- Add `csurf` for CSRF protection on state-changing routes
- Add `bcrypt` for password hashing
- Session middleware that reads/writes KV
- Query wrapper for RLS `SET` statements

### Frontend Build
- Add auth pages/routes
- Add dashboard, tasks, deals, companies, reports pages
- Add map view, webhook settings page
- PWA manifest + service worker

### Testing
- Auth flow: register, login, logout, session expiry
- Per-user isolation: User A cannot see User B's contacts
- RLS: verify DB-level enforcement
- All CRUD operations scoped to authenticated user
- Import/export with auth context

---

## Open Questions for Implementation Agent

1. **RLS implementation detail**: With Vercel Postgres connection pooling, the `sql` tagged template creates pooled connections. RLS `SET` commands must run on the same connection as the query. Does the `@vercel/postgres` SDK support transaction blocks that maintain connection affinity, or should we implement backend-level `user_id` filtering as the primary guard and treat RLS as optional defense-in-depth?

2. **Email enrichment API**: Should we use a third-party enrichment service (e.g., Clearbit, Snovio) for social enrichment, or build a simple LinkedIn URL scraper only?

3. **PWA scope**: Should the PWA be a full offline-first experience (background sync for contacts, tasks, reminders) or just an installable shell with online-only functionality?

---

## Execution Order

1. Auth schema + users table + session store (KV)
2. Auth routes + middleware + frontend auth UI
3. Per-user contact migration + RLS/backend filtering
4. Tasks + Deals + Companies (core CRMs)
5. Lead scoring + Reminders (automation)
6. Duplicates + Bulk actions + CSV import (data quality)
7. Reports + Analytics (dashboard)
8. Email templates + Social enrichment + Map view (advanced)
9. Webhooks + API (integrations)
10. PWA + Notifications (mobile/offline)
