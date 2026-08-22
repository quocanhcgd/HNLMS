# Release Operations Runbook

## Release gate

Run `npm install`, all workspace typechecks, `npm test -- --run`, focused Playwright suites and `infra/release-scripts/preflight.sh` on the target native host.

## Backup and migration

Create a database backup before migration, run compatibility preflight, apply migrations, then activate the release symlink. Keep the previous release available for rollback.

## Rollback

Use `infra/release-scripts/rollback.sh`, restore the previous release symlink and verify API/web health before reopening traffic.

## Tenant migration

Run tenant preflight, checksum validation, final sync and cutover in read-only mode. Never mix records between tenant database boundaries.
