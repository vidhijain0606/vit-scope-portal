---
title: "VIT SCOPE Research Portal — VAPT Remediation Plan"
subtitle: "Issue-by-issue analysis and proposed solutions (solutions_vapt)"
date: "\today"
geometry: margin=1in
fontsize: 11pt
colorlinks: true
---

# Overview

This document responds to the Vulnerability Assessment and Penetration Testing (VAPT) report
performed against the VIT SCOPE Research Portal codebase. Each finding was independently
re-verified against the current, live codebase before a remediation was proposed — several
findings reference legacy Supabase-era files that are no longer part of the running application,
and this is noted explicitly where relevant.

Findings are grouped into four remediation phases, ordered by actual risk and blast radius
rather than strictly by the report's severity labels, since a few "Medium" items are live
functional bugs and a few "High" items are lower real-world risk once context is applied.

---

# Phase 1 — Critical (Immediate)

## VAPT-01: Hardcoded Supabase Credentials with Permissive Public RLS Policies

**Severity:** Critical

**Issue addressed:** Several legacy scripts (`scripts/debug_bookings.js`,
`scripts/seed_30min_slots.js`, `scripts/seed_extra_slots.js`, `scripts/test_schema.js`) contain
hardcoded fallback values for a Supabase project URL and anonymous JWT key. The accompanying
`database/supabase_setup.sql` and `database/fix_rls_anon.sql` define Row-Level Security
policies that grant the `public` role unrestricted `SELECT`, `INSERT`, `UPDATE`, and `DELETE`
access to the `slots`, `bookings`, and `documents` tables and storage bucket. Anyone who obtains
the key — which is sitting in the repository in plaintext — has full read/write/delete access
to that database, independent of any authentication in the running application.

**Context:** The live application no longer uses Supabase; it was migrated to Azure Database
for PostgreSQL earlier in this engagement. These files are dead code with respect to the
running system. The risk is not that the live app is exposed through this path — it is that
the Supabase project itself, if still provisioned, remains openly writable to anyone who finds
this key in the repository history.

**Proposed solution:**
1. Delete `scripts/debug_bookings.js`, `scripts/seed_30min_slots.js`,
   `scripts/seed_extra_slots.js`, `scripts/test_schema.js`, `database/supabase_setup.sql`, and
   `database/fix_rls_anon.sql` from the repository.
2. Separately, outside the codebase: rotate or revoke the exposed Supabase anon key from the
   Supabase dashboard, and decommission the Supabase project if it is confirmed unused.
3. Add a pre-commit secret-scanning check (e.g. `gitleaks`) going forward to prevent
   recurrence.

**Implemented — reasoning and verification:**
A full `grep` across `src/` confirmed zero references to Supabase anywhere in the running
application, so these files carried no functional dependency. Rather than deleting only the
four files the original report named, a follow-up grep across the rest of `scripts/` found
five *additional* legacy files (`clean_slots.js`, `insert_test_slots.js`, `seed_slots.js`,
`seed_slots_v2.js`, `verify_slots.js`) with the same hardcoded Supabase URL/anon-key pattern
that the report had not enumerated — these were deleted as well, since leaving them in place
would have left the identical credential-exposure vector only partially closed. A stray
comment in `database/azure_postgres_setup.sql` referencing the now-deleted
`supabase_setup.sql` was also corrected to avoid a dangling file reference.

*Alignment check:* the fix directly removes the credential-leak artifact VAPT-01 identifies,
without touching any code path the live Azure-backed application depends on (confirmed via the
`src/` grep before deletion). *Re-verification:* `grep -rln supabase src/` returns no results;
`ls scripts/ database/` confirms only the three Azure-relevant scripts and the Azure schema
file remain. Note: step 2 above (rotating/revoking the Supabase key, decommissioning the
project) is outside this codebase and must be done manually in the Supabase dashboard — not
something I have access to from here.

---

## VAPT-11: Unique Constraint Denial of Service on Re-Booking Cancelled Slots

**Severity:** Medium in the report; treated as Critical here because it is a **live functional
bug**, not a theoretical one.

**Issue addressed:** The `bookings` table has `CONSTRAINT unique_slot_booking UNIQUE (slot_id)`
with no qualifying condition. When a booking is cancelled, the row remains in the table with
its original `slot_id`, only its `status` changes to `cancelled`. If the underlying slot is
later re-released and a different (or the same) faculty member books it again, the new
`INSERT INTO bookings (slot_id, ...)` violates the unique constraint and fails outright. In
effect, once a slot is cancelled, it can never be successfully booked again — only ever appear
briefly as available before erroring out.

**Proposed solution:** Replace the table-wide unique constraint with a partial unique index
that only applies to active bookings:

```sql
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS unique_slot_booking;
CREATE UNIQUE INDEX unique_active_slot_booking
  ON bookings (slot_id)
  WHERE status != 'cancelled';
```

This still prevents two active bookings from claiming the same slot, while allowing a slot to
be legitimately re-booked after a prior booking on it was cancelled.

**Implemented — reasoning and verification:** Applied directly to the live Azure Postgres
database (`ALTER TABLE ... DROP CONSTRAINT`, then `CREATE UNIQUE INDEX ... WHERE status !=
'cancelled'`), and mirrored the same change in `database/azure_postgres_setup.sql` so a fresh
database setup matches the live schema. *Alignment check:* this directly targets the exact
mechanism VAPT-11 describes — a stale `cancelled` row holding `slot_id` blocking all future
bookings of that slot — without weakening the original intent of the constraint (two
simultaneously *active* bookings on the same slot are still impossible). *Re-verification:*
ran a real end-to-end test inside a rolled-back transaction, inserting a new `pending` booking
against the `slot_id` of an existing `cancelled` booking already in the production table — the
insert succeeded with no constraint violation (previously this would have failed). The test
transaction was rolled back, so no production data was altered by the verification itself.

---

## VAPT-18(ii): Admin Session Missing Email Breaks AI Chat Authorization

**Severity:** Low in the report; treated as Critical-priority here because it is a **live
functional bug** blocking a feature for the admin role entirely.

**Issue addressed:** The admin credentials provider in `src/lib/auth.ts` returns a user object
of `{ id, name, role: 'admin' }` with no `email` field. `src/app/api/ai/chat/route.ts` requires
`session?.user?.email` to proceed, returning `401 Unauthorized` otherwise. As a result, an
admin who is correctly authenticated can never use the AI chatbot, including the "add slot via
one command" feature that was built specifically for admin use.

**Proposed solution:** Give the admin credentials provider a synthetic, stable email value
(e.g. `${username}@internal.vit-scope`) at sign-in so downstream checks that key off
`session.user.email` continue to work uniformly for both faculty (Google OAuth) and admin
(credentials) sessions, without having to special-case admin everywhere.

**Implemented — reasoning and verification:** Added `email: \`${admin.username}@internal.vit-scope\``
to the object returned from the admin `Credentials` provider's `authorize()` callback in
`src/lib/auth.ts`. A synthetic, non-resolvable domain was chosen deliberately over reusing a
real VIT domain, so it's immediately recognizable in logs/DB rows as an admin-session artifact
rather than a real faculty address, and can never collide with an actual
`@vit.ac.in`/`@vitstudent.ac.in` account. *Alignment check:* `checkAccess()` (the Google-only
allowlist gate) is untouched — it only runs for the Google provider in the `signIn` callback,
so this change cannot be used to bypass faculty access control; it only backfills a field that
was previously `undefined` for a session type that already has full admin privileges by design.
*Re-verification:* `tsc --noEmit` passes clean; confirmed no other code path treats
`session.user.email` as a value that must resolve to a real, deliverable mailbox for the admin
role specifically (the only place that matters, `checkAccess`, is Google-provider-only as
noted).

---

# Phase 2 — High

## VAPT-02 / VAPT-06 / VAPT-10: Unrestricted File Upload, Path Traversal, and Unbounded Upload Size

**Severity:** High / Medium / Medium (addressed together — same code path)

**Issue addressed:** `src/app/api/documents/route.ts` accepts any uploaded file with no
server-side validation of extension, MIME type, or file signature, and directly assigns the
client-supplied `file.type` as the blob's `Content-Type` header. A malicious `.html` or `.svg`
upload served back with `Content-Type: text/html` can execute script in a viewer's browser
context (stored XSS). Separately, the blob name is derived from the user-supplied `title`
field with only whitespace stripped — path separators or traversal sequences are not
rejected, risking unexpected blob paths in storage. There is also no upload size limit, so a
very large file can be loaded entirely into process memory via `file.arrayBuffer()`, risking
an out-of-memory crash under concurrent large uploads.

**Proposed solution:**
1. Enforce a strict file extension allowlist (`.pdf`, `.docx`, `.xlsx`, `.pptx`, and similar
   office/document formats only).
2. Verify the file's actual content against its declared type using file-signature (magic
   byte) inspection, not just the extension or client-supplied MIME type.
3. Force safe handling regardless of content: set `blobHTTPHeaders.blobContentType` to a
   fixed `application/octet-stream` (or the verified allowlisted type) and set
   `Content-Disposition: attachment` so browsers download rather than render the file.
4. Generate blob names from a cryptographically random UUID rather than the user-supplied
   title, eliminating the path-traversal surface entirely.
5. Reject uploads above a fixed size ceiling (10 MB is a reasonable default for this use
   case) before reading the file into memory.

**Implemented — reasoning and verification:** Added `src/lib/fileValidation.ts` with an
extension allowlist (PDF, DOC(X), XLS(X), PPT(X)), a magic-byte signature table for each
format family (`%PDF` for PDF, the shared ZIP signature for the OOXML formats, the shared OLE
signature for the legacy binary formats), and a 10MB size constant. `src/app/api/documents/
route.ts`'s `POST` handler now: rejects oversized files before buffering (closes VAPT-10);
rejects any extension outside the allowlist; rejects files whose actual byte content doesn't
match their claimed extension (closes the XSS vector in VAPT-02, since an HTML/SVG payload
renamed to `.pdf` now fails the signature check rather than being trusted); forces the blob's
`Content-Type` to a fixed, verified value instead of the client-supplied `file.type`; adds
`Content-Disposition: attachment` so browsers download rather than render even a technically
valid document; and generates the blob name from `crypto.randomUUID()` instead of the
user-supplied title, eliminating the path-traversal surface entirely (closes VAPT-06).

*Alignment check:* every sub-finding in this group (02/06/10) traced back to the same upload
code path, so fixing them together in one pass was both correct and avoided three separate,
possibly-conflicting patches to the same function. *Re-verification:* `tsc --noEmit` passes
clean; ran a standalone test of the signature-matching logic against a real PDF header (passes,
as expected) and an HTML payload with a spoofed `.pdf` extension (correctly rejected) — matching
the exact attack scenario VAPT-02 describes.

---

## VAPT-05: Client-Side-Only Route Guard and Missing Server-Side Authorization

**Severity:** High

**Issue addressed:** The only barrier preventing unauthenticated access to admin pages is the
client-side `<AdminGuard>` React component, which only takes effect after the JavaScript
bundle has downloaded and hydrated. There is no `middleware.ts` and no server-side check in
the admin layout. More significantly, `src/app/dashboard/layout.tsx` and
`src/app/book-slot/layout.tsx` have **no authentication check whatsoever** — any
unauthenticated visitor can load these routes directly.

**Proposed solution:**
1. Add a root-level `middleware.ts` that validates the session (via Auth.js) and role before
   any request reaches `/admin/*`, `/dashboard/*`, or `/book-slot/*`, redirecting
   unauthenticated or under-privileged requests before any page code runs.
2. Add a server-side session check directly in `dashboard/layout.tsx` and
   `book-slot/layout.tsx` (both currently bare passthroughs) as defense-in-depth beneath the
   middleware layer, consistent with the pattern already used for `/admin`.

**Implemented — reasoning and verification:** Added a root-level `middleware.ts` that wraps
Auth.js's `auth()` as the middleware function, matched against `/admin/:path*`,
`/dashboard/:path*`, and `/book-slot/:path*`. It redirects unauthenticated requests to `/`
(for dashboard/book-slot) or `/admin-login` (for admin), and additionally requires `role ===
'admin'` for the admin paths — all before any page code runs. Because the Credentials provider
in `src/lib/auth.ts` uses `bcrypt` and a `pg` connection pool (Node-only APIs incompatible with
the default Edge middleware runtime), the middleware explicitly sets
`runtime: 'nodejs'` in its exported `config`, which Next.js 16 supports as a stable option —
without this, the build would fail trying to bundle `pg`/`bcrypt` for the Edge runtime.
Server-side session checks (`await auth()` + `redirect()`) were also added directly to
`dashboard/layout.tsx`, `book-slot/layout.tsx`, and `admin/layout.tsx` (the last as an explicit
belt-and-suspenders check ahead of the existing client-only `<AdminGuard>`, matching the
pattern the original report suggested).

*Alignment check:* this closes exactly the gap VAPT-05 describes — `/dashboard` and
`/book-slot` previously had zero auth checks of any kind, and `/admin` relied solely on a
client component that only activates post-hydration. *Re-verification:* `tsc --noEmit` passes
clean, and a full production build succeeds — critically, the build output shows `/admin`,
`/admin/dashboard`, `/dashboard`, `/book-slot`, and related routes changed from statically
prerendered (`○`) to server-rendered-on-demand (`ƒ`), which confirms the new `await auth()`
calls are forcing per-request server evaluation rather than being skipped by static
generation.

---

## VAPT-03: CSV / Formula Injection in Admin Booking Export

**Severity:** High

**Issue addressed:** `src/components/Admin/AdminTable.tsx`'s CSV export concatenates
user-supplied fields (scholar name, faculty name, meeting type) directly into CSV rows with no
escaping of formula-trigger characters. A booking submitted with a scholar name such as
`=CMD|' /C calc'!A0` becomes a live, executable formula the moment an administrator opens the
exported file in Excel or LibreOffice Calc, enabling command execution on the administrator's
machine.

**Proposed solution:** Before writing each cell, prefix any value that begins with `=`, `+`,
`-`, `@`, a tab, or a carriage return with a leading single quote (`'`), which spreadsheet
applications treat as a literal-text marker rather than a formula indicator. Also double any
internal double-quote characters per standard CSV escaping rules.

**Implemented — reasoning and verification:** Added `src/utils/csv.ts` exporting a single
`csvCell()` helper implementing exactly this escaping rule, and replaced the manual
string-interpolation CSV-building in `AdminTable.tsx`'s `handleExport()` with
`[...].map(csvCell).join(',')` for both the header row and every data row. *Alignment check:*
the fix is applied uniformly to every field in the export, not just the ones that happen to
hold user-controlled data — the ID/date/time/status fields are server-generated and therefore
safe already, but routing them through the same helper means any future column addition is
protected by default rather than requiring a developer to remember which fields need escaping.
*Re-verification:* ran the sanitizer against the exact proof-of-concept payload from the
report, `=CMD|' /C calc'!A0` — it comes out as `"'=CMD|' /C calc'!A0"`, which Excel and
LibreOffice both render as inert literal text rather than executing; also verified normal
values pass through unchanged and embedded double-quotes escape correctly.

---

## VAPT-04: Stored HTML / Content Injection in Notification Emails

**Severity:** High

**Issue addressed:** `src/lib/mail.ts` interpolates `facultyName`, `scholarName`,
`scholarId`, and `meetingType` directly into HTML email bodies with no encoding. A booking
submitted with HTML tags in any of these fields (e.g. a fake `<a href="...">Confirm here</a>`
link, or an `<img>`/`<iframe>` overlay) renders as live markup in the recipient's email client,
enabling phishing or credential-harvesting against administrators and faculty who receive these
notifications.

**Proposed solution:** HTML-encode every user-supplied value (`&`, `<`, `>`, `"`, `'`) before
interpolating it into an email template, and strip carriage-return/line-feed characters from
any value that could end up in a header or subject line to prevent email header injection.
Add a plain-text `text:` alternative to every sent email alongside the HTML version.

**Implemented — reasoning and verification:** Added `src/utils/sanitize.ts` with `escapeHtml()`
(entity-encodes `& < > " '`) and `stripCrlf()` (collapses `\r`/`\n` to a space). Rewrote
`src/lib/mail.ts` so every interpolated value in both email templates — faculty name, faculty
email, scholar name/id, meeting type, date, start/end time — goes through `escapeHtml()`, and
both subject lines go through `stripCrlf()`. Added a `text:` plain-text alternative to both
`sendMail()` calls, matching the recommendation and giving mail clients a safe fallback
rendering path. *Alignment check:* this covers every field the report flagged
(`facultyName`/`scholarName`/`scholarId`/`meetingType`) plus the remaining interpolated fields
in the same templates that weren't explicitly named but share the identical risk
(`facultyEmail`, `date`, `startTime`, `endTime`) — fixing the whole template rather than only
the named fields. *Re-verification:* `tsc --noEmit` passes clean; ran `escapeHtml()` against a
representative phishing payload, `<a href="http://evil.com">Click here to confirm</a>` — it
renders as inert escaped text (`&lt;a href=&quot;...&quot;&gt;...`) rather than a clickable
link, while a normal value like `Dr. Smith` passes through unchanged.

---

# Phase 3 — Medium

## VAPT-08: Unauthenticated Slot and Schedule Enumeration

**Issue addressed:** `GET /api/slots` performs no authentication check at all — any
unauthenticated caller can call `/api/slots?all=true` and enumerate the institution's entire
schedule of meeting slots.

**Proposed solution:** Require a valid session at the top of the `GET` handler, returning
`401` for unauthenticated requests, consistent with every other data-returning route in the
application.

**Implemented — reasoning and verification:** Added `const session = await auth(); if
(!session) return 401` at the top of `GET` in `src/app/api/slots/route.ts`. Note this is a
genuinely necessary fix independent of `middleware.ts` (Task 5/VAPT-05) — that middleware's
matcher only covers page routes (`/admin`, `/dashboard`, `/book-slot`), not `/api/*` routes, so
this API endpoint would otherwise still be directly reachable by an unauthenticated caller even
with the middleware in place. While implementing this, found that the file already had a
second, later `const session = await auth()` call (added earlier this session for the
cross-meeting-type conflict check) — consolidated both into the single session lookup at the
top of the function rather than querying twice, which is both the TypeScript-correct fix
(duplicate `const` in the same scope doesn't compile) and a small efficiency win.
*Re-verification:* `tsc --noEmit` and a full production build both pass clean.

## VAPT-09: Identity Spoofing in Slot Booking Parameters

**Issue addressed:** While the booking's `emp_email` is correctly bound to the authenticated
session, the `empId` and `empName` fields are accepted verbatim from the request body with no
cross-check against a trusted record, allowing any authenticated user to submit a booking that
displays someone else's name and employee ID.

**Proposed solution:** Add length and character-set validation on `empId`/`empName` as an
immediate mitigation; as a longer-term improvement, source these fields from a verified
`users`/`admins` record or the OAuth identity claims rather than trusting client input.

**Implemented — reasoning and verification:** Added `isValidPersonField()` to
`src/utils/sanitize.ts` — a Unicode-aware allowlist (`\p{L}\p{N} .,'-/`) with a 100-character
cap — and applied it to `empId`, `empName`, `scholarId`, and `scholarName` in `POST
/api/bookings`, rejecting the request with a `400` and a field-specific message if any fail.
*Alignment check:* this is deliberately the "immediate mitigation" tier the report itself
proposes, not the longer-term structural fix (sourcing `empId`/`empName` from a verified
record) — that larger change would require introducing a `users` table keyed to Google
identity and backfilling it, which is a bigger architectural change better scoped as its own
task than folded into this security pass; the validation here closes the actual exploitable
surface (arbitrary/script-bearing content in these fields) immediately. *Re-verification*: ran
the validator against real existing production booking data (`"Vidhi Prashant J 23BAI0063"`,
`"21phd0045"`, `"Rajkumar Soundrapandiyan"`) — all pass unchanged, confirming no legitimate
existing bookings would be rejected by this change — and against an XSS-style payload
(`<script>alert(1)</script>`), an empty string, and an oversized 201-character string — all
three correctly rejected. `tsc --noEmit` passes clean.

## VAPT-07: SAS Token Forwarded to Google Docs Viewer

**Issue addressed:** Document previews for Office files pass the full signed Azure Blob SAS
URL — including its time-limited authorization token — to `docs.google.com/viewer`, exposing
that signed URL to a third-party service and its logs.

**Proposed solution:** This was already partially mitigated earlier in this engagement by
switching from permanent public blob URLs to signed URLs with a 60-minute expiry. The
remaining exposure (the signed URL reaching Google's viewer) should be accepted as a bounded,
time-limited risk, or replaced with an internally hosted document preview if fully avoiding any
third-party exposure becomes a hard requirement.

**Implemented — reasoning and verification:** Rather than leave this as purely an accepted
risk, tightened `getReadSasUrl()`'s default expiry in `src/lib/blob.ts` from 60 minutes down to
15 — matching the report's own suggested 5–15 minute window — reducing the exposure window for
a URL that reaches Google's viewer/logs by 4x, while still comfortably covering a normal
document-viewing session. *Alignment check:* building a fully internal document-proxy viewer
(the alternative the report offers) was deliberately not pursued — it's a meaningfully larger
change (new streaming endpoint, rewriting the viewer UI) for a residual risk that is now
time-boxed to 15 minutes and limited to read-only access on files the admin has already chosen
to make available to faculty; that tradeoff was judged disproportionate to the remaining risk.
*Re-verification:* `tsc --noEmit` passes clean.

## VAPT-13: Office Document Viewer Detection Regex Fails on Signed URLs

**Issue addressed:** The regex used to detect Office document file types anchors on end-of-
string (`$`), which never matches a URL with a trailing SAS query string, so Office documents
always fall through to the plain iframe viewer instead of the intended Office-aware viewer.

**Proposed solution:** Strip the query string from the URL before testing the extension
regex.

**Implemented — reasoning and verification:** Changed
`selectedDoc.blob_url.match(...)` to `selectedDoc.blob_url.split('?')[0].match(...)` in
`src/app/documents/page.tsx` (the only call site of this check in the codebase — confirmed via
a repo-wide grep for `isOffice`/`DocumentViewerModal`). *Alignment check:* this is now
functionally significant beyond the original report's framing — since VAPT-07's fix switched
document URLs from permanent public links to signed SAS URLs (which always carry a query
string), *every* Office document now hits this bug, not just some; fixing it was effectively
required to make the VAPT-07 remediation fully functional, not just a cosmetic correction.
*Re-verification:* reproduced the exact failure against a representative SAS URL shape
(`...docx?sv=...&se=...&sig=...`) — the old regex returns `false` as the report describes, the
fixed version (stripping the query string first) returns `true`. `tsc --noEmit` passes clean.

## VAPT-12: Known Vulnerabilities in Dependencies

**Issue addressed:** `npm audit` currently reports 9 advisories (1 critical, 7 high, 1
moderate) in production dependencies, most significantly in `postcss`, `sharp`, and
`source-map-js`.

**Proposed solution:** Apply `npm audit fix` for advisories with a non-breaking patch
available; evaluate major-version upgrades for `sharp`/`postcss` in a controlled test pass
before applying, since those updates can carry breaking changes. Add automated dependency
scanning (Dependabot or equivalent) to catch future advisories automatically.

**Implemented — reasoning and verification:** Ran `npm audit fix` (no `--force`). Production
(`--omit=dev`) advisories dropped from 9 to 6 — the `source-map-js` event-loop DoS advisory was
resolved via a non-breaking transitive bump, reflected only in `package-lock.json` (no
`package.json` range changes). The remaining 6 (`postcss`, `sharp`, and `next-auth`'s
transitive `@auth/core`/`nodemailer` dependencies) all require `npm audit fix --force`, which
npm itself reports would install `next@16.4.3` — a version outside this project's stated
dependency range. *Alignment check:* the plan explicitly scoped major-version upgrades as
needing a separate controlled test pass rather than being force-applied inside this security
remediation pass, since a forced Next.js major bump risks breaking the application in ways a
security fix shouldn't — so deliberately stopped here rather than running `--force`.
*Re-verification:* `tsc --noEmit` passes clean and a full production build succeeds after the
lockfile update, confirming the applied fix introduced no regressions. The remaining 6
advisories are carried forward as a known, explicitly-flagged follow-up requiring its own
testing pass (not silently left unaddressed).

## VAPT-14: Missing HTTP Security Headers

**Issue addressed:** `next.config.ts` sets no security-related HTTP headers, leaving the
application without clickjacking protection, MIME-sniffing protection, or HSTS enforcement.

**Proposed solution:** Add a `headers()` block to `next.config.ts` setting
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, and a
`Content-Security-Policy` appropriate to the application's actual script/style sources.

**Implemented — reasoning and verification:** Added an `async headers()` block to
`next.config.ts` applying to every route (`source: '/(.*)'`), setting `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Strict-Transport-Security`, and a `Content-Security-Policy`. The CSP was not copied verbatim
from the report's generic example — it was built by first grepping the codebase for every
external resource the app actually loads (`ui-avatars.com` for profile avatars in
`BookingCard.tsx`/`Navbar.tsx`/`Sidebar.tsx`, `docs.google.com` for the Office document viewer
iframe, and the Azure Blob Storage domain for document preview iframes/images in
`DocumentViewerModal.tsx`), then scoping `img-src`/`frame-src`/`connect-src` to exactly those
origins plus `'self'`. A generic/stricter CSP copied from the report without this check would
have silently broken avatar images and document previews. *Alignment check:* `frame-ancestors
'none'` (in the CSP) and `X-Frame-Options: DENY` both address the same clickjacking risk
redundantly for broader browser support, matching the report's intent exactly. *Re-verification:*
`tsc --noEmit` and a full production build both pass clean with the new config in place.

---

# Phase 4 — Lower Priority / Hardening

## VAPT-15: Hardcoded Faculty Emails in Source

**Issue addressed:** The faculty access allowlist is committed directly into
`src/utils/accessControl.ts` as plaintext email addresses, requiring a code change and
redeployment for every access change.

**Proposed solution:** Move the allowlist into the database, reusing the `app_settings`-style
pattern already established for the Oral Exam booking toggle, so the admin can manage
authorized accounts through the UI instead of through source code.

**Implemented — reasoning and verification:** Added a dedicated `allowed_emails` table (rather
than overloading `app_settings`, since this is a list of rows, not a single key/value flag),
seeded on the live database with the exact four emails previously hardcoded. Rewrote
`src/utils/accessControl.ts`'s `checkAccess()` to be async and query this table instead of a
hardcoded array, and updated its one server-side caller (`src/lib/auth.ts`'s `signIn`
callback) to `await` it. Added `/api/admin/allowed-emails` (GET/POST/DELETE, admin-only) and a
new `AllowedEmailsManager` UI component — a simple add/remove chip list — placed on the admin
dashboard (the slot the Oral Exam toggle vacated when it moved to Add Slots per your separate
request, keeping that page focused on what you specifically asked to see there).

A real complication surfaced during this change: `checkAccess()` was also imported directly
into `DashboardView.tsx`, a **client** component, for a secondary re-check of the current
session against the allowlist (catching the case where an admin revokes someone's access after
they've already signed in, since their JWT session stays valid until it naturally expires).
The DB-backed version imports `pool` from `@/lib/db`, which uses `pg` — a Node-only package
that cannot be bundled into client-side JavaScript. Rather than leave that check broken or
silently drop it, added a new `GET /api/access-check` route that runs the same `checkAccess()`
server-side against the caller's own session, and pointed `DashboardView.tsx` at that endpoint
via `fetch()` instead. *Alignment check:* this preserves the exact security property the
original client-side check provided (mid-session revocation detection) while fully eliminating
the hardcoded-PII exposure VAPT-15 flagged. *Re-verification:* `tsc --noEmit` and a full
production build both pass clean — critically, the build succeeding at all confirms `pg` never
leaked into a client bundle (that specific failure mode hard-fails the Next.js build rather
than silently shipping broken code). Also ran a direct query against the live `allowed_emails`
table confirming `rajkumars@vit.ac.in` and its uppercase variant both resolve to allowed
(preserving the original case-insensitive matching behavior) while an arbitrary unauthorized
email correctly resolves to not-allowed.

## VAPT-16: `trustHost: true` in Auth.js Configuration

**Issue addressed:** `trustHost: true` causes Auth.js to trust the incoming `Host` header,
which could in principle be abused for host-header poisoning if the reverse proxy does not
sanitize that header.

**Proposed solution:** This setting was added specifically to resolve a production
`UntrustedHost` failure on Azure App Service, and `NEXTAUTH_URL` is already pinned explicitly
to the canonical production domain, which closes the practical risk. No change recommended
beyond confirming `NEXTAUTH_URL` stays authoritative and is never left unset in any
environment.

**Verified, no code change:** Queried the live Azure App Service configuration directly —
`NEXTAUTH_URL` is set to `https://vit-scope-portal.azurewebsites.net`, confirming it remains
authoritative as assumed. *Alignment check:* removing `trustHost: true` would reintroduce the
production-breaking `UntrustedHost` error this setting was added to fix (confirmed earlier in
this engagement), for a risk that `NEXTAUTH_URL` being pinned already closes — so no code
change was made here, consistent with the plan's own conclusion.

## VAPT-17: No Rate Limiting on Authentication or AI Endpoints

**Issue addressed:** The admin credentials login and both AI endpoints
(`/api/ai/chat`, `/api/ai/suggest-slot`) have no request-rate limiting, leaving them open to
brute-force login attempts and AI-quota/cost exhaustion from a single account.

**Proposed solution:** Add a lightweight in-memory or database-backed token-bucket rate limit
on `/api/admin/*` login attempts and `/api/ai/*` calls, scoped per IP and per account. Given
the application's scale, a full Redis-backed solution is not necessary — a simple sliding
window keyed in Postgres or process memory is sufficient.

**Implemented — reasoning and verification:** Added `src/lib/rateLimit.ts`, a simple in-memory
sliding-window limiter (`checkRateLimit(key, limit, windowMs)`), exactly matching the "simple
in-process window" tier the plan itself recommends over a Redis-backed solution at this scale.
Applied three limits: the admin `Credentials` provider's `authorize()` callback in
`src/lib/auth.ts` now allows 5 attempts per 5 minutes **per attempted username** (chosen over
per-IP, since IP extraction behind Azure App Service's proxy adds complexity for limited
benefit, and keying on the attempted username directly stops credential-stuffing against a
specific account regardless of the attacker's IP); `/api/ai/chat` and `/api/ai/suggest-slot`
each allow 20 calls per minute per signed-in account. *Alignment check:* keying by account
rather than only IP is deliberate — a shared campus NAT/VPN could otherwise rate-limit multiple
legitimate faculty off a single IP. *Re-verification:* ran the limiter logic standalone —
confirmed exactly 5 of 8 rapid simulated attempts against the same key are allowed (3
correctly blocked), and confirmed a different key (different username) is entirely unaffected
by another account's attempts, ruling out a cross-account lockout bug. `tsc --noEmit` and a
full production build both pass clean.

## VAPT-18(i): LLM Prompt Injection in AI Chat Assistant

**Issue addressed:** User chat messages are forwarded to Azure OpenAI with no sanitization or
explicit boundary between system instructions and user input, allowing a user to attempt to
override the assistant's intended behavior or extract its system prompt.

**Proposed solution:** Wrap user input with clear delimiters and reinforce, within the system
prompt, that content inside those delimiters is untrusted data and must never be treated as
new instructions. Continue to keep all data-mutating AI actions (e.g. the admin "add slot"
command) grounded in server-side validation that does not depend on the model's output being
well-behaved.

**Implemented — reasoning and verification:** Updated the `SYSTEM_PROMPT` in
`src/app/api/ai/chat/route.ts` to explicitly instruct the model that content arriving inside
`<user_message>` tags is data to respond to, never instructions to follow, and that it must
never claim it can delete data or access other users' bookings. The free-text user message is
now wrapped in those tags before being sent (`\`<user_message>\n${message}\n</user_message>\``)
rather than being concatenated as a bare user-role message with no boundary marker.
*Alignment check:* confirmed the two AI-driven actions capable of writing data —
`handleAddSlotCommand` (admin's "add slot" chat command) and the booking-suggestion flow — are
both already deterministic/regex- or DB-query-driven rather than trusting raw model output for
the actual mutation, so this delimiting closes the "extract the system prompt / change my
role" style of injection without needing to re-architect anything already safe by construction.
This is explicitly a best-effort mitigation, not a guarantee — LLM prompt injection has no
complete technical fix — which is why the report itself correctly scopes it as "Potential Risk"
rather than a confirmed exploitable vulnerability. *Re-verification:* `tsc --noEmit` passes
clean.

---

# Appendix — Requests implemented outside the original VAPT scope

The following two changes were requested mid-implementation and are not part of the VAPT
findings above, but are documented here for the same traceability reasons.

## No Sunday bookings

**Request:** no meetings may be scheduled on Sundays; Sunday should not be selectable, or
should prompt clearly if somehow attempted.

**Implemented:** `src/components/UI/MonthDatePicker.tsx` now disables Sunday day cells and
Sunday-landing quick-select buttons (Today/Tomorrow/etc.) outright, and additionally shows an
explicit alert if a Sunday is somehow selected (defense in depth within the component itself).
The authoritative check lives server-side in `POST /api/slots`
(`src/app/api/slots/route.ts`): any slot dated on a Sunday is rejected with a clear error
message before any database write, closing the gap a direct API call could otherwise exploit
even with the UI disabled. *Verification:* ran the day-of-week detection logic against real
November 2026 dates — correctly identified Nov 1 and Nov 8 (both genuine Sundays) as blocked
and Nov 2/Nov 7 as allowed; `tsc --noEmit` and a full production build both pass clean.

## Relocate the Oral Exam toggle

**Request:** move the Oral Exam enable/disable toggle from the admin dashboard to the top of
the Add Slots page.

**Implemented:** removed `<OralExamToggle />` from `src/components/Admin/AdminView.tsx`
(dashboard) and added it to the top of `src/app/admin/add-slots/page.tsx`, directly beneath the
page heading and above the slot-creation form — the component itself was unchanged, only its
placement.

---

# Summary Table

| Phase | Finding IDs | Theme |
|---|---|---|
| 1 — Critical | VAPT-01, VAPT-11, VAPT-18(ii) | Leaked credentials; two live functional bugs |
| 2 — High | VAPT-02, VAPT-05, VAPT-06, VAPT-10, VAPT-03, VAPT-04 | Upload hardening, route auth, injection fixes |
| 3 — Medium | VAPT-07, VAPT-08, VAPT-09, VAPT-12, VAPT-13, VAPT-14 | Auth gaps, dependency hygiene, headers |
| 4 — Lower priority | VAPT-15, VAPT-16, VAPT-17, VAPT-18(i) | Hardening and operational improvements |
