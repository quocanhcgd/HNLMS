# Environment Policy

`NODE_ENV`, `API_PORT`, `WEB_ORIGIN` and `NEXT_PUBLIC_SITE_URL` are non-secret configuration. `DATABASE_URL`, `REDIS_URL`, object-storage credentials and `SESSION_SECRET` are private; they must be injected by the local process or deployment secret store and never committed.

The shared `@hnlms/config` package validates ports and URLs at startup. Production requires a `SESSION_SECRET` of at least 32 characters. Rotate private values through the deployment secret store, restart API/worker processes, and invalidate sessions after a session-secret rotation.
