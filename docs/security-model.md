# Security and authorization model

This document describes the security boundaries implemented by **Diario di Bordo**. It is a description of the current codebase, not a claim that the application is suitable for every threat model.

## Trust boundaries

The browser uses the Supabase **anon key** and never receives the Supabase service-role key or the Cloudinary API secret.

Privileged operations are split between:

- **PostgreSQL Row Level Security (RLS)** for table-level authorization;
- **Supabase Edge Functions** for operations that need service-role privileges;
- **Cloudinary** for media delivery and unsigned browser uploads.

Client-side route guards and hidden buttons are UX controls only. Authorization must still succeed at the database or Edge Function boundary.

## Roles

| Actor | Read | Write / moderation |
| --- | --- | --- |
| Public / anonymous | Contributions, comments and public profile data | None |
| Educator | Same public data | Create and update own contributions; insert own comments; delete own comments; contribution delete is permitted by RLS although the current UI does not expose a delete action |
| Superadmin | Same public data | Update any contribution; delete any comment; manage educator accounts through privileged Edge Functions |

The superadmin is identified by the synthetic account email `admin@diario.internal`. User-management Edge Functions independently verify the caller token and compare the authenticated email with the configured `SUPERADMIN_EMAIL`.

## Database RLS

The schema and policies live in `supabase/migrations/`.

Current high-level rules:

- `profiles`: public SELECT; mutations are performed only through service-role Edge Functions.
- `contributions`: public SELECT; authenticated educators can INSERT/UPDATE/DELETE their own rows; the superadmin can UPDATE any row.
- `comments`: public SELECT; authenticated educators can INSERT and DELETE their own comments; the superadmin can DELETE any comment; UPDATE is intentionally unavailable.

The application therefore intentionally exposes diary content and author display information through the public view. Deployments that require private diary content need a different RLS model.

## User-management Edge Functions

The following functions use the Supabase service role and are restricted to the superadmin:

- `create-user`
- `update-user`
- `deactivate-user`
- `reactivate-user`

The service-role key must exist only in Supabase function secrets / server-side environments.

## Cloudinary upload and deletion

Browser uploads use an **unsigned Cloudinary upload preset**. The preset name is public by design, so the Cloudinary account must enforce appropriate preset restrictions and quota controls.

Media deletion is routed through the `delete-media` Edge Function so the Cloudinary API secret stays server-side.

### Known authorization trade-off

The current `delete-media` function validates that the caller is an authenticated Supabase user, but it does **not** verify that the requested `public_id` belongs to one of that user's contributions.

This was an explicit small-team/non-adversarial trade-off in the current implementation. In a stronger threat model, harden the function by binding deletion to a contribution ID and checking ownership (or superadmin status) server-side before calling Cloudinary.

## Secrets

Public/browser values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

Server-only values include:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPERADMIN_EMAIL`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Never commit real values for server-only secrets.
