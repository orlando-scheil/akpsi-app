# akpsi-app

A web app for the Alpha Kappa Psi (AKPsi) chapter at UW. Built for members, officers, and pledges to stay connected and organized.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19 and TypeScript
- **UI:** shadcn/ui components with Tailwind CSS 4
- **Icons:** Lucide React (`lucide-react`)
- **Graph:** React Flow (`@xyflow/react`) for the family tree
- **Table:** TanStack Table (`@tanstack/react-table`) for the member directory
- **Backend:** Firebase (Auth, Firestore, Storage, Hosting)
- **Styling approach:** Use shadcn/ui components for all UI. Use Tailwind utility classes for layout, spacing, and responsive design. Custom theme tokens defined in `lib/theme.ts` and `app/globals.css`.

## Project Structure

```
app/                    # Next.js App Router pages
  (auth)/               # Auth-gated layout group
    announcements/      # Announcements feed
    events/             # Events list and calendar
    family-tree/        # Interactive big/little family tree
    gallery/            # Photo gallery
    members/            # Member directory
    profile/            # Current user's profile editor
    layout.tsx          # Auth-gated layout with Navbar
  login/                # Public login page
  layout.tsx            # Root layout with font/global styles
  page.tsx              # Redirect to /announcements or /login
components/             # Reusable React components (grouped by feature)
  announcements/        # AnnouncementCard, AnnouncementFeed, CommentsModal, CreateAnnouncementModal
  events/               # EventCard, EventFormModal, EventsCalendarView, EventsFeed, EventsListView
  family-tree/          # FamilyTreeGraph, GhostNode, MemberDetailPanel, MemberNode
  gallery/              # AddPhotoModal, GalleryFeed, GalleryLightbox, GalleryPhotoCard
  members/              # MemberDirectory, MemberRow, MemberTable
  profile/              # ProfileForm
  ui/                   # shadcn/ui primitives (button, card, dialog, input, etc.)
  Navbar.tsx            # Top navigation bar
lib/                    # Utilities, Firebase config, hooks, and context
  firebase.ts           # Firebase app initialization
  auth.tsx              # Auth helpers and AuthContext
  firestore.ts          # Firestore CRUD helpers
  storage.ts            # Firebase Storage helpers
  announcements-context.tsx  # Session-cached announcements state
  events-context.tsx    # Session-cached events state
  gallery-context.tsx   # Session-cached gallery state
  events.ts             # Google Calendar API integration
  build-family-tree.ts  # Family tree graph data builder
  search-members.ts     # Member search/filter logic
  theme.ts              # App color tokens and theme config
  utils.ts              # General utilities (cn, etc.)
  mock-data.ts          # Dev/seed mock data
types/                  # TypeScript type definitions
  announcement.ts
  event.ts
  gallery.ts
  member.ts
scripts/                # One-off scripts (e.g., seed-member.ts)
```

## Features

### 1. Announcements
- Members can post announcements (title, body, timestamp, author)
- Supports likes and comments (via CommentsModal)
- Stored in Firestore `announcements` collection; session-cached via `announcements-context`

### 2. Member Directory
- Searchable, filterable registry of all active members and pledges
- Self-supplied profiles: name, major, sub-concentration, year, big (mentor), pledge class, phone, email
- Members control which contact info is visible to others
- Stored in Firestore `members` collection

### 3. Profile Editor
- Members edit their own profile at `/profile`
- Includes a combobox for selecting a big from existing members

### 4. Gallery
- Pinterest-style masonry photo grid (2–5 responsive columns)
- Linked images with shortest-column-first layout
- Full-screen lightbox on click
- Officers can shuffle order and delete photos
- Stored in Firestore `gallery` collection; session-cached via `gallery-context`

### 5. Events
- List and calendar views for chapter events
- Google Calendar API integration to sync/display events
- Officers can create events via EventFormModal
- Stored in Firestore `events` collection; session-cached via `events-context`

### 6. Family Tree
- Interactive pan/zoom graph built with React Flow
- Visualizes big/little mentorship relationships across pledge classes
- Each pledge class occupies its own generational row
- Color-coded family lines; ghost nodes for alumni bigs who predate the app
- Click a member node to open a detail panel with their profile, big, and littles

## Authentication

- Firebase Auth with Google sign-in, restricted to UW email domain (`@uw.edu`)
- Cross-check authenticated email against approved members list (Firestore)
- Unauthenticated users see login page only
- Future: officer vs member roles for posting permissions

## Conventions

### General
- Use `"use client"` only when components need interactivity; prefer Server Components
- All Firebase client calls go through helpers in `lib/`
- One component per file, named exports, PascalCase filenames for components
- Keep pages thin — delegate logic to components and hooks

### shadcn/ui + Tailwind Styling
- Use shadcn/ui components (`components/ui/`) for all interactive UI (Button, Input, Card, Dialog, Select, etc.)
- Use Lucide React for icons
- Use Tailwind utility classes for layout, spacing, typography, and responsive design
- Color tokens and CSS variables are defined in `app/globals.css` and `lib/theme.ts`
- Do not use MUI (`@mui/material`) — the project has fully migrated to shadcn/ui

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
