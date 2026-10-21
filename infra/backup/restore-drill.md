# Restore Drill Procedure

1. Open a change record and select a recent encrypted artifact; confirm its checksum and retention/legal-hold status.
2. Provision an isolated PostgreSQL database and object-storage namespace. Do not point the drill at production services.
3. Resolve the KMS key version through the secret manager, decrypt to a protected temporary filesystem, and restore with a least-privilege database role.
4. Run schema/migration compatibility checks, tenant-boundary checks, representative read queries and API health checks. Verify that audit records and consent/deletion markers are intact.
5. Measure time from artifact selection to usable service (RTO) and note the newest recovered record timestamp (RPO).
6. Destroy the isolated database and decrypted temporary files using the platform's secure disposal procedure. Retain only drill evidence, checksums and logs with secrets redacted.

Pass criteria: checksum/decryption succeeds, no cross-tenant rows are observed, smoke tests pass, and measured RPO/RTO meet `infra/backup/README.md` targets. Failures create an incident and a dated remediation owner.
