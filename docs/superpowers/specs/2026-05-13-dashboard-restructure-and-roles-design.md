# Dashboard Restructure & Role System Design

**Goal:** Add a public-facing website with skeleton pages, move the existing member app under `/dashboard/`, and introduce a flexible permissions-map-based role system starting with `admin`, `member`, and `pledge`.

**Architecture:** The public site and dashboard are cleanly separated by route structure. Public pages live under `app/(public)/` and require no auth. The dashboard lives under `app/dashboard/` and is gated by an auth layout. Roles are seeded via the existing `allowedEmails` Firestore collection and stored on the member document; all permission logic is centralized in a single `lib/roles.ts` file using a permissions map.

**Tech Stack:** Next.js App Router, Firebase Auth + Firestore, TypeScript

---

## 1. Route Structure

### Public Site

Skeleton pages only — no components, no data fetching, no styling beyond what already exists globally. These are placeholders for a future design pass.

```
app/
  (public)/
    layout.tsx          # bare shell, renders children only
    page.tsx            # / — home
    about/
      page.tsx          # /about
    brothers/
      page.tsx          # /brothers
    rush/
      page.tsx          # /rush
    contact/
      page.tsx          # /contact
```

### Dashboard

The existing `app/(auth)/` route group is replaced by `app/dashboard/`. The route group disappears — `dashboard` is now an explicit URL segment.

```
app/
  dashboard/
    layout.tsx          # auth gate + Navbar (replaces app/(auth)/layout.tsx)
    announcements/
      page.tsx          # /dashboard/announcements
    events/
      page.tsx          # /dashboard/events
    members/
      page.tsx          # /dashboard/members
    gallery/
      page.tsx          # /dashboard/gallery
    family-tree/
      page.tsx          # /dashboard/family-tree
    profile/
      page.tsx          # /dashboard/profile
```

### Unchanged

```
app/
  login/
    page.tsx            # /login — stays as-is
  layout.tsx            # root layout — unchanged
  icon.tsx              # unchanged
```

### Root page

`app/page.tsx` is deleted. `app/(public)/page.tsx` takes over the `/` route — Next.js route groups don't add URL segments, so it maps cleanly to `/`. Having both files would cause a build conflict.

---

## 2. Role System

### Firestore — `allowedEmails` collection

Each document (keyed by lowercase email) gains a `role` field:

```
allowedEmails/{email@uw.edu}  →  { role: "admin" | "member" | "pledge" }
```

Adding a new role in the future requires only seeding new documents with the new role string — no code changes to the data layer.

### `types/member.ts`

Replace `isAdmin: boolean` with `siteRole: string`. Using a plain `string` rather than a union type means adding a new role never requires touching the type definition.

```typescript
// Remove:
isAdmin: boolean;

// Add:
siteRole: string;
```

### `lib/firestore.ts`

`isEmailAllowed` is renamed and its return type changes:

```typescript
// Before:
export async function isEmailAllowed(email: string): Promise<boolean>

// After:
export async function getAllowedRole(email: string): Promise<string | null>
// Returns the role string if email is on the allowlist, null if not.
```

The `memberFromDoc` converter replaces `isAdmin: d.isAdmin ?? false` with `siteRole: d.siteRole ?? 'member'`.

### `lib/auth.tsx`

- Calls `getAllowedRole` instead of `isEmailAllowed` during sign-in
- If role is `null`, signs the user out and throws (same behavior as today for unlisted emails)
- After successful auth, the role is available via `member.siteRole` — no new context fields needed
- Post-login redirect changes from `/announcements` to `/dashboard/announcements`

### `lib/roles.ts` — new file

The only place permission logic lives. All components import from here.

```typescript
const PERMISSIONS: Record<string, Set<string>> = {
  admin: new Set([
    'post:announcement',
    'post:event',
    'manage:gallery',
    'manage:users',     // reserved for future admin UI
  ]),
  member: new Set([]),
  pledge: new Set([]),
};

export function can(member: Member, action: string): boolean {
  return PERMISSIONS[member.siteRole]?.has(action) ?? false;
}

// Convenience helper for layout-level checks that don't map to a specific action
export function isAdmin(member: Member): boolean {
  return member.siteRole === 'admin';
}
```

**Extending roles:** add a new key to `PERMISSIONS`. **Adding a capability to a role:** add one string to that role's `Set`. **Auditing what a role can do:** one glance at the map.

---

## 3. Access Control

### Dashboard layout auth gate (`app/dashboard/layout.tsx`)

Same logic as the current `app/(auth)/layout.tsx` with one addition — role check:

```
authenticated + role exists (admin | member | pledge) → render dashboard
authenticated + role is null (not on allowlist)       → redirect /login
not authenticated                                     → redirect /login
authenticated + no member profile doc                 → redirect /dashboard/profile
```

All three roles currently land in the same dashboard shell. The pledge-specific section is deferred — pledges see the same layout as members for now but with no role-specific content yet.

### Navbar (`components/Navbar.tsx`)

- All nav hrefs update: `/announcements` → `/dashboard/announcements`, etc.
- Logo link changes from `/announcements` to `/` (public home)

### Component-level permission checks

Four spots in the codebase swap `member?.isAdmin` for `can(member, action)`:

| Component | Old check | New check |
|---|---|---|
| `CreateAnnouncementModal` trigger | `member?.isAdmin` | `can(member, 'post:announcement')` |
| `EventFormModal` trigger | `member?.isAdmin` | `can(member, 'post:event')` |
| Gallery shuffle button | `member?.isAdmin` | `can(member, 'manage:gallery')` |
| Gallery delete button | `member?.isAdmin` | `can(member, 'manage:gallery')` |

No other component logic changes.

### Post-login redirect

After successful sign-in, auth redirects to `/dashboard/announcements` for all roles. When the pledge dashboard is built, this becomes:

```typescript
const destination = member.siteRole === 'pledge'
  ? '/dashboard/pledge'
  : '/dashboard/announcements';
```

---

## 4. Data Migration

A one-off script at `scripts/migrate-roles.ts` handles both collections. Run before deploying the new code.

### `allowedEmails` collection

Script defaults all existing documents to `role: "member"`. Admin emails must be manually identified and set to `role: "admin"` before or after running the script.

### `users` collection

Script derives `siteRole` from the existing `isAdmin` field and removes it:

```
isAdmin: true   →  siteRole: "admin",  delete isAdmin field
isAdmin: false  →  siteRole: "member", delete isAdmin field
```

### Deployment order

1. Run `scripts/migrate-roles.ts` (Firestore data in new shape)
2. Deploy new code (reads `siteRole`, calls `getAllowedRole`)

Deploying code before migrating data would bounce all members (no `siteRole` field → role check fails → redirect to login).

---

## 5. Scope Boundaries

### In scope
- Moving `app/(auth)/` pages to `app/dashboard/`
- Deleting `app/page.tsx` (the old login redirect)
- 5 skeleton public pages under `app/(public)/` (home replaces the deleted root page)
- `siteRole` field replacing `isAdmin` on `Member` type
- `getAllowedRole` replacing `isEmailAllowed` in Firestore helpers
- `lib/roles.ts` with permissions map
- Navbar href updates
- 4 component permission check swaps
- `scripts/migrate-roles.ts`
- Firestore document backfill

### Explicitly out of scope
- Pledge dashboard content or tooling
- Admin UI for managing user roles (deferred — roles managed via Firestore console for now)
- Public site content, design, or data fetching (skeleton only)
- Firebase Custom Claims (potential future upgrade if a backend is added)
- Firestore Security Rules update (follow-up task — rules still reference `isAdmin`)
- Any new dashboard features or UI changes
