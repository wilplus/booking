# App description for Lovable — design improvement

Use this to describe the app to Lovable so it can suggest or implement design improvements while keeping behavior and structure intact.

---

## What this app is

**One-on-one lesson booking system** for a single teacher/tutor. Clients book lessons by choosing duration, date, and time; they get confirmation emails and a link to manage (view/cancel) their booking. The teacher has an admin dashboard to manage availability, lesson types, bookings, Google Calendar sync, and settings.

- **Domain:** Education / tutoring / coaching — professional, trustworthy, calm.
- **Users:** (1) **Clients** — public booking flow + manage-booking page; (2) **Teacher** — admin (sign-in with Google, whitelisted email).

---

## Tech stack (keep as-is for logic)

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS, `tailwindcss-animate`
- **Auth:** NextAuth (Google provider, admin only)
- **DB:** PostgreSQL (Supabase) via Prisma
- **Integrations:** Google Calendar, Resend (transactional email), optional Stripe payment link

---

## Pages and flows

### Public (client-facing)

1. **Home (`/`)**  
   - Single teacher: photo, name, bio, lesson types (duration + price).  
   - **Wizard:** 1) Choose duration → 2) Choose date (grid of available days) → 3) Choose time slot → 4) Form (name, email) → 5) Confirmation with “Manage booking” link.  
   - Max width ~lg, centered; simple back links between steps.

2. **Manage booking (`/manage/[token]`)**  
   - Shows one booking: when, duration, teacher name, “Join video call” if meet link exists.  
   - Actions: Cancel booking (with confirm), “Book another lesson” link.  
   - States: loading, not found, cancelled, past.

3. **Admin sign-in (`/admin/sign-in`)**  
   - Centered card: logo, “Admin sign in”, short copy, “Sign in with Google” button.  
   - Error states: AccessDenied (amber), generic error (red).

### Admin dashboard (after sign-in)

- **Layout:** Top header (brand “Admin”, user email, Sign out); main content max-w-6xl, padding.
- **Dashboard (`/admin`):** Title “Dashboard”, short description, nav links as cards: Availability, Lesson types, Settings, Bookings, Calendar.
- **Availability (`/admin/availability`):** Weekly schedule (day, start/end time, active toggle) + date overrides (blocked days or custom hours + reason).
- **Lesson types (`/admin/lessons`):** List of durations (e.g. 30/60/90 min) with price and currency.
- **Settings (`/admin/settings`):** Profile (name, bio, photo URL), booking rules (buffer, min notice, max advance days), Stripe link, post-session message, Google Calendar ID (read-only if connected).
- **Bookings (`/admin/bookings`):** Filters (status, date range), table (date, time, client, duration, status, links to view/manage and meet).
- **Calendar (`/admin/calendar`):** Google Calendar connect status and OAuth flow.

---

## Current design system (baseline)

- **Colors:** Gray scale primary — `gray-50` background, `gray-900` for primary text and primary buttons, `gray-200` borders, `gray-600/500` secondary text. Accent: `blue-600` for links (e.g. “Join video call”). Status: green (confirmed), red (cancelled), amber (warnings, rescheduled).
- **Typography:** System font (no custom font family), `text-xl`/`text-2xl` for main headings, `text-sm` for labels and secondary.
- **Components:**  
  - Cards: `rounded-xl border border-gray-200 bg-white p-6 shadow-sm`.  
  - Buttons: primary `bg-gray-900 text-white hover:bg-gray-800`, secondary `border border-gray-200/300 bg-white`.  
  - Inputs: `rounded border border-gray-300 px-3 py-2`.  
  - Badges: `rounded-full px-2 py-0.5 text-xs` with semantic colors.
- **Logo:** Small square icon (emoji 🗓️ in `bg-gray-900`), optional text “Book a Lesson” or “Admin” next to it.
- **Layout:** Centered single column for public (max-w-lg); admin content max-w-6xl. No sidebar; admin nav is dashboard cards + header.

---

## What to preserve

- All existing routes, API contracts, and auth (NextAuth, admin-only).
- Wizard flow on home (duration → date → time → form → done).
- Manage-booking token flow and cancel behavior.
- Admin structure: header + dashboard links + individual pages with current filters and tables.
- Responsive behavior (things work on mobile even if minimal).
- Tailwind-only styling (no new CSS framework).

---

## Design improvement goals (for Lovable)

1. **Visual identity**  
   - Give the app a clearer, more distinctive look (e.g. typography, color palette, spacing) while staying professional and calm.  
   - Consider a simple custom or Google font for headings.  
   - Optional: light brand color (e.g. soft blue or teal) for primary actions and key UI elements instead of only gray-900.

2. **Hierarchy and readability**  
   - Clearer heading levels and spacing on home and admin.  
   - Better separation between sections (e.g. teacher card vs booking steps).  
   - Improve contrast and focus states for accessibility.

3. **Components and polish**  
   - More consistent buttons (primary vs secondary vs danger), input focus states, and error styling.  
   - Replace raw native `select`/`input` where it makes sense with a bit more polish (still Tailwind).  
   - Consider subtle transitions (e.g. step changes, hover) using `tailwindcss-animate` or simple transitions.

4. **Admin UX**  
   - Make the admin feel like a single, cohesive dashboard (e.g. sidebar nav or clearer nav pattern instead of only dashboard cards).  
   - Improve tables (bookings): readability, row states, maybe sticky header.  
   - Clearer visual feedback for “saving” and “saved” on availability, settings, lessons.

5. **Public booking flow**  
   - Make the wizard steps more scannable (e.g. step indicator or clearer “you are here”).  
   - Improve date/time selectors visually (still same data: available dates grid, time slots).  
   - A more welcoming confirmation and manage-booking page (trust, clarity).

6. **Mobile**  
   - Ensure touch targets and spacing work well on small screens; improve any cramped grids (e.g. date grid) if needed.

---

## Out of scope for design pass

- Changing backend, API, or database schema.  
- Adding new features (e.g. payments, multi-teacher).  
- Replacing NextAuth or auth flow.

---

## File structure (reference)

- **App Router:** `app/page.tsx` (home), `app/manage/[token]/page.tsx`, `app/admin/sign-in/page.tsx`, `app/admin/(dashboard)/*.tsx` (layout, page, availability, bookings, calendar, lessons, settings).
- **Shared:** `app/layout.tsx`, `app/globals.css`, `components/Logo.tsx`, `tailwind.config.ts`.
- **Emails:** `components/emails/*` (React Email) — no UI change needed for this design pass.

Use this description in Lovable to improve the design of the existing app without changing its behavior or tech stack.
