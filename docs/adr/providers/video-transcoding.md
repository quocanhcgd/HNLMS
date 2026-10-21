# Video Transcoding Provider ADR

**Decision:** use AWS MediaConvert through a queue-backed worker. Original media stays private; output manifests and renditions retain tenant/branch scope and malware-processing state.

**Sandbox:** use a separate account/queue and short synthetic clips. Store role ARN, endpoint and signing references in the secret manager. Restrict codecs, duration, size and concurrency to a cost ceiling; do not send private learner media without consent/legal basis.

**Failure/fallback:** retry idempotently and quarantine failed outputs. FFmpeg can run in an isolated worker for development or provider outage, with the same validation and audit contract.
