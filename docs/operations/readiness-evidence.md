# Readiness Evidence Register

Last local verification: **2026-08-25**. This register records reproducible checks; it does not waive production rehearsal requirements.

## Passed locally

| Area | Evidence | Result |
| --- | --- | --- |
| API runtime | `GET http://localhost:4000/health` | 200 / `status: ok` |
| Web runtime | `GET http://localhost:3220/` using isolated `NEXT_DIST_DIR` | 200 |
| Authorization | `npm run test:authorization` | 32 tests passed |
| Migrations | `npm run test:migration` | 5 tests passed |
| Media/finance/meeting/resilience | Focused Vitest command for multimedia, finance, meeting and resilience | 12 tests passed |
| Secret scan | `npm run ci:secret-scan` | 584 tracked files checked |
| License scan | `npm run ci:license-scan` | 23 runtime dependencies checked |

## Still required before production data

- KMS/secret-manager ownership, key rotation and credential verification in the target environment.
- Encrypted offsite backup and an isolated restore drill with measured RPO/RTO.
- Provider sandbox contract/reconciliation and outage fallback exercises for payment, meeting, ERP, AI and media.
- Monitoring, alerting, queue backlog/dead-letter and native install/rollback rehearsal.
- Performance/SLO dataset and a documented dependency vulnerability exception or remediation.

Run `npm run readiness:production` before any production-data or production-traffic change. Attach its JSON output and the evidence above to the release change record.
