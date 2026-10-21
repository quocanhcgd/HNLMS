# Object Storage Provider ADR

**Decision:** use AWS S3-compatible private buckets with server-side KMS encryption, versioning, lifecycle and malware quarantine. HN-LMS issues short-lived signed URLs only after authorization is rechecked.

**Sandbox:** use a separate account/bucket and non-personal fixture media. Store access role/endpoint references in the secret manager; prefer workload identity over long-lived access keys. Block public ACLs, listing and cross-tenant prefixes.

**Failure/fallback:** uploads remain pending until scan/processing succeeds; failed or suspicious objects enter quarantine. Development may use a local encrypted filesystem adapter, never production credentials.
