# Secret and Key Rotation Runbook

1. Create and test the replacement secret/key in the secret manager; retain the previous version for the documented overlap window.
2. Update the API, worker, database and object-storage references through protected deployment configuration. Never put values in source, logs or tickets.
3. Restart or hot-reload consumers, verify `/health`, authentication, notification delivery, backup encryption and object access, then revoke the old credential/key version.
4. Revoke all sessions and provider tokens when an authentication secret is compromised; rotate webhook signing keys and invalidate outstanding reset/MFA artifacts as applicable.
5. Record key version, scope, operator, timestamps and verification evidence. For suspected compromise, declare an incident, preserve legal-hold evidence and shorten the overlap window.

Backup encryption key-encryption keys follow the retention rule: old versions remain decrypt-capable until every dependent artifact expires or is re-encrypted.
