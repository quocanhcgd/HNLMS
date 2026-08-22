# HN LMS Security Hardening Checklist

- [ ] Run services as a dedicated non-root user.
- [ ] Keep `/etc/hn-lms/hn-lms.env` mode `0600`; never commit secrets.
- [ ] Terminate TLS at Nginx with modern protocols and managed certificates.
- [ ] Enforce security headers, CSRF protection and rate limits at the edge.
- [ ] Keep learner files and recordings private; issue short-lived signed URLs.
- [ ] Validate webhook signatures and reject stale timestamps/replays.
- [ ] Keep audit logs append-only with documented retention.
- [ ] Review PostgreSQL, Redis and object-storage network allowlists.
- [ ] Rotate provider keys and signing keys through the deployment secret manager.
