<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- All planner data (events, crew, gear, assignments) loads as one `plannerQuery` and conflicts are derived client-side via `buildConflictIndex` in `src/lib/conflicts.ts` — the dataset is small and conflict checks need every booking at once.
- Double-booking = same crew member or kit on two events whose on-air windows (start_at→end_at) overlap; back-to-back is not a conflict. Assignments warn, never block. Covered by `src/lib/conflicts.test.ts`.
- Every signed-in user is a team member with full read/write; app pages live under `src/routes/_authenticated/` (client-only gate). Add roles via a separate `user_roles` table if access ever needs splitting.
- Colors are semantic tokens in `src/styles.css` (status: live/scheduled/completed, conflict, ok); the app is dark by default and `.print-sheet` swaps to paper tokens for the printable call sheet.
