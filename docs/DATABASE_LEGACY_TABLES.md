# Legacy database tables

This document records tables that exist from early migrations but are **not** used by current application code, so engineers do not accidentally build on the wrong source of truth.

## `public.customers`

- **Origin**: [`supabase/migrations/20240320000000_create_customers_table.sql`](../supabase/migrations/20240320000000_create_customers_table.sql)
- **Decision**: **Do not use** for billing or subscription logic. The app keys Stripe to users via **`profiles.customer_id`** (Stripe Customer ID). There are no TypeScript queries against `public.customers` in this repo.
- **Why not remove the migration**: The migration may already be applied in production; dropping the table is a separate, deliberate ops task if ever desired (not required for correctness).

## Canonical references

| Concern | Table / column |
|--------|-----------------|
| Stripe customer link | `profiles.customer_id` |
| Auth email | `auth.users.email` (mirrored to `profiles.email` via triggers) |
| NFR / comped access | `user_management.user_email` (updated when auth email changes via `20260416120000_sync_user_management_email_on_auth_update.sql`) |
