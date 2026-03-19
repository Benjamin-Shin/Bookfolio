# Bookfolio

Bookfolio is a monorepo for the MVP of a personal library service.

## Apps

- `apps/web`: Next.js landing page, auth entry, dashboard, and internal API routes
- `apps/mobile`: Flutter mobile app for personal library management
- `packages/shared`: shared domain models, DTOs, and constants

## MVP

- Email authentication with Supabase
- Book CRUD for personal shelves
- Reading status, rating, and memo
- Barcode-driven ISBN lookup flow on mobile
- Basic web dashboard and marketing site

## Local setup

1. Create a Supabase project.
2. Apply the SQL in `supabase/migrations/0001_bookfolio_mvp.sql`.
3. Copy `.env.example` to `.env.local` for the web app and fill in the values.
4. Install workspace dependencies with your preferred package manager.
5. Configure Flutter SDK locally before running `apps/mobile`.

## Notes

- The repo is scaffolded to be generator-free because the current environment does not have Flutter or a working Node package runtime available.
- The external ISBN provider is abstracted behind the web app service layer.

