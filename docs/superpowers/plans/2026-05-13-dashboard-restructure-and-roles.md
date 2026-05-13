# Dashboard Restructure & Role System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the member app under `/dashboard/`, add a skeleton public site, and replace the binary `isAdmin` flag with a permissions-map role system (`admin`, `member`, `pledge`).

**Architecture:** Tasks flow in dependency order: test infra → roles lib → type changes → Firestore/auth → routing → public site → components. Each task is independently committable. The permissions map in `lib/roles.ts` becomes the single source of truth for all access control.

**Tech Stack:** Next.js 16 App Router, Firebase Auth + Firestore, TypeScript, Vitest

---

## File Map

### Created
- `vitest.config.ts` — Vitest configuration with `@/` alias
- `lib/roles.ts` — permissions map, `can()`, `isAdmin()`
- `lib/__tests__/roles.test.ts` — unit tests for roles
- `app/(public)/layout.tsx` — bare public layout shell
- `app/(public)/page.tsx` — skeleton home page at `/`
- `app/(public)/about/page.tsx` — skeleton `/about`
- `app/(public)/brothers/page.tsx` — skeleton `/brothers`
- `app/(public)/rush/page.tsx` — skeleton `/rush`
- `app/(public)/contact/page.tsx` — skeleton `/contact`
- `app/dashboard/layout.tsx` — auth gate + Navbar (replaces `app/(auth)/layout.tsx`)
- `app/dashboard/announcements/page.tsx` — moved from `app/(auth)/announcements/page.tsx`
- `app/dashboard/events/page.tsx` — moved from `app/(auth)/events/page.tsx`
- `app/dashboard/members/page.tsx` — moved from `app/(auth)/members/page.tsx`
- `app/dashboard/gallery/page.tsx` — moved from `app/(auth)/gallery/page.tsx`
- `app/dashboard/family-tree/page.tsx` — moved from `app/(auth)/family-tree/page.tsx`
- `app/dashboard/profile/page.tsx` — moved from `app/(auth)/profile/page.tsx`
- `scripts/migrate-roles.ts` — one-off Firestore migration script

### Modified
- `package.json` — add `test` and `test:watch` scripts
- `types/member.ts` — `isAdmin: boolean` → `siteRole: string`
- `lib/mock-data.ts` — replace all `isAdmin` fields with `siteRole`
- `lib/firestore.ts` — `isEmailAllowed` → `getAllowedRole`, update `memberFromDoc`
- `lib/auth.tsx` — use `getAllowedRole`, update error handling
- `app/login/page.tsx` — redirect target `/announcements` → `/dashboard/announcements`
- `components/Navbar.tsx` — update hrefs, logo link
- `components/events/EventsFeed.tsx` — derive admin status from `lib/roles`
- `components/profile/ProfileForm.tsx` — preserve `siteRole` not `isAdmin` on save

### Deleted
- `app/(auth)/layout.tsx`
- `app/(auth)/announcements/page.tsx`
- `app/(auth)/events/page.tsx`
- `app/(auth)/members/page.tsx`
- `app/(auth)/gallery/page.tsx`
- `app/(auth)/family-tree/page.tsx`
- `app/(auth)/profile/page.tsx`
- `app/page.tsx` — old redirect-to-login root

### Also modified (scripts/seed-member.ts)
- `scripts/seed-member.ts:168` — `isAdmin: false` → `siteRole: 'member'`

---

## Task 1: Vitest Setup

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest @vitest/coverage-v8
```

Expected: vitest appears in `package.json` devDependencies.

- [ ] **Step 2: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 3: Add test scripts to `package.json`**

Find the `"scripts"` block in `package.json` and add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify Vitest works**

Create a throwaway test to confirm the setup runs:

```bash
echo "import { expect, it } from 'vitest'; it('setup', () => expect(1).toBe(1));" > lib/__tests__/setup.test.ts
npm test
```

Expected output: `✓ lib/__tests__/setup.test.ts > setup`

- [ ] **Step 5: Delete the throwaway test**

```bash
rm lib/__tests__/setup.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add Vitest for unit testing"
```

---

## Task 2: `lib/roles.ts` — Permissions Map (TDD)

**Files:**
- Create: `lib/__tests__/roles.test.ts`
- Create: `lib/roles.ts`

> **Context:** `types/member.ts` currently has `isAdmin: boolean`. Task 3 replaces it with `siteRole: string`. Write the test using `siteRole` now — it will fail until Task 3 lands. That is intentional: we are writing tests for the shape we're building toward.

- [ ] **Step 1: Create the test directory**

```bash
mkdir -p lib/__tests__
```

- [ ] **Step 2: Write the failing tests**

Create `lib/__tests__/roles.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { can, isAdmin } from '@/lib/roles'
import type { Member } from '@/types/member'

function makeMember(siteRole: string): Member {
  return {
    uid: 'test-uid',
    firstName: 'Test',
    lastName: 'User',
    preferredName: null,
    profilePhotoUrl: null,
    pledgeClassQuarter: 'Fall',
    pledgeClassYear: 2024,
    status: 'active',
    role: null,
    familyId: null,
    familyName: null,
    bigUid: null,
    bigName: null,
    major: 'CS',
    graduationYear: 2026,
    email: 'test@uw.edu',
    phone: null,
    preferredContact: null,
    socialLinks: [],
    bio: null,
    industries: [],
    joinedAt: new Date(),
    lastActive: new Date(),
    siteRole,
  }
}

describe('can', () => {
  it('returns true for admin with a known action', () => {
    expect(can(makeMember('admin'), 'post:announcement')).toBe(true)
  })

  it('returns true for admin with post:event', () => {
    expect(can(makeMember('admin'), 'post:event')).toBe(true)
  })

  it('returns true for admin with manage:gallery', () => {
    expect(can(makeMember('admin'), 'manage:gallery')).toBe(true)
  })

  it('returns false for member with admin action', () => {
    expect(can(makeMember('member'), 'post:announcement')).toBe(false)
  })

  it('returns false for pledge with admin action', () => {
    expect(can(makeMember('pledge'), 'post:event')).toBe(false)
  })

  it('returns false for unknown role', () => {
    expect(can(makeMember('unknown'), 'post:announcement')).toBe(false)
  })

  it('returns false for known role with unknown action', () => {
    expect(can(makeMember('admin'), 'unknown:action')).toBe(false)
  })
})

describe('isAdmin', () => {
  it('returns true for admin', () => {
    expect(isAdmin(makeMember('admin'))).toBe(true)
  })

  it('returns false for member', () => {
    expect(isAdmin(makeMember('member'))).toBe(false)
  })

  it('returns false for pledge', () => {
    expect(isAdmin(makeMember('pledge'))).toBe(false)
  })
})
```

- [ ] **Step 3: Run tests — confirm they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module '@/lib/roles'`

- [ ] **Step 4: Create `lib/roles.ts`**

```typescript
// lib/roles.ts — Permissions map and role helpers.
// Single source of truth for what each siteRole can do in the dashboard.
// To add a new role: add a key to PERMISSIONS.
// To add a capability to a role: add an action string to that role's Set.
import type { Member } from '@/types/member'

const PERMISSIONS: Record<string, Set<string>> = {
  admin: new Set([
    'post:announcement',
    'post:event',
    'manage:gallery',
    'manage:users',
  ]),
  member: new Set([]),
  pledge: new Set([]),
}

export function can(member: Member, action: string): boolean {
  return PERMISSIONS[member.siteRole]?.has(action) ?? false
}

export function isAdmin(member: Member): boolean {
  return member.siteRole === 'admin'
}
```

- [ ] **Step 5: Run tests — they will still fail because `Member` has no `siteRole` yet**

```bash
npm test
```

Expected: TypeScript error — `Object literal may only specify known properties, and 'siteRole' does not exist in type 'Member'`

This is correct — the type change lands in Task 3. Leave the test file as-is.

- [ ] **Step 6: Commit**

```bash
git add lib/roles.ts lib/__tests__/roles.test.ts
git commit -m "feat: add roles permissions map with can() and isAdmin() helpers"
```

---

## Task 3: Update Type Definitions and Mock Data

**Files:**
- Modify: `types/member.ts:41`
- Modify: `lib/mock-data.ts` (lines 122, 150, 178, 206, 232, 261, 287, 316, 344, 372, 398, 426)
- Modify: `scripts/seed-member.ts:168`

- [ ] **Step 1: Replace `isAdmin` with `siteRole` in `types/member.ts`**

In `types/member.ts`, find line 41 and replace:

```typescript
// Remove:
  isAdmin: boolean;

// Add:
  siteRole: string;
```

The full field in context looks like:
```typescript
  joinedAt: Date;
  lastActive: Date;
  siteRole: string;
}
```

- [ ] **Step 2: Run Vitest — roles tests should now pass**

```bash
npm test
```

Expected: All 10 tests in `lib/__tests__/roles.test.ts` pass. TypeScript errors elsewhere are expected (mock-data, firestore, etc.) — those are fixed next.

- [ ] **Step 3: Update `lib/mock-data.ts`**

Find every occurrence of `isAdmin: true` and `isAdmin: false` (lines 122, 150, 178, 206, 232, 261, 287, 316, 344, 372, 398, 426) and replace:

```typescript
// isAdmin: true  →
siteRole: 'admin',

// isAdmin: false  →
siteRole: 'member',
```

There are exactly 2 `isAdmin: true` entries (lines 122 and 150) and 10 `isAdmin: false` entries. Use find-and-replace:
- `isAdmin: true,` → `siteRole: 'admin',`
- `isAdmin: false,` → `siteRole: 'member',`

- [ ] **Step 4: Update `scripts/seed-member.ts`**

In `scripts/seed-member.ts` at line 168, replace:

```typescript
// Remove:
    isAdmin: false,

// Add:
    siteRole: 'member',
```

- [ ] **Step 5: Verify TypeScript — only expected errors remain**

```bash
npx tsc --noEmit
```

Expected errors at this point: `lib/firestore.ts` (still reads `isAdmin`), `lib/auth.tsx` (still calls `isEmailAllowed`), `components/events/EventsFeed.tsx` (still reads `member?.isAdmin`), `components/profile/ProfileForm.tsx` (still sets `isAdmin`). All other files should be clean.

- [ ] **Step 6: Commit**

```bash
git add types/member.ts lib/mock-data.ts scripts/seed-member.ts
git commit -m "feat: replace isAdmin boolean with siteRole string on Member type"
```

---

## Task 4: Update `lib/firestore.ts`

**Files:**
- Modify: `lib/firestore.ts`

Two changes: rename `isEmailAllowed` to `getAllowedRole` with new return type, and update `memberFromDoc`.

- [ ] **Step 1: Replace `isEmailAllowed` with `getAllowedRole`**

In `lib/firestore.ts`, find the `isEmailAllowed` function (around line 214) and replace the entire function:

```typescript
// Remove:
/** Returns true if the email exists in the AKPsi-approved allowlist. */
export async function isEmailAllowed(email: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "allowedEmails", email.toLowerCase()));
  return snap.exists();
}

// Add:
/** Returns the siteRole for the email if it exists in the allowlist, null otherwise. */
export async function getAllowedRole(email: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "allowedEmails", email.toLowerCase()));
  if (!snap.exists()) return null;
  return (snap.data().role as string) ?? 'member';
}
```

- [ ] **Step 2: Update `memberFromDoc` converter**

In `lib/firestore.ts`, find the `memberFromDoc` function and replace line 98:

```typescript
// Remove:
    isAdmin: d.isAdmin ?? false,

// Add:
    siteRole: d.siteRole ?? 'member',
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected remaining errors: `lib/auth.tsx` (calls `isEmailAllowed`), `components/events/EventsFeed.tsx`, `components/profile/ProfileForm.tsx`.

- [ ] **Step 4: Commit**

```bash
git add lib/firestore.ts
git commit -m "feat: rename isEmailAllowed to getAllowedRole, return role string or null"
```

---

## Task 5: Update `lib/auth.tsx`

**Files:**
- Modify: `lib/auth.tsx`

Replace `isEmailAllowed` with `getAllowedRole` in both the `onAuthStateChanged` handler and the `signInWithGoogle` function.

- [ ] **Step 1: Update the `onAuthStateChanged` handler**

In `lib/auth.tsx`, find the `onAuthStateChanged` callback (around line 69) and replace the allowlist check:

```typescript
// Remove:
          const domainOk = email.endsWith(`@${ALLOWED_DOMAIN}`);
          const allowed = domainOk && (await isEmailAllowed(email));

          if (!domainOk || !allowed) {

// Add:
          const domainOk = email.endsWith(`@${ALLOWED_DOMAIN}`);
          const role = domainOk ? await getAllowedRole(email) : null;

          if (!domainOk || !role) {
```

- [ ] **Step 2: Update the `signInWithGoogle` function**

In `lib/auth.tsx`, find the `signInWithGoogle` function (around line 98) and replace the allowlist check:

```typescript
// Remove:
    const allowed = await isEmailAllowed(email);
    if (!allowed) {
      await firebaseSignOut(auth);
      throw new Error("Your email is not on the AKPsi member list. Contact an officer to get access.");
    }

// Add:
    const role = await getAllowedRole(email);
    if (!role) {
      await firebaseSignOut(auth);
      throw new Error("Your email is not on the AKPsi member list. Contact an officer to get access.");
    }
```

- [ ] **Step 3: Update the import**

At the top of `lib/auth.tsx`, replace the import:

```typescript
// Remove:
import { getMember, isEmailAllowed } from "@/lib/firestore";

// Add:
import { getMember, getAllowedRole } from "@/lib/firestore";
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected remaining errors: `components/events/EventsFeed.tsx`, `components/profile/ProfileForm.tsx`.

- [ ] **Step 5: Commit**

```bash
git add lib/auth.tsx
git commit -m "feat: use getAllowedRole in auth, remove isEmailAllowed dependency"
```

---

## Task 6: Update Login Page Redirect

**Files:**
- Modify: `app/login/page.tsx`

The login page has `/announcements` hardcoded in two places.

- [ ] **Step 1: Update both redirect targets**

In `app/login/page.tsx`, replace both occurrences of `"/announcements"`:

```typescript
// Line 31 — useEffect redirect for already-authenticated users:
// Remove:
    if (user) router.replace("/announcements");
// Add:
    if (user) router.replace("/dashboard/announcements");

// Line 49 — post sign-in redirect:
// Remove:
      router.replace("/announcements");
// Add:
      router.replace("/dashboard/announcements");
```

- [ ] **Step 2: Update the file header comment**

```typescript
// Remove:
// Login page — Google sign-in restricted to @uw.edu accounts.
// Redirects authenticated users to /announcements.

// Add:
// Login page — Google sign-in restricted to @uw.edu accounts.
// Redirects authenticated users to /dashboard/announcements.
```

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx
git commit -m "fix: update login redirect from /announcements to /dashboard/announcements"
```

---

## Task 7: Route Restructure — Create `app/dashboard/`

**Files:**
- Create: `app/dashboard/layout.tsx`
- Create: `app/dashboard/announcements/page.tsx`
- Create: `app/dashboard/events/page.tsx`
- Create: `app/dashboard/members/page.tsx`
- Create: `app/dashboard/gallery/page.tsx`
- Create: `app/dashboard/family-tree/page.tsx`
- Create: `app/dashboard/profile/page.tsx`
- Delete: all of `app/(auth)/`

- [ ] **Step 1: Create the dashboard directory structure**

```bash
mkdir -p app/dashboard/announcements app/dashboard/events app/dashboard/members app/dashboard/gallery app/dashboard/family-tree app/dashboard/profile
```

- [ ] **Step 2: Create `app/dashboard/layout.tsx`**

This is the auth gate. It is identical to `app/(auth)/layout.tsx` except both `/profile` references change to `/dashboard/profile`:

```tsx
// Auth-gated layout — wraps all routes under app/dashboard/.
// Redirects unauthenticated users to /login; redirects users without a profile to /dashboard/profile.
"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AnnouncementsProvider } from "@/lib/announcements-context";
import { GalleryProvider } from "@/lib/gallery-context";
import { EventsProvider } from "@/lib/events-context";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, member, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!member && pathname !== "/dashboard/profile") {
      router.replace("/dashboard/profile");
    }
  }, [user, member, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AnnouncementsProvider>
      <GalleryProvider>
        <EventsProvider>
          <Navbar />
          {children}
        </EventsProvider>
      </GalleryProvider>
    </AnnouncementsProvider>
  );
}
```

- [ ] **Step 3: Copy page files**

Read each `app/(auth)/*/page.tsx` and create the corresponding `app/dashboard/*/page.tsx` with identical content. The pages are thin wrappers — no changes needed to their content.

```bash
cp "app/(auth)/announcements/page.tsx" app/dashboard/announcements/page.tsx
cp "app/(auth)/events/page.tsx" app/dashboard/events/page.tsx
cp "app/(auth)/members/page.tsx" app/dashboard/members/page.tsx
cp "app/(auth)/gallery/page.tsx" app/dashboard/gallery/page.tsx
cp "app/(auth)/family-tree/page.tsx" app/dashboard/family-tree/page.tsx
cp "app/(auth)/profile/page.tsx" app/dashboard/profile/page.tsx
```

- [ ] **Step 4: Delete the old `app/(auth)/` directory**

```bash
rm -r "app/(auth)"
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected remaining errors: `components/events/EventsFeed.tsx`, `components/profile/ProfileForm.tsx`.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard app/
git commit -m "feat: move dashboard pages from app/(auth)/ to app/dashboard/"
```

---

## Task 8: Public Site Skeleton

**Files:**
- Create: `app/(public)/layout.tsx`
- Create: `app/(public)/page.tsx`
- Create: `app/(public)/about/page.tsx`
- Create: `app/(public)/brothers/page.tsx`
- Create: `app/(public)/rush/page.tsx`
- Create: `app/(public)/contact/page.tsx`
- Delete: `app/page.tsx`

- [ ] **Step 1: Create the public directory structure**

```bash
mkdir -p "app/(public)/about" "app/(public)/brothers" "app/(public)/rush" "app/(public)/contact"
```

- [ ] **Step 2: Create `app/(public)/layout.tsx`**

```tsx
// Public layout — shell for all unauthenticated public-facing pages.
// No auth required. Styled content added in a future design pass.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 3: Create `app/(public)/page.tsx`** (replaces the deleted `app/page.tsx`)

```tsx
// Home page — public landing page for the AKPsi UW chapter.
// Skeleton placeholder. Full design coming in a future pass.
export default function HomePage() {
  return (
    <main>
      <h1>Alpha Kappa Psi — University of Washington</h1>
    </main>
  );
}
```

- [ ] **Step 4: Create `app/(public)/about/page.tsx`**

```tsx
// About page — chapter history, values, and mission.
// Skeleton placeholder. Full design coming in a future pass.
export default function AboutPage() {
  return (
    <main>
      <h1>About</h1>
    </main>
  );
}
```

- [ ] **Step 5: Create `app/(public)/brothers/page.tsx`**

```tsx
// Brothers page — public-facing showcase of chapter members.
// Skeleton placeholder. Full design coming in a future pass.
export default function BrothersPage() {
  return (
    <main>
      <h1>Brothers</h1>
    </main>
  );
}
```

- [ ] **Step 6: Create `app/(public)/rush/page.tsx`**

```tsx
// Rush page — recruitment information and events.
// Skeleton placeholder. Full design coming in a future pass.
export default function RushPage() {
  return (
    <main>
      <h1>Rush</h1>
    </main>
  );
}
```

- [ ] **Step 7: Create `app/(public)/contact/page.tsx`**

```tsx
// Contact page — chapter contact information and inquiry form.
// Skeleton placeholder. Full design coming in a future pass.
export default function ContactPage() {
  return (
    <main>
      <h1>Contact</h1>
    </main>
  );
}
```

- [ ] **Step 8: Delete `app/page.tsx`**

```bash
rm app/page.tsx
```

`app/(public)/page.tsx` now owns the `/` route. Next.js resolves route groups without adding URL segments, so there is no conflict.

- [ ] **Step 9: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected remaining errors: `components/events/EventsFeed.tsx`, `components/profile/ProfileForm.tsx`.

- [ ] **Step 10: Commit**

```bash
git add "app/(public)" app/
git commit -m "feat: add skeleton public site (home, about, brothers, rush, contact)"
```

---

## Task 9: Update `components/Navbar.tsx`

**Files:**
- Modify: `components/Navbar.tsx`

Two changes: update the 5 nav hrefs and update the logo link.

- [ ] **Step 1: Update `NAV_ITEMS` hrefs**

In `components/Navbar.tsx`, find the `NAV_ITEMS` array (around line 29) and replace all hrefs:

```typescript
const NAV_ITEMS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
  { label: "Events", href: "/dashboard/events", icon: CalendarDays },
  { label: "Directory", href: "/dashboard/members", icon: Users },
  { label: "Gallery", href: "/dashboard/gallery", icon: Images },
  { label: "Family Tree", href: "/dashboard/family-tree", icon: GitBranch },
];
```

- [ ] **Step 2: Update the logo link**

In `components/Navbar.tsx`, find the logo `Link` (around line 59) and change its `href`:

```tsx
// Remove:
        <Link href="/announcements" className="flex items-center gap-2.5 no-underline shrink-0">

// Add:
        <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0">
```

- [ ] **Step 3: Update the `active` check**

The `active` check uses `pathname.startsWith(href)`. With the new hrefs including `/dashboard/`, this still works correctly — no change needed.

- [ ] **Step 4: Update the avatar dropdown profile link**

In `components/Navbar.tsx`, find the profile `DropdownMenuItem` (around line 135) and update its push target:

```tsx
// Remove:
              onClick={() => router.push("/profile")}

// Add:
              onClick={() => router.push("/dashboard/profile")}
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected remaining errors: `components/events/EventsFeed.tsx`, `components/profile/ProfileForm.tsx`.

- [ ] **Step 6: Commit**

```bash
git add components/Navbar.tsx
git commit -m "feat: update Navbar hrefs to /dashboard/* and logo to public home"
```

---

## Task 10: Update Components Using `isAdmin`

**Files:**
- Modify: `components/events/EventsFeed.tsx:28`
- Modify: `components/profile/ProfileForm.tsx:161`

- [ ] **Step 1: Update `components/events/EventsFeed.tsx`**

Add the import at the top of the file (after existing imports):

```typescript
import { isAdmin } from "@/lib/roles";
```

Then find line 28 and replace:

```typescript
// Remove:
  const isAdmin = member?.isAdmin ?? false;

// Add:
  const adminUser = member ? isAdmin(member) : false;
```

Then find the `sharedViewProps` object (around line 42) and update the `isAdmin` key:

```typescript
  const sharedViewProps = {
    events,
    currentUserUid: user?.uid ?? null,
    isAdmin: adminUser,
    onEdit: (ev: Event) => setFormTarget(ev),
    onDelete: handleDelete,
  };
```

- [ ] **Step 2: Update `components/profile/ProfileForm.tsx`**

In `components/profile/ProfileForm.tsx`, find line 161 and replace:

```typescript
// Remove:
        isAdmin: existing?.isAdmin ?? false,

// Add:
        siteRole: existing?.siteRole ?? 'member',
```

- [ ] **Step 3: Verify TypeScript — no errors remain**

```bash
npx tsc --noEmit
```

Expected: clean output, zero errors.

- [ ] **Step 4: Run Vitest — all tests pass**

```bash
npm test
```

Expected: all 10 role tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/events/EventsFeed.tsx components/profile/ProfileForm.tsx
git commit -m "feat: replace isAdmin field reads with role helpers from lib/roles"
```

---

## Task 11: Data Migration Script

**Files:**
- Create: `scripts/migrate-roles.ts`

This script runs once before deploying. It updates both Firestore collections.

> **Before running:** Identify which email addresses should be `admin` and edit the `ADMIN_EMAILS` set at the top of the script. Your own email should be in this set.

- [ ] **Step 1: Check how existing scripts are run**

Read `scripts/seed-member.ts` line 1 to see its shebang and import style, then match the pattern.

- [ ] **Step 2: Create `scripts/migrate-roles.ts`**

```typescript
// One-off migration: add siteRole to allowedEmails docs and replace isAdmin with siteRole on users docs.
// Run ONCE before deploying the role-aware code: npx ts-node --esm scripts/migrate-roles.ts
// IMPORTANT: Add your admin email addresses to ADMIN_EMAILS before running.
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc, deleteField } from "firebase/firestore";

// ─── EDIT THIS before running ─────────────────────────────────────────────────
const ADMIN_EMAILS: Set<string> = new Set([
  // "youremail@uw.edu",
]);
// ──────────────────────────────────────────────────────────────────────────────

// Paste your Firebase config here (same values as in lib/firebase.ts)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateAllowedEmails() {
  const snap = await getDocs(collection(db, "allowedEmails"));
  let updated = 0;
  for (const docSnap of snap.docs) {
    const email = docSnap.id.toLowerCase();
    const role = ADMIN_EMAILS.has(email) ? "admin" : "member";
    await updateDoc(doc(db, "allowedEmails", docSnap.id), { role });
    console.log(`  allowedEmails/${docSnap.id} → role: ${role}`);
    updated++;
  }
  console.log(`allowedEmails: ${updated} documents updated`);
}

async function migrateUsers() {
  const snap = await getDocs(collection(db, "users"));
  let updated = 0;
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if ("isAdmin" in data) {
      const siteRole = data.isAdmin === true ? "admin" : "member";
      await updateDoc(doc(db, "users", docSnap.id), {
        siteRole,
        isAdmin: deleteField(),
      });
      console.log(`  users/${docSnap.id} → siteRole: ${siteRole}, removed isAdmin`);
      updated++;
    }
  }
  console.log(`users: ${updated} documents updated`);
}

async function main() {
  console.log("Starting migration...");
  console.log("\nMigrating allowedEmails collection:");
  await migrateAllowedEmails();
  console.log("\nMigrating users collection:");
  await migrateUsers();
  console.log("\nMigration complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
```

- [ ] **Step 3: Commit the script (do not run it yet)**

```bash
git add scripts/migrate-roles.ts
git commit -m "chore: add migrate-roles script for isAdmin → siteRole Firestore migration"
```

- [ ] **Step 4: Run the migration (when ready to deploy)**

Before running, ensure:
1. You have added your admin email(s) to `ADMIN_EMAILS` in the script
2. Firebase environment variables are available (e.g. via `.env.local`)

```bash
npx ts-node --esm scripts/migrate-roles.ts
```

Expected output:
```
Starting migration...

Migrating allowedEmails collection:
  allowedEmails/youremail@uw.edu → role: admin
  allowedEmails/somebrother@uw.edu → role: member
  ...
allowedEmails: N documents updated

Migrating users collection:
  users/uid123 → siteRole: admin, removed isAdmin
  users/uid456 → siteRole: member, removed isAdmin
  ...
users: N documents updated

Migration complete.
```

---

## Final Verification

- [ ] **Run all tests**

```bash
npm test
```

Expected: all 10 role tests pass.

- [ ] **Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Start dev server and manually verify**

```bash
npm run dev
```

Check:
1. `http://localhost:3000` — renders the public home page (not a redirect)
2. `http://localhost:3000/about` — renders the about skeleton
3. `http://localhost:3000/dashboard/announcements` — redirects to `/login` if not authenticated
4. After login — lands on `/dashboard/announcements`
5. Navbar logo links to `/`
6. Navbar "My Profile" links to `/dashboard/profile`
7. Old URLs like `/announcements` return 404 (correct — they no longer exist)
