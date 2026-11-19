# BroadcastOps Planner

An internal resource, crew, and gear scheduling prototype built for live sports broadcast production teams. Designed to replace manual spreadsheets, prevent double-booking conflicts, and generate instant printable call sheets.

- Live Demo: https://broadcast-crew-cue.lovable.app/events (Click "Enter Demo Mode (No Login Required)" on the login screen to explore immediately)

---

## Key Features

- Broadcast Schedule Dashboard: Overview of live, scheduled, and completed sports broadcasts with both List and Calendar views.
- Crew & Gear Assignment: Assign directors, camera operators, sound engineers, and equipment kits to specific production shifts.
- Automated Conflict Detection: Real-time detection of double-booked crew members or equipment across overlapping broadcast times with alert badges.
- One-Click Call Sheet Export: Export event schedules, crew contacts, and gear checklists to CSV or Print-ready PDF.

---

## Tech Stack & AI-Assisted Workflow

- Frontend: React, TypeScript, Tailwind CSS, Shadcn UI
- Backend & Auth: Supabase (Lovable Cloud)
- Workflow: Rapid UI and state prototyping in Lovable, followed by manual QA auditing, bug fixing, and regression testing in Codex (11/11 automated tests passing).

---

## Engineering Review & QA Fixes

As part of my workflow, I treated the AI-generated output as an untrusted draft and ran manual QA & security checks before deployment. Here are the real issues caught, fixed, and verified:

1. Missing Chronological Time Validation
- Issue: The initial AI-generated "New broadcast" form allowed saving invalid time ranges (e.g., Off air earlier than On air).
- Fix: Implemented strict chronological validation (Crew call <= On air < Off air) with inline error messages blocking invalid submissions.

2. Broken OAuth Provider & Auth Friction
- Issue: AI scaffolded a non-functional "Continue with Google" button without OAuth credentials configured in the backend.
- Fix: Removed the broken OAuth button and implemented a one-click Demo Mode so stakeholders can explore /events immediately without registration.

3. Modal Input Layout Overlap
- Issue: Four date/time inputs squeezed into a single flex row caused native picker icons to overlap on smaller screens.
- Fix: Refactored the form inputs into a responsive 2x2 grid layout.

4. Hardcoded Crew Roles
- Issue: Crew roles were restricted to 4 static preset options.
- Fix: Added support for custom role names (e.g., Replay Operator, Producer) alongside preset roles.

5. Database Access Rules (RLS) Audit
- Note: Audited permissive Row-Level Security policies flagged during pre-publish security review ("Some access rules let everyone through"). Documented and scoped for isolated demo usage, with role-based access control (RBAC) planned for production hardening.
