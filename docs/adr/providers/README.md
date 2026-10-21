# Provider Decision Records

These records select an initial provider class for sandbox and production integration. They are implementation gates, not credentials: all secrets stay in the deployment secret manager and every provider call passes tenant/branch authorization and audit boundaries.

## Shared sandbox credential process

1. Create a provider-owned sandbox project/account separate from production and restrict it to synthetic `example.test` users, test cards and non-production media.
2. Store API keys, webhook secrets, OAuth client secrets and encryption keys only in the secret manager under `sandbox/<provider>/<environment>`. The application receives references through environment configuration, never values in Git or fixtures.
3. Register webhook endpoints per environment with signature verification, timestamp/replay protection and provider event idempotency. Persist only the minimum event fields needed for reconciliation; redact raw payloads before logs.
4. Grant the smallest role/scope, rotate every 90 days (or immediately after exposure), and revoke credentials when a sandbox is retired. Record owner, scopes, expiry, key version and last verification in the provider register.
5. Promotion requires contract tests, failure/retry tests, tenant/branch isolation evidence, data-processing review, cost limits and an operator rollback plan. Production credentials are never copied from sandbox.

## Provider selection summary

| Capability | Initial provider | Adapter boundary | Required fallback |
| --- | --- | --- | --- |
| Payment | VNPay (Vietnam), payment adapter + signed webhook | `packages/integration-adapters` / billing module | Manual bank-transfer reconciliation |
| Meeting | Zoom Video SDK/API, meeting adapter + HMAC webhook | online-class module / meeting worker | Provider-neutral meeting link + manual attendance |
| Accounting/ERP | MISA AMIS Open API, accounting outbox adapter | accounting worker | CSV export/import with idempotency key |
| AI | OpenAI-compatible gateway behind redaction/policy layer | AI gateway + review queue | Manual teacher/admin review |
| Object storage | AWS S3-compatible private bucket | storage adapter + signed URL service | Local encrypted filesystem for development only |
| Video transcoding | AWS MediaConvert | media worker job adapter | FFmpeg worker in isolated sandbox |

The selections are revisited before production contract signing, when pricing/region/data-residency changes, or after a provider incident. Switching providers must preserve internal IDs, audit history and tenant boundaries.
