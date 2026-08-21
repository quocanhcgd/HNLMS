# Database decision: Drizzle ORM + PostgreSQL

- Drizzle ORM is the typed data-access layer.
- `drizzle-kit` generates migrations; migrations live in `infra/migrations`.
- PostgreSQL remains the transactional source of truth.
- Tenant registry resolves organization to a dedicated database URL; tenant URL is never accepted from an untrusted request.
- Pool is created per resolved tenant with bounded max connections.
- Money uses PostgreSQL numeric/decimal representation, not JavaScript number.
- Timestamps use timezone-aware PostgreSQL timestamps and ISO-8601 API values.
- Migrations follow expand/migrate/contract; destructive migration requires preflight and backup.
- T024 only creates foundation; authentication, RLS policy and business entities remain later tasks.
