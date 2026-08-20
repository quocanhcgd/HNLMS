# Native Deployment Skeleton

This directory defines the Debian 12+/Ubuntu LTS baseline without Docker.

## Install locations

- Releases: `/opt/hn-lms/releases/{version}`
- Active symlink: `/opt/hn-lms/current`
- Environment: `/etc/hn-lms/hn-lms.env` mode `0600`
- Runtime data: `/var/lib/hn-lms`
- Logs: journald and `/var/log/hn-lms` when file output is enabled
- Service account: `hnlms:hnlms`, no interactive shell

## Release flow

1. Build an immutable `.tgz` artifact in CI and produce SHA-256 file.
2. Run `preflight.sh` and database backup/migration preflight.
3. Run `install-release.sh VERSION ARTIFACT CHECKSUM`.
4. Run migrations using the release's migration runner when T024 is implemented.
5. Run `activate.sh VERSION`.
6. Observe logs/metrics and run smoke tests.
7. Run `rollback.sh` if health or validation fails.

Scripts never delete old releases. Cleanup requires a separate reviewed retention procedure.

## TLS

The provided Nginx file listens on HTTP only as a template. Production must add managed TLS certificates, redirect HTTP to HTTPS, HSTS after validation, and the real `server_name` before release approval.
