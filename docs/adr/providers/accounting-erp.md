# Accounting/ERP Provider ADR

**Decision:** integrate MISA AMIS Open API through an outbox worker. Invoice, payment, refund and payroll records remain authoritative in HN-LMS until an acknowledged sync is recorded.

**Sandbox:** use a separate MISA test company and synthetic chart of accounts. Store OAuth client credentials and refresh tokens in the secret manager. Send only approved accounting fields, include organization/branch and idempotency key, and redact taxpayer or learner details from logs.

**Failure/fallback:** retry with dead-letter after bounded attempts; preserve `pending/failed` status and provide CSV export/import. Never silently drop or duplicate entries.
