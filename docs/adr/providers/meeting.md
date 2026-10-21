# Meeting Provider ADR

**Decision:** use Zoom Video SDK/API for online classes behind a meeting adapter. HN-LMS owns class/session/attendance records and stores only provider IDs and permission-scoped recording references.

**Sandbox:** use a separate Zoom account/project and synthetic attendees. Keep OAuth client ID/secret, SDK key and webhook secret in the secret manager. Validate HMAC/timestamp, deduplicate event IDs and map participants by internal enrollment, never by untrusted display name.

**Failure/fallback:** queued reconciliation retries transient events; unmatched participants are warnings for staff. If Zoom is unavailable, show a provider-neutral meeting URL/manual attendance mode and do not fabricate attendance or recordings.
