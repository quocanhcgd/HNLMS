# Backup and Recovery Policy

This policy defines the minimum controls for PostgreSQL and object-storage backups. It applies to every tenant and branch; a backup must never mix tenant boundaries without an explicit, audited export job.

## Encryption and key management

- Backups are encrypted before they enter the backup directory or object storage. Production encryption is performed by the external KMS/HSM command configured in `HN_LMS_BACKUP_ENCRYPT_COMMAND`.
- The command receives two arguments: the temporary plaintext archive and the destination encrypted file. It must fail closed, use envelope encryption, and record the KMS key version in deployment metadata (never in the archive name).
- Raw keys, KMS credentials and decrypted archives must not be committed or logged. Access is least-privilege and separated between backup writers and restore operators.
- Rotate the key-encryption key at least annually and after suspected compromise. Keep old key versions available until all backups encrypted with them have expired.

## PostgreSQL backup

`infra/release-scripts/backup.sh` creates a compressed dump, encrypts it through the KMS hook, writes a SHA-256 checksum, and applies restrictive permissions. Retention is 35 daily, 12 monthly and 7 yearly copies unless a legal hold requires longer retention.

## Restore and evidence

Restore drills run quarterly and after a major database or encryption change. Restore into an isolated project, verify checksum and decryption, run migration compatibility checks, and execute tenant-isolation and application smoke tests. Record operator, timestamp, key version, source artifact, elapsed restore time and findings in the change record.

## Object storage lifecycle and malware quarantine

Objects are private by default, versioned, encrypted with a KMS key and protected from public listing. Lifecycle transitions backups to infrequent-access storage after 30 days and deletes only after the retention period and legal-hold check. Uploaded media is scanned before publication; suspicious objects are moved to a quarantine bucket with deny-read policy, immutable evidence metadata and an incident ID. Only security operators may release or delete quarantined content.

## Targets

Default service targets are **RPO 24 hours** for scheduled database backups and **RTO 4 hours** for a tenant restore. Critical incident response may set stricter targets per contract. A missed backup, failed checksum, unavailable key or restore drill over target is escalated to the incident commander and service owner.
