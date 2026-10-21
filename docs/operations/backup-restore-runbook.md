# Backup and Restore Runbook

Run `infra/release-scripts/backup.sh` from a protected host with `DATABASE_URL`, `HN_LMS_BACKUP_DIR`, `HN_LMS_BACKUP_ENCRYPT_COMMAND` and `HN_LMS_BACKUP_KEY_REF` supplied by the secret manager. The command must produce an encrypted artifact and `.sha256` sidecar; treat any non-zero exit as a failed backup and page the service owner.

For recovery, choose an artifact covered by retention and legal-hold rules, verify the checksum, decrypt only on an isolated host, restore with a temporary least-privilege role, and run migration, tenant-isolation and API smoke checks. Document RPO/RTO measurements and destroy decrypted material after validation. Follow `infra/backup/restore-drill.md` for quarterly exercises.
