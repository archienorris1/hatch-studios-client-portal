---
name: Hatch Studios Client Portal — Project State
description: Full current state — files, Supabase setup, what's built, what's next
type: project
originSessionId: 14103b72-69fb-425c-a82d-9d9b5eb892c3
---
## Live URLs

| | URL |
|---|---|
| **Client portal** | https://hatch-studios-portal.vercel.app/ |
| **Admin portal** | https://hatch-studios-portal.vercel.app/admin |
| **GitHub repo** | https://github.com/archienorris1/hatch-studios-client-portal |
| **Vercel project** | https://vercel.com/archienorris1s-projects/hatch-studios-portal |

Deployments are automatic — any `git push` to `main` triggers a new Vercel deploy.

## Files (iCloud Drive → Claude Code → Hatch Studios - Client Portal)

| File | Purpose |
|---|---|
| `hatch-client-portal.html` | What clients see — full portal app |
| `hatch-admin.html` | What Archie & Jack see — manage clients, send invites, view portals |

Both are self-contained single HTML files. No framework, no build step. Vanilla HTML/CSS/JS.

---

## Supabase Project

- **Project name:** hatch-studios-client-portal
- **Project ID:** `htfqhczffwofzvxuwzww`
- **Region:** eu-west-2 (London)
- **URL:** `https://htfqhczffwofzvxuwzww.supabase.co`
- **Anon key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0ZnFoY3pmZndvZnp2eHV3end3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NDI5OTgsImV4cCI6MjA5MjQxODk5OH0.FCCnk5YrbsWxnwmZ1c4cplRSg7uf7Qj9-5RhnGTzy_k`
- **Organisation ID:** `wefwqcxydbrdtaqafnmf`

### Database Tables

**`admins`** — Hatch Studios team members who can access the admin portal
- `id`, `email` (unique), `name`, `created_at`
- RLS: users can only read their own row
- Seeded: Archie Norris (info@archienorris.co.uk), Jack Weston (jackbusterweston@gmail.com)

**`clients`** — Portal clients (one row per client)
- `id`, `email` (unique), `name`, `plan`, `avatar_initials`, `created_at`
- RLS: clients read their own row; admins can read/insert/update/delete all rows
- Plan values: `'Core Plan'`, `'Growth Plan'`, `'Premium Plan'`

### Edge Functions

**`invite-client`** — Called from admin portal to add/remove clients
- `action: 'invite'` → upserts client record + sends Supabase invite email
- `action: 'revoke'` → deletes client record + bans auth user
- Requires admin JWT in Authorization header
- Endpoint: `https://htfqhczffwofzvxuwzww.supabase.co/functions/v1/invite-client`

---

## Auth Flow

**Client portal (`hatch-client-portal.html`):**
- Magic link login, `shouldCreateUser: false` (only invited clients can log in)
- After auth → fetches their `clients` row for name/plan display
- Sign out button in sidebar footer

**Admin portal (`hatch-admin.html`):**
- Magic link login, `shouldCreateUser: true` (creates account on first login)
- After auth → checks `admins` table; if not admin → "Access Denied" screen
- Full CRUD on clients via Supabase + edge function

---

## Client Portal Sections Built

| Section | What's there |
|---|---|
| Dashboard | Stats (42 eps, 386 clips, 1.2M views), recent episodes, upcoming posts |
| Episode Pipeline | 4-col kanban: Uploaded → Editing → Your Review → Live |
| Upload Files | Drag-drop zone, episode form, upload history |
| Downloads | Finished files list with download buttons |
| Clips & Content | Per-episode tabs, 3-col clip grid, platform dots, schedule buttons |
| Scheduler | 7-day calendar, colour-coded events, schedule modal |
| Analytics | Stats, bar chart by platform, per-platform cards |

NB: All data is currently static/demo. Real per-client data needs a future backend integration.

## Admin Portal Sections Built

| Section | What's there |
|---|---|
| Dashboard | Live stats from DB (total clients, by plan), recent clients list |
| All Clients | Searchable table, plan badges, 👁 View portal / 🚫 Revoke buttons |
| Add Client | Form → calls edge function → creates DB record + sends invite email |

---

## What's NOT yet built (next steps)

- Host the portal at a real URL (Vercel recommended — free, already MCP-connected)
- Real per-client data (episodes, clips, files stored per client in Supabase)
- File upload to Supabase Storage
- Invoices / billing section
- Messaging / comments between client and Hatch team
- Jack added as admin in Supabase Auth (he needs to log in once to create his auth account)

**Why hosting matters:** Magic link emails from the invite flow redirect back to the Site URL configured in Supabase. Until hosted, the redirect won't work perfectly for clients receiving invite emails. Vercel free tier would solve this.
