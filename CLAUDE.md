# akpsi-app

A web app for the Alpha Kappa Psi (AKPsi) chapter at UW. Built for members, officers, and pledges to stay connected and organized.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19 and TypeScript
- **UI:** MUI v7 (`@mui/material`) for components, Tailwind CSS 4 for layout/spacing utilities
- **Backend:** Firebase (Auth, Firestore, Storage, Hosting)
- **Styling approach:** Use MUI's `sx` prop and theme system for component styling. Use Tailwind only for layout utilities (flex, grid, padding, margin, responsive breakpoints).

## Project Structure

```
app/                    # Next.js App Router pages
  (auth)/               # Auth-gated layout group
    announcements/      # Announcements page
    members/            # Member registry
    family-tree/        # Family tree (future)
  login/                # Public login page
  layout.tsx            # Root layout with MUI ThemeProvider
  page.tsx              # Redirect to /announcements or /login
components/             # Reusable React components
lib/                    # Utilities, Firebase config, hooks
  firebase.ts           # Firebase app initialization
  auth.ts               # Auth helpers and context
  firestore.ts          # Firestore helpers
theme/                  # MUI theme configuration
types/                  # TypeScript type definitions
```

## MVP Features

### 1. Announcements Page
- Members can post announcements (title, body, timestamp, author)
- Future: Slack channel integration to auto-pull announcements
- Stored in Firestore `announcements` collection

### 2. Member Registry
- Self-supplied member profiles with: name, major, sub-concentration, year, big (mentor), pledge class, phone, email
- Members control which contact info is visible to others
- Stored in Firestore `members` collection

### 3. Family Tree (future)
- Visual "family tree" showing big/little relationships across pledge classes
- Placeholder in nav only — no implementation yet

## Authentication

- Firebase Auth with Google sign-in, restricted to UW email domain (@uw.edu)
- Cross-check authenticated email against approved members list (Firestore)
- Unauthenticated users see login page only
- Future: officer vs member roles for posting permissions

## Conventions

### General
- Use `"use client"` only when components need interactivity; prefer Server Components
- All Firebase client calls go through helpers in `lib/`
- One component per file, named exports, PascalCase filenames for components
- Keep pages thin — delegate logic to components and hooks

### MUI + Tailwind Styling
- Use MUI components for all interactive UI (Button, TextField, Card, AppBar, DataGrid, etc.)
- Use MUI's `sx` prop for component-specific styles
- Use MUI's theme system for colors, typography, and spacing tokens
- Use Tailwind CSS only for layout containers (flex, grid, gap, padding, margin, responsive)
- Import from `@mui/material` (not individual deep paths unless tree-shaking requires it)
- Import icons from `@mui/icons-material`
- Custom theme defined in `theme/theme.ts`, wrapped with `ThemeProvider` in root layout

### File Header Comments
When creating a **new** functional code file, add a brief comment at the top (before imports):
1. What the file does — one sentence, plain language
2. Where it fits — what page, feature, or part of the app uses it

Keep it short (2–4 lines). No verbose JSDoc formatting.

**TSX format:**
```tsx
// MemberRow — Renders a single row in the member directory table.
// Shows name, major, year, and pledge class. Used by MemberTable on /members.
```

**Applies to:** components, pages, hooks, helpers, utilities, type definitions, CSS files

**Does NOT apply to:** config files, auto-generated files, env files, markdown, rule files, Firebase config

### Code Style

**TypeScript:**
- Explicit return types on exported functions
- Use `interface` for object shapes, `type` for unions/intersections
- Avoid `any` - use `unknown` and narrow, or define proper types
- Prefer const assertions and readonly where applicable

**React Components:**
- Functional components only, no classes
- Props interface named `[Component]Props`
- Destructure props in function signature
- Group hooks at top, then handlers, then render logic

**Naming:**
- Components: PascalCase (`MemberCard.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- Utils: camelCase (`formatDate.ts`)
- Types: PascalCase (`Member`, `Announcement`)
- Constants: SCREAMING_SNAKE_CASE

**Imports Order:**
1. React/Next.js
2. Third-party (MUI, Firebase)
3. Local components
4. Local utils/hooks
5. Types
6. Styles
