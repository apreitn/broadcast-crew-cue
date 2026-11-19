# Broadcast Crew Cue

Build an internal web application for a live sports broadcast production team called "BroadcastOps Planner".

Core features:

Events Dashboard: A clean list/calendar view of upcoming live sports broadcasts (e.g., Football Match, Basketball League, Hockey Finals) with date, start/end time, venue, and status (Scheduled, Live, Completed).

Crew & Gear Assignment: Inside each event, allow assigning crew members (Director, Camera Operator, Sound Engineer, Graphics Operator) and equipment kits (4K Camera Rig A, Drone Unit, Audio Mixer, LiveU Backpack).

Conflict Detection (Crucial): Automatically warn with a red alert badge if a crew member or equipment kit is double-booked for overlapping event times.

Schedule Export: A button to export the selected event's full call sheet (schedule, assigned crew, gear checklist) to a clean CSV file or printable PDF view.

Design & UX: Modern dark-mode-friendly broadcast control room aesthetic (clean slate/gray tones, high-contrast status badges, intuitive table and card layout). Pre-populate with 3 realistic sample sports events, 6 crew members, and 6 equipment items so the app works immediately.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://broadcast-crew-cue.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1164b260-0762-4ba7-8215-b3058849b4eb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
