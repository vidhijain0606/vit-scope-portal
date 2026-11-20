# VIT SCOPE Research Portal — Project Memory

This file summarizes the full working history in this session/worktree so future work (by
Claude or anyone else) can pick up without re-deriving context.

## Where things live

- **Working folder (uncommitted changes live here only):**
  `C:\Users\Vidhi Jain\Projects\vit-scope-portal\.claude\worktrees\feature-work`
  Branch: `feature/meeting-styles-ui-ai-wt`
- **GitHub repo:** `https://github.com/vidhijain0606/vit-scope-portal.git`
  A branch `feature/meeting-styles-ui-ai` was pushed earlier (pre-VAPT-fixes state). The VAPT
  security pass (this session) has **not** been pushed — user wants to commit it manually.
- **Live deployment:** `https://vit-scope-portal.azurewebsites.net/`
  Azure App Service, resource group `vit-scope-rg`. Currently running the **pre-VAPT-fixes**
  build — the VAPT remediation work has not been redeployed yet.
- **Admin login (live site):** username `admin`, password `VitScopeAdmin@2026` (temporary,
  reset by Claude mid-session — user should change it).
- **VAPT report + remediation doc:** `docs/solutions_vapt.md` (source) and
  `docs/solutions_vapt.pdf` (generated via pandoc → Chrome headless print-to-PDF). Every one of
  the 16 original findings has an "Implemented — reasoning and verification" section appended.

## User preferences / working style (IMPORTANT — read before acting)

- **Writes in ALL CAPS, often with typos, terse and direct.** Don't mirror the caps/typos back;
  respond normally but match the urgency and brevity.
- **"Don't commit, I'll commit myself"** — stated explicitly and repeatedly. Never run `git add`/
  `git commit`/`git push` in this project unless told to in that specific message. Make the file
  changes only.
- **Never reveal secrets in agent/chat output** — explicitly said "dont reveal secrets in the
  agent." SMTP passwords, DB connection strings, API keys: write them to `.env.local` directly,
  never print/echo them in a response.
- **Wants verification, not just claims.** Repeatedly asks "did you check," "reverify," "why is
  X still there" — always re-grep/re-test before asserting something is fixed or absent, and say
  what you checked.
- **Wants concrete deployed proof, not just code changes.** Frequently asks for the live link,
  whether something is actually visible on the deployed site, asks admin credentials. Prefers
  seeing it live over being told it's "done."
- **Dislikes native browser `alert()` popups** — replace with the existing `AlertModal`
  component wherever encountered.
- **Wants a light-themed app, explicitly** — no dark mode. `color-scheme: light` is set globally
  for this reason; do not reintroduce `prefers-color-scheme: dark` overrides without being asked.
- **Design taste:** gave an explicit color palette once — Royal Blue (`#2563EB`) primary, Deep
  Navy (`#0F172A`) text/headings, Vibrant Teal (`#0D9488`) for CTAs, Slate (`#F8FAFC`) backgrounds.
  Applied globally via CSS variables in `src/app/globals.css`. Also pointed to a reference
  screenshot once for a specific calendar/date-picker visual style (Material-ish month grid with
  a "Quick select" sidebar) — built as `MonthDatePicker`.
- **Approves by giving the next instruction, not by saying "approved."** Treat an unblocked next
  request as implicit sign-off on the prior change; don't wait for explicit "yes, looks good."
- **Wants incremental "✅ Task N/M done" style progress updates** during long multi-step work
  (this was explicit for the VAPT remediation pass) — one message per completed item, not one
  giant summary at the end.
- **Corrects precisely when something's wrong** — e.g. clarified the exact overlap-window
  semantics for meeting slots ("if 10am is booked till 11:30 no other meeting, but 12 is fine"),
  clarified the calendar was for *viewing* booked slots not *picking* a new one. Take corrections
  literally and re-verify against the exact wording given.
- Faculty allowlist test accounts used throughout: `hparveensultana@vit.ac.in`,
  `rajkumars@vit.ac.in`, `vidhiprashant.j2023@vitstudent.ac.in` (user's own test account),
  `aanthoniraj@vit.ac.in`.

## What's been accomplished (chronological, high-level)

1. **Backend migration** (pre-dates this session's start but is foundational): Supabase →
   Azure Postgres + NextAuth v5, Azure Blob Storage for documents, Azure OpenAI for AI features.
2. **Calendar views**: `WeekCalendar` component built and iterated on (overlap-safe column
   packing, light-theme-only, larger readable cards) — used for admin's confirmed-meetings
   calendar (`/admin/calendar`, its own page, NOT the admin dashboard) and faculty's own-bookings
   calendar on `/dashboard`.
3. **AI features**: "Suggest best slot" button + chatbot slot recommendations, both grounded in
   real DB availability (fixed a bug where they ignored the same filters as the real slot list).
   Admin can also type `add slot 2026-10-20 10:00-11:00` in the chatbot to create a slot.
   Root-caused and fixed: Azure OpenAI resource had zero model deployments (created `gpt-5-mini`
   deployment; `gpt-4o-mini` is deprecated for new deployments).
4. **Email notifications**: admin notified when faculty books (Gmail SMTP via
   `spareemail0606@gmail.com`, App Password required — regular password doesn't work), faculty
   notified when admin confirms. Fixed deliverability partially (sender display name) — emails
   landing in spam is a known residual issue (new sending account, no SPF/DKIM) that needs
   "mark not spam" + time, not a code fix.
5. **Oral Exam freeze/unfreeze toggle**: admin-controlled, **disabled by default**, backed by
   an `app_settings` DB table, enforced server-side in `/api/slots`, `/api/bookings`, AI
   suggest-slot, and the chatbot (not just hidden in UI). Relocated from admin dashboard to the
   top of `/admin/add-slots` per explicit request.
6. **Sunday booking block**: disabled in `MonthDatePicker` UI (grid cells + quick-select) and
   enforced authoritatively server-side in `POST /api/slots`.
7. **Cross-meeting-type conflict detection**: a faculty member's own bookings (any meeting
   type) are checked for time overlap, not just same-type-group conflicts — closes a gap where
   someone could double-book themselves across different meeting types.
8. **24-hour re-release rule**: cancelling a slot only re-opens it for others if its start time
   is still 24+ hours away.
9. **Meeting-type visibility gap fix**: booking a 10:00 DC Meeting (60min) now correctly blocks
   10:30 and 11:00, frees up at 11:30/12:00 (90-minute total block via duration+gap).
10. **"Completed" status badges**: past meetings show a gray "`Status` & Completed" badge on
    both admin table and faculty dashboard cards.
11. **Azure deployment fixed**: two real deploy-breaking bugs found and fixed —
    `next.config.ts` needed `outputFileTracingRoot` pinned (stray lockfile at
    `C:\Users\<user>\package-lock.json` was confusing Next's workspace-root detection, burying
    `server.js`), and the deploy script's `Compress-Archive` writes backslash zip paths that
    Linux can't extract — manual deploys use the Unix `zip` tool instead (`scripts/deploy.ps1`
    itself was never fixed to do this automatically — see "left to do").
12. **Auth.js `trustHost: true`** added to fix a production-only `UntrustedHost` 500 error
    (Vercel auto-trusts; Azure App Service doesn't). `NEXTAUTH_URL` is pinned to the canonical
    domain, which is what actually closes the host-header-poisoning risk this setting could
    otherwise introduce.
13. **Full VAPT (Vulnerability Assessment and Penetration Testing) remediation pass** — see
    `docs/solutions_vapt.md`/`.pdf` for full detail. All 16 findings addressed:
    - VAPT-01 (Critical): deleted 10 files with hardcoded Supabase credentials (4 named in the
      report + 5 more found by a broader grep) and permissive RLS SQL files.
    - VAPT-11: fixed the booking-cancellation unique-constraint bug (partial unique index
      `WHERE status != 'cancelled'` instead of a table-wide constraint) — this was blocking
      re-booking any previously-cancelled slot.
    - VAPT-18(ii): admin sessions now get a synthetic email (`${username}@internal.vit-scope`)
      so `/api/ai/chat` and similar routes work for admin (previously hard 401'd).
    - VAPT-02/06/10: document upload hardened — extension allowlist, magic-byte signature
      verification, forced `Content-Disposition: attachment`, random UUID blob names (closes
      path traversal), 10MB size cap. New file: `src/lib/fileValidation.ts`.
    - VAPT-05: added root `middleware.ts` (Node runtime, since the Credentials provider uses
      `bcrypt`/`pg`) guarding `/admin`, `/dashboard`, `/book-slot`; added server-side `await
      auth()` checks directly in all three layouts (previously `/dashboard` and `/book-slot` had
      zero auth checks at all).
    - VAPT-03: CSV export formula-injection fix — new `src/utils/csv.ts` `csvCell()` helper.
    - VAPT-04: HTML-escaped all email template interpolations — new `src/utils/sanitize.ts`
      (`escapeHtml`, `stripCrlf`), plain-text email alternatives added.
    - VAPT-08: `/api/slots` GET now requires auth (previously fully open/enumerable).
    - VAPT-09: added `isValidPersonField()` validation on booking identity fields (empId,
      empName, scholarId, scholarName) — immediate mitigation tier, not the full
      identity-verification rework (deliberately scoped smaller).
    - VAPT-12: ran safe `npm audit fix` (prod advisories 9→6). Remaining 6 (`postcss`, `sharp`,
      `next-auth`'s transitive deps) require `--force` which bumps Next.js out of range —
      explicitly left for a separate controlled upgrade pass, not forced.
    - VAPT-13: fixed `isOffice` regex (anchored on `$`, never matched SAS-signed URLs with query
      strings) — turned out to be *more* impactful than originally scoped since VAPT-07's fix
      made every document URL carry a query string.
    - VAPT-14: added security headers (`X-Frame-Options`, `X-Content-Type-Options`,
      `Strict-Transport-Security`, CSP) in `next.config.ts`, CSP scoped to the app's actual
      external resources (ui-avatars.com, docs.google.com, Azure Blob domain) after grepping for
      what's actually used — not copy-pasted generically.
    - VAPT-07: tightened SAS token expiry 60→15 minutes (full internal-proxy viewer rejected as
      disproportionate effort for the residual risk).
    - VAPT-15 (biggest item): moved the faculty allowlist from hardcoded
      `src/utils/accessControl.ts` array into a new `allowed_emails` DB table, with a full
      admin UI (`AllowedEmailsManager` component on the admin dashboard) and API
      (`/api/admin/allowed-emails`). Hit a real complication: `checkAccess()` was also used in a
      *client* component (`DashboardView.tsx`), and the DB-backed version imports `pg`
      (Node-only) — added `/api/access-check` as a client-safe proxy route to fix this cleanly.
    - VAPT-16: no code change — `trustHost: true` kept, verified `NEXTAUTH_URL` is still pinned
      live (closes the practical risk; removing it would reintroduce the production 500).
    - VAPT-17: added `src/lib/rateLimit.ts` (in-memory sliding window) — 5 admin login attempts
      per 5 min per attempted username, 20 AI calls per minute per account.
    - VAPT-18(i): added `<user_message>` delimiter tags + explicit anti-injection instructions
      in the chatbot's system prompt.
    - Every single fix was verified with either a standalone logic test, a real (often
      rolled-back) DB transaction test, or a full `tsc --noEmit` + `next build` pass — documented
      inline in `solutions_vapt.md` under each finding.

## What's left to do

1. **Not yet redeployed**: the entire VAPT remediation pass (all 16 fixes) is sitting
   uncommitted in the worktree and has **not** been pushed to GitHub or redeployed to Azure.
   Live site is still running pre-VAPT-fixes code. User wants to commit manually — do not commit
   or push unless explicitly told to in that message.
2. **`scripts/deploy.ps1` still broken**: uses `Compress-Archive`, which produces a zip Linux
   can't extract correctly. Manual deploys worked around this with the Unix `zip` tool, but the
   script itself was never fixed. Low priority unless deploys become frequent.
3. **Remaining 6 npm audit advisories** (`postcss`, `sharp`, transitive `next-auth` deps)
   require `npm audit fix --force`, which bumps Next.js outside its stated range — needs its own
   testing pass, not bundled into a security fix.
4. **Google OAuth redirect URI**: flagged early in the engagement — need to confirm
   `https://vit-scope-portal.azurewebsites.net/api/auth/callback/google` is registered as an
   authorized redirect URI in Google Cloud Console, or Google sign-in may fail on the live
   domain even though `localhost` works. (User reported this error once; unclear if it was ever
   permanently fixed on the Google Cloud side — that's an external console change, not code.)
5. **Admin password** is still the temporary `VitScopeAdmin@2026` set by Claude — should be
   changed by the user.
6. **GitHub collaborator**: user asked to add `anthoniraj` (GitHub username) as a repo
   collaborator — Claude has no `gh` CLI/API token access to do this; must be done manually via
   GitHub repo → Settings → Collaborators.
7. **Email deliverability**: booking notification emails from `spareemail0606@gmail.com` land
   in spam — needs "mark as not spam" + time to build sender reputation, or migrating to a
   domain-authenticated sender (Google Workspace or Azure Communication Services) for a durable
   fix.
8. **VAPT-09's full fix** (sourcing `empId`/`empName` from a verified identity record instead of
   client-trusted input) was deliberately deferred — only the "immediate mitigation" validation
   tier was implemented. The structural fix would need a `users` table keyed to Google identity.
9. **VAPT-07's full fix** (internal document-proxy viewer, fully eliminating the Google Docs
   viewer SAS exposure) was deliberately not pursued — judged disproportionate to the
   now-15-minute-bounded residual risk. Revisit only if a hard "zero third-party exposure"
   requirement emerges.

## Known non-issues (already checked, don't re-investigate)

- Hardcoded Supabase credentials: fully removed from the codebase. If a stale checkout elsewhere
  still shows them, that copy hasn't received these deletions — only the worktree above has.
- "Why isn't the admin able to confirm a booking" — this was tested directly against the live
  API and worked correctly; any apparent failure was the Oral Exam toggle or calendar page
  (read-only, no confirm button there by design) being confused with the dashboard table view.
- Background dev-server "killed" notifications in this session were frequently false alarms —
  the task-tracking layer lost track of a still-running process; always re-verify with a direct
  `curl` before assuming the server actually died.
