# AKPsi UW — Member Portal

An internal web app for the Alpha Kappa Psi (AKPsi) chapter at the University of Washington. AKPsi is a co-ed professional business fraternity focused on professional development, brotherhood, and community service. This portal serves as a centralized hub for members, pledges, and alumni to stay connected, access chapter resources, and build on the chapter's history — replacing scattered group chats, spreadsheets, and email threads with a single organized platform.

## Features

### Announcements
Post and view chapter-wide announcements with rich text, images, and timestamps. Keeps all members informed about events, meetings, and chapter updates in one place.

### Member Directory
A searchable, filterable registry of all active members, pledges, and alumni. Each profile includes name, major, pledge class, graduation year, role, and contact info — with members in control of what's visible to others.

### Gallery
A Pinterest-style masonry photo gallery for chapter memories and events. Supports linked images across 2–5 responsive columns with a shortest-column-first layout to keep things balanced. Click any photo to open a full-screen lightbox.

### Family Tree
An interactive pan/zoom graph visualizing big/little mentorship relationships across all pledge classes. Each pledge class occupies its own generational row, with color-coded family lines and ghost nodes for alumni bigs who predate the app. Click any member node to view their full profile, big, and littles.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **UI:** shadcn/ui + Tailwind CSS 4
- **Graph:** React Flow (`@xyflow/react`)
- **Backend:** Firebase (Auth, Firestore, Storage, Hosting)
- **Auth:** Google Sign-In restricted to `@uw.edu` accounts

## Getting Started

```bash
npm install
cp .env.local.example .env.local  # add your Firebase config
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with a `@uw.edu` Google account to access the portal.
