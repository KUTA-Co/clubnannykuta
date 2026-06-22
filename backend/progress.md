# Club Nanny Backend Progress — ARCHIVED / SUPERSEDED

> ⚠️ **This file is archived and out of date. Do not action items from it.**
>
> It described an earlier architecture (SQL Server with `create_tables.sql` / `cn_dev_db`, a
> 5-step `Register.tsx` family flow with a Persona "liveliness check", a `NannyRegister.tsx`
> with a ZAR 15,000 registration fee, and a `FamilyDashboard.tsx` / `familyController.js`).
> **None of those files or that database exist in the current codebase.** The project now runs on
> **MongoDB + Mongoose**, and the nanny program uses **application forms**
> (`src/pages/FamilyApplication.tsx`, `src/pages/NannyApplication.tsx`), not that registration flow.
>
> The "TODO – Must Fix Before Production" items that used to live here (LinkedIn-required toggle,
> liveliness check, nanny registration fee) referred to that deprecated design and are **not** real
> outstanding work.

## Where to look instead

| For… | See |
|------|-----|
| Architecture, commands, deployment, env vars | `CLAUDE.md` (repo root) |
| Club Sitting Phase 1 scope & requirements | `CLUB_SITTING_SCOPE.md` |
| Club Sitting QA / testing checklist | `CLUB_SITTING_TESTING.md` |
| Current finalization roadmap | (handed off separately; see Club Sitting work) |

Database is schemaless Mongoose — there are **no SQL migrations**. Connection is in
`backend/src/config/database.js` via `MONGODB_URI`.
