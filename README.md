# Bookfolio

Bookfolio is a monorepo for a personal library platform focused on helping people manage the paper books and ebooks they own.

The project starts with a lean MVP for personal shelf management, then expands toward reviews, reading insights, community features, and long-term reading management.

## Vision

Bookfolio aims to become a personal reading home where users can:

- register and organize owned books
- track reading status and personal impressions
- build a long-term archive of their reading life
- discover patterns through stats and reading insights
- connect with other readers through community features

## Apps

- `apps/web`: Next.js landing page, auth entry, dashboard, and internal API routes
- `apps/mobile`: Flutter mobile app for personal library management
- `packages/shared`: shared domain models, DTOs, and constants

## MVP Scope

The first release focuses on validating the core value of `personal library management`.

- Email authentication with Supabase
- Book CRUD for personal shelves
- Reading status, rating, and memo
- Barcode-driven ISBN lookup flow on mobile
- Basic web dashboard and marketing site

## Planned Beyond MVP

After the MVP is stable, Bookfolio is planned to expand in stages.

### 1. Personal Library Expansion

- richer book metadata and cover handling
- custom shelves, tags, and categories
- wishlist and purchase tracking
- lending and borrowing history
- duplicate copy management for the same title

### 2. Reading Management

- reading start and finish dates
- reading goals by month or year
- daily reading logs and progress tracking
- reread history
- reading streaks and reminders

### 3. Reviews and Notes

- structured reviews beyond simple memo fields
- favorite quotes and highlight archiving
- spoiler-safe review writing
- private and public review visibility settings
- review drafts and revision history

### 4. Statistics and Insights

- books completed by month, year, author, genre, and format
- average rating trends
- most-read authors and publishers
- paper book vs ebook reading ratio
- unfinished book patterns and reading habit insights

### 5. Community Features

- follow other readers
- like and comment on reviews
- activity feeds
- community bookshelves and recommendations
- themed reading groups or challenges

### 6. Discovery and Recommendations

- personalized recommendations from owned books and ratings
- curated collections
- similar book suggestions
- trending books in the community
- recommendation experiments based on reading patterns

### 7. Platform and Operations

- push notifications and reminder flows
- admin tools and moderation features
- analytics dashboards for service health
- better search and indexing
- staged rollout support for new features

## Suggested Roadmap

### Phase 1

Establish the personal shelf foundation.

- auth
- book registration and management
- rating and memo
- barcode lookup

### Phase 2

Strengthen individual reading workflows.

- reading logs
- goals
- custom shelves and tags
- better dashboards and stats

### Phase 3

Open the service toward shared experiences.

- public reviews
- feeds
- social interactions
- recommendation systems

## Local Setup

1. Create a Supabase project.
2. Apply the SQL in `supabase/migrations/0001_bookfolio_mvp.sql`.
3. Copy `.env.example` to `.env.local` for the web app and fill in the values.
4. Install workspace dependencies with your preferred package manager.
5. Configure Flutter SDK locally before running `apps/mobile`.

## Notes

- The repo is scaffolded to be generator-free because the current environment does not have Flutter or a working Node package runtime available.
- The external ISBN provider is abstracted behind the web app service layer so it can be replaced later.
- The architecture is intentionally designed so the MVP can grow into reviews, stats, community, and reading management without a full rebuild.
